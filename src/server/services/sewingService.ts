import { prisma } from '@/lib/prisma';
import { Role, OrderStatus } from '@prisma/client';
import { SessionPayload } from '../auth/session';
import { requireRole } from '../auth/rbac';
import { NotFoundError, InvalidTransitionError } from '../http';
import { assertTransition } from '../domain/stateMachine';

/**
 * Retrieves the Sewing Floor Queue
 * Strictly enforces sewing_supervisor role.
 * Security: Prisma query HARDCODES status in ('VERIFIED', 'SEWING_STARTED').
 * Query parameters from the URL are completely stripped/ignored to prevent status manipulation.
 */
export async function getSewingQueue(session: SessionPayload) {
  requireRole(session, [Role.sewing_supervisor]);

  // Hardcoded status filter - URL params are intentionally not accepted
  const orders = await prisma.cuttingOrder.findMany({
    where: {
      status: {
        in: [OrderStatus.VERIFIED, OrderStatus.SEWING_STARTED],
      },
    },
    include: {
      recipe: {
        select: {
          id: true,
          recipeCode: true,
          name: true,
          stdFabricYards: true,
          wastageCap: true,
        },
      },
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      verifiedBy: {
        select: { id: true, name: true, email: true },
      },
      items: {
        include: {
          component: {
            select: { id: true, componentName: true, piecesPerGarment: true },
          },
        },
        orderBy: { component: { componentName: 'asc' } },
      },
      verificationLogs: {
        orderBy: { timestamp: 'desc' },
        take: 1,
        select: {
          id: true,
          decision: true,
          rejectionNote: true,
          wastagePct: true,
          timestamp: true,
        },
      },
      sewingJobs: {
        include: {
          startedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return orders.map((order) => ({
    id: order.id,
    orderNo: order.orderNo,
    status: order.status,
    targetQty: order.targetQty,
    fabricRollId: order.fabricRollId,
    actualFabricYds: order.actualFabricYds,
    wastagePct: order.wastagePct,
    verifiedAt: order.verifiedAt,
    verifiedBy: order.verifiedBy,
    createdBy: order.createdBy,
    recipe: order.recipe,
    items: order.items,
    latestLog: order.verificationLogs[0] || null,
    sewingJob: order.sewingJobs[0] || null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }));
}

/**
 * Retrieves a single sewing batch for floor assembly
 * Security: Returns HTTP 404 (Not 403) if the order exists in another state (e.g. IN_PROGRESS/REJECTED),
 * ensuring order existence is never leaked to unauthorized probes.
 */
export async function getSewingOrderById(session: SessionPayload, orderId: string) {
  requireRole(session, [Role.sewing_supervisor]);

  const order = await prisma.cuttingOrder.findFirst({
    where: {
      id: orderId,
      status: {
        in: [OrderStatus.VERIFIED, OrderStatus.SEWING_STARTED],
      },
    },
    include: {
      recipe: {
        include: {
          components: {
            orderBy: { componentName: 'asc' },
          },
        },
      },
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      verifiedBy: {
        select: { id: true, name: true, email: true },
      },
      items: {
        include: { component: true },
        orderBy: { component: { componentName: 'asc' } },
      },
      verificationLogs: {
        include: {
          verifier: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { timestamp: 'desc' },
      },
      sewingJobs: {
        include: {
          startedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  if (!order) {
    // 404 prevents leaking existence of unverified/in-progress cutting batches
    throw new NotFoundError('Sewing batch not found or not released to sewing.');
  }

  return order;
}

/**
 * Initiates assembly line intake: Transitions VERIFIED -> SEWING_STARTED
 */
export async function startSewingOrder(
  session: SessionPayload,
  orderId: string,
  notes?: string
) {
  requireRole(session, [Role.sewing_supervisor]);

  const order = await prisma.cuttingOrder.findFirst({
    where: {
      id: orderId,
      status: {
        in: [OrderStatus.VERIFIED, OrderStatus.SEWING_STARTED],
      },
    },
  });

  if (!order) {
    throw new NotFoundError('Sewing batch not found or not eligible for intake.');
  }

  // Enforce central state machine transition: VERIFIED -> SEWING_STARTED
  assertTransition(order.status, OrderStatus.SEWING_STARTED, order.orderNo);

  const serverTimestamp = new Date();

  return prisma.$transaction(async (tx) => {
    // Conditional update prevents concurrent duplicate intake
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
        'Order is no longer in VERIFIED status (may have already been started).'
      );
    }

    const sewingJob = await tx.sewingJob.upsert({
      where: { orderId: order.id },
      update: {
        startedById: session.userId,
        startedAt: serverTimestamp,
        notes: notes?.trim() || null,
      },
      create: {
        orderId: order.id,
        startedById: session.userId,
        startedAt: serverTimestamp,
        notes: notes?.trim() || null,
      },
      include: {
        startedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

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
