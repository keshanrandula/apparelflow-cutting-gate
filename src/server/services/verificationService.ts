import { prisma } from '@/lib/prisma';
import { Role, OrderStatus, Decision, ItemStatus } from '@prisma/client';
import { SessionPayload } from '../auth/session';
import { requireRole } from '../auth/rbac';
import { NotFoundError, BusinessRuleError } from '../http';
import { assertTransition } from '../domain/stateMachine';
import { computeItemStatus, computeFabricWastagePct } from '../domain/calculations';
import { SaveComponentCountsInput, VerifyOrderInput, StartSewingInput } from '../validators/verification.schema';

/**
 * Updates physical component actual counts during verifier inspection
 * Automatically recomputes GREEN/YELLOW/RED status server-side
 */
export async function saveComponentCounts(
  session: SessionPayload,
  orderId: string,
  input: SaveComponentCountsInput
) {
  requireRole(session, [Role.cutting_verifier]);

  const order = await prisma.cuttingOrder.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    throw new NotFoundError(`Cutting order with ID '${orderId}' not found.`);
  }

  if (order.status !== OrderStatus.PENDING_VERIFICATION) {
    throw new BusinessRuleError(
      `Cannot update component counts. Order '${order.orderNo}' is in '${order.status}' status (must be PENDING_VERIFICATION).`
    );
  }

  return prisma.$transaction(async (tx) => {
    for (const countItem of input.counts) {
      const existingItem = order.items.find((i) => i.componentId === countItem.componentId);
      if (existingItem) {
        const status = computeItemStatus(countItem.actualQty, existingItem.expectedQty);
        await tx.verificationItem.update({
          where: { id: existingItem.id },
          data: {
            actualQty: countItem.actualQty,
            status: status,
          },
        });
      }
    }

    return tx.cuttingOrder.findUniqueOrThrow({
      where: { id: order.id },
      include: {
        recipe: true,
        items: {
          include: { component: true },
          orderBy: { component: { componentName: 'asc' } },
        },
      },
    });
  });
}

/**
 * Verifier Gatekeeper Decision (APPROVED | REJECTED)
 * - If APPROVED: enforces that ALL components are GREEN or YELLOW. Any RED => HTTP 422 BusinessRuleError.
 * - Computes fabric wastage % and appends immutable VerificationLog.
 */
export async function verifyOrder(
  session: SessionPayload,
  orderId: string,
  input: VerifyOrderInput
) {
  requireRole(session, [Role.cutting_verifier]);

  const order = await prisma.cuttingOrder.findUnique({
    where: { id: orderId },
    include: {
      recipe: true,
      items: {
        include: { component: true },
      },
    },
  });

  if (!order) {
    throw new NotFoundError(`Cutting order with ID '${orderId}' not found.`);
  }

  return prisma.$transaction(async (tx) => {
    if (input.decision === Decision.APPROVED) {
      // 1. Assert state transition
      assertTransition(order.status, OrderStatus.VERIFIED, order.orderNo);

      // 2. Recompute and validate all component items
      const redComponents: string[] = [];
      for (const item of order.items) {
        const computedStatus = computeItemStatus(item.actualQty, item.expectedQty);
        if (computedStatus === ItemStatus.RED) {
          redComponents.push(
            `${item.component.componentName} (Actual: ${item.actualQty} / Expected: ${item.expectedQty})`
          );
        }
      }

      // Strict Gatekeeper Rule: Approval is rejected if ANY component is RED
      if (redComponents.length > 0) {
        throw new BusinessRuleError(
          `Approval Rejected: ${redComponents.length} component(s) have shortages: ${redComponents.join(', ')}. All components must meet or exceed expected quantities.`
        );
      }

      // 3. Compute fabric wastage percentage
      const { wastagePct } = computeFabricWastagePct(
        order.actualFabricYds,
        order.recipe.stdFabricYards,
        order.targetQty
      );

      // 4. Update order to VERIFIED
      const updatedOrder = await tx.cuttingOrder.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.VERIFIED,
          verifiedById: session.userId,
          verifiedAt: new Date(),
          wastagePct: wastagePct,
        },
        include: {
          recipe: true,
          items: {
            include: { component: true },
            orderBy: { component: { componentName: 'asc' } },
          },
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          verifiedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // 5. Append immutable VerificationLog
      await tx.verificationLog.create({
        data: {
          orderId: order.id,
          verifierId: session.userId,
          decision: Decision.APPROVED,
          wastagePct: wastagePct,
          timestamp: new Date(),
        },
      });

      return updatedOrder;
    } else {
      // Rejection branch
      assertTransition(order.status, OrderStatus.REJECTED, order.orderNo);

      const note = input.rejectionNote || 'Rejected by verifier during inspection.';

      const updatedOrder = await tx.cuttingOrder.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.REJECTED,
          verifiedById: session.userId,
          verifiedAt: new Date(),
        },
        include: {
          recipe: true,
          items: {
            include: { component: true },
            orderBy: { component: { componentName: 'asc' } },
          },
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          verifiedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // Append immutable VerificationLog for rejection
      await tx.verificationLog.create({
        data: {
          orderId: order.id,
          verifierId: session.userId,
          decision: Decision.REJECTED,
          rejectionNote: note,
          timestamp: new Date(),
        },
      });

      return updatedOrder;
    }
  });
}

/**
 * Sewing Floor Intake: Initiates sewing on an approved (VERIFIED) cutting order
 */
export async function startSewingJob(
  session: SessionPayload,
  orderId: string,
  input: StartSewingInput
) {
  requireRole(session, [Role.sewing_supervisor]);

  const order = await prisma.cuttingOrder.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new NotFoundError(`Cutting order with ID '${orderId}' not found.`);
  }

  // Assert state machine transition: VERIFIED -> SEWING_STARTED
  assertTransition(order.status, OrderStatus.SEWING_STARTED, order.orderNo);

  return prisma.$transaction(async (tx) => {
    // 1. Create or upsert sewing job record
    const sewingJob = await tx.sewingJob.upsert({
      where: { orderId: order.id },
      update: {
        startedById: session.userId,
        startedAt: new Date(),
        notes: input.notes,
      },
      create: {
        orderId: order.id,
        startedById: session.userId,
        startedAt: new Date(),
        notes: input.notes,
      },
      include: {
        startedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // 2. Update order status to SEWING_STARTED
    const updatedOrder = await tx.cuttingOrder.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.SEWING_STARTED,
      },
      include: {
        recipe: true,
        items: {
          include: { component: true },
        },
        sewingJobs: true,
      },
    });

    return {
      order: updatedOrder,
      sewingJob,
    };
  });
}
