import { prisma } from '@/lib/prisma';
import { Role, OrderStatus, Decision, ItemStatus } from '@prisma/client';
import { SessionPayload } from '../auth/session';
import { requireRole } from '../auth/rbac';
import {
  NotFoundError,
  BusinessRuleError,
  InvalidTransitionError,
  ValidationError,
} from '../http';
import { computeItemStatus, computeWastagePct } from '../domain/trafficLight';
import {
  CountItemInput,
  StartSewingInput,
  VerifyOrderInput,
} from '../validators/verification.schema';

/**
 * Gatekeeper Verification Sheet:
 * Returns component list with expected and currently saved counts for inspection
 */
export async function getVerificationSheet(session: SessionPayload, orderId: string) {
  requireRole(session, [Role.cutting_verifier]);

  const order = await prisma.cuttingOrder.findUnique({
    where: { id: orderId },
    include: {
      recipe: {
        include: {
          components: {
            orderBy: { componentName: 'asc' },
          },
        },
      },
      items: {
        include: { component: true },
        orderBy: { component: { componentName: 'asc' } },
      },
      createdBy: {
        select: { id: true, name: true, email: true, role: true },
      },
      verifiedBy: {
        select: { id: true, name: true, email: true, role: true },
      },
      verificationLogs: {
        include: {
          verifier: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { timestamp: 'desc' },
      },
    },
  });

  if (!order) {
    throw new NotFoundError(`Cutting order with ID '${orderId}' not found.`);
  }

  const expectedFabric = Number(
    (order.recipe.stdFabricYards * order.targetQty).toFixed(2)
  );

  return {
    order,
    expectedFabricYds: expectedFabric,
    components: order.items,
  };
}

/**
 * Saves physical component actual counts during verifier inspection
 * Computes status (GREEN/YELLOW/RED) purely on the server
 */
export async function saveCounts(
  session: SessionPayload,
  orderId: string,
  counts: CountItemInput[]
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
    throw new InvalidTransitionError(
      `Cannot update component counts. Order '${order.orderNo}' is in '${order.status}' status (must be PENDING_VERIFICATION).`
    );
  }

  return prisma.$transaction(async (tx) => {
    for (const countItem of counts) {
      const existingItem = order.items.find(
        (i) => i.componentId === countItem.componentId
      );
      if (existingItem) {
        const serverStatus = computeItemStatus(
          existingItem.expectedQty,
          countItem.actualQty
        );
        await tx.verificationItem.update({
          where: { id: existingItem.id },
          data: {
            actualQty: countItem.actualQty,
            status: serverStatus,
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

export const saveComponentCounts = saveCounts;

/**
 * Gatekeeper Order Approval:
 * 1. Requires cutting_verifier role
 * 2. Order must be in PENDING_VERIFICATION
 * 3. Server recomputes status of every single component
 * 4. If ANY component is RED, missing, or uncounted -> throws BusinessRuleError (422) listing failures
 * 5. Server computes wastagePct
 * 6. In ONE transaction: upserts items, writes VerificationLog, updates order to VERIFIED
 * 7. Conditional update prevents double-approval race conditions
 */
export async function approveOrder(
  session: SessionPayload,
  orderId: string,
  counts: CountItemInput[]
) {
  requireRole(session, [Role.cutting_verifier]);

  const order = await prisma.cuttingOrder.findUnique({
    where: { id: orderId },
    include: {
      recipe: {
        include: { components: true },
      },
      items: {
        include: { component: true },
      },
    },
  });

  if (!order) {
    throw new NotFoundError(`Cutting order with ID '${orderId}' not found.`);
  }

  if (order.status !== OrderStatus.PENDING_VERIFICATION) {
    throw new InvalidTransitionError(
      `Cannot approve order '${order.orderNo}'. Current status is '${order.status}' (must be PENDING_VERIFICATION).`
    );
  }

  // 3 & 4. Recompute every component status on the server and check for failures
  const failedComponents: string[] = [];
  const countMap = new Map<string, number>();

  if (counts && counts.length > 0) {
    counts.forEach((c) => countMap.set(c.componentId, c.actualQty));
  } else {
    order.items.forEach((item) => countMap.set(item.componentId, item.actualQty));
  }

  for (const comp of order.recipe.components) {
    const expectedQty = order.targetQty * comp.piecesPerGarment;
    const actualQty = countMap.get(comp.id);

    if (actualQty === undefined) {
      failedComponents.push(`${comp.componentName} (Missing / Uncounted)`);
      continue;
    }

    const computedStatus = computeItemStatus(expectedQty, actualQty);
    if (computedStatus === ItemStatus.RED) {
      failedComponents.push(
        `${comp.componentName} (Actual: ${actualQty} / Expected: ${expectedQty}) [SHORTAGE]`
      );
    }
  }

  if (failedComponents.length > 0) {
    throw new BusinessRuleError(
      `Approval Rejected: ${failedComponents.length} component(s) have shortages or are uncounted: ${failedComponents.join(', ')}. All components must meet or exceed expected quantities.`
    );
  }

  // 5. Compute wastage percentage
  const wastagePct = computeWastagePct(
    order.actualFabricYds,
    order.recipe.stdFabricYards,
    order.targetQty
  );

  const serverTimestamp = new Date();

  // 6 & 7. Atomic transaction with race-condition prevention
  return prisma.$transaction(async (tx) => {
    // Upsert items with verified counts
    for (const comp of order.recipe.components) {
      const expectedQty = order.targetQty * comp.piecesPerGarment;
      const actualQty = countMap.get(comp.id) ?? 0;
      const status = computeItemStatus(expectedQty, actualQty);

      await tx.verificationItem.upsert({
        where: {
          orderId_componentId: {
            orderId: order.id,
            componentId: comp.id,
          },
        },
        update: {
          actualQty,
          status,
        },
        create: {
          orderId: order.id,
          componentId: comp.id,
          expectedQty,
          actualQty,
          status,
        },
      });
    }

    // Conditional atomic update to prevent double-approval race conditions
    const updateResult = await tx.cuttingOrder.updateMany({
      where: {
        id: order.id,
        status: OrderStatus.PENDING_VERIFICATION,
      },
      data: {
        status: OrderStatus.VERIFIED,
        verifiedById: session.userId,
        verifiedAt: serverTimestamp,
        wastagePct: wastagePct,
      },
    });

    if (updateResult.count === 0) {
      throw new InvalidTransitionError(
        'Order status was modified concurrently. Approval aborted.'
      );
    }

    // Write immutable VerificationLog (Identity & Timestamp from server)
    await tx.verificationLog.create({
      data: {
        orderId: order.id,
        verifierId: session.userId,
        decision: Decision.APPROVED,
        wastagePct: wastagePct,
        timestamp: serverTimestamp,
      },
    });

    return tx.cuttingOrder.findUniqueOrThrow({
      where: { id: order.id },
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
        verificationLogs: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });
  });
}

/**
 * Gatekeeper Order Rejection:
 * 1. Requires cutting_verifier role
 * 2. Rejection note trimmed 5..500 chars
 * 3. Order must be in PENDING_VERIFICATION
 * 4. Conditional update sets REJECTED and writes immutable VerificationLog
 */
export async function rejectOrder(
  session: SessionPayload,
  orderId: string,
  note: string
) {
  requireRole(session, [Role.cutting_verifier]);

  const trimmedNote = note.trim();
  if (trimmedNote.length < 5 || trimmedNote.length > 500) {
    throw new ValidationError('Rejection note must be between 5 and 500 characters.');
  }

  const order = await prisma.cuttingOrder.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new NotFoundError(`Cutting order with ID '${orderId}' not found.`);
  }

  if (order.status !== OrderStatus.PENDING_VERIFICATION) {
    throw new InvalidTransitionError(
      `Cannot reject order '${order.orderNo}'. Current status is '${order.status}' (must be PENDING_VERIFICATION).`
    );
  }

  const serverTimestamp = new Date();

  return prisma.$transaction(async (tx) => {
    // Conditional atomic update
    const updateResult = await tx.cuttingOrder.updateMany({
      where: {
        id: order.id,
        status: OrderStatus.PENDING_VERIFICATION,
      },
      data: {
        status: OrderStatus.REJECTED,
        verifiedById: session.userId,
        verifiedAt: serverTimestamp,
      },
    });

    if (updateResult.count === 0) {
      throw new InvalidTransitionError(
        'Order status was modified concurrently. Rejection aborted.'
      );
    }

    // Append immutable VerificationLog
    await tx.verificationLog.create({
      data: {
        orderId: order.id,
        verifierId: session.userId,
        decision: Decision.REJECTED,
        rejectionNote: trimmedNote,
        timestamp: serverTimestamp,
      },
    });

    return tx.cuttingOrder.findUniqueOrThrow({
      where: { id: order.id },
      include: {
        recipe: true,
        items: {
          include: { component: true },
        },
        verificationLogs: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });
  });
}

/**
 * Combined verifyOrder dispatcher
 */
export async function verifyOrder(
  session: SessionPayload,
  orderId: string,
  input: VerifyOrderInput
) {
  if (input.decision === Decision.APPROVED) {
    return approveOrder(session, orderId, input.counts || []);
  } else {
    return rejectOrder(
      session,
      orderId,
      input.rejectionNote || 'Rejected by verifier during inspection.'
    );
  }
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

  if (order.status !== OrderStatus.VERIFIED) {
    throw new InvalidTransitionError(
      `Cannot start sewing on order '${order.orderNo}'. Status is '${order.status}' (must be VERIFIED).`
    );
  }

  const serverTimestamp = new Date();

  return prisma.$transaction(async (tx) => {
    const sewingJob = await tx.sewingJob.upsert({
      where: { orderId: order.id },
      update: {
        startedById: session.userId,
        startedAt: serverTimestamp,
        notes: input.notes,
      },
      create: {
        orderId: order.id,
        startedById: session.userId,
        startedAt: serverTimestamp,
        notes: input.notes,
      },
      include: {
        startedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    const updateResult = await tx.cuttingOrder.updateMany({
      where: {
        id: order.id,
        status: OrderStatus.VERIFIED,
      },
      data: {
        status: OrderStatus.SEWING_STARTED,
      },
    });

    if (updateResult.count === 0) {
      throw new InvalidTransitionError(
        'Order status was modified concurrently. Sewing intake aborted.'
      );
    }

    const updatedOrder = await tx.cuttingOrder.findUniqueOrThrow({
      where: { id: order.id },
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
