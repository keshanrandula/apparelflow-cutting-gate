import { prisma } from '@/lib/prisma';
import { Role, OrderStatus, ItemStatus } from '@prisma/client';
import { SessionPayload } from '../auth/session';
import { requireRole } from '../auth/rbac';
import { NotFoundError, ForbiddenError } from '../http';
import { assertTransition } from '../domain/stateMachine';
import { CreateOrderInput } from '../validators/order.schema';

/**
 * Generates the next sequential unique order number in format CUT-YYYY-0001
 */
async function generateOrderNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `CUT-${currentYear}-`;

  const lastOrder = await prisma.cuttingOrder.findFirst({
    where: {
      orderNo: {
        startsWith: prefix,
      },
    },
    orderBy: {
      orderNo: 'desc',
    },
    select: {
      orderNo: true,
    },
  });

  let nextSequence = 1;
  if (lastOrder?.orderNo) {
    const parts = lastOrder.orderNo.split('-');
    const lastSeq = parseInt(parts[2], 10);
    if (!isNaN(lastSeq)) {
      nextSequence = lastSeq + 1;
    }
  }

  return `${prefix}${nextSequence.toString().padStart(4, '0')}`;
}

/**
 * Returns all available garment recipes with their bill-of-materials components
 */
export async function getAllRecipes() {
  return prisma.recipe.findMany({
    include: {
      components: {
        orderBy: { componentName: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });
}

/**
 * Calculates expected component quantities and expected standard fabric yardage
 * Reusable across UI real-time calculation and backend validation
 */
export async function getExpectedComponents(recipeId: string, targetQty: number) {
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    include: {
      components: {
        orderBy: { componentName: 'asc' },
      },
    },
  });

  if (!recipe) {
    throw new NotFoundError(`Recipe with ID '${recipeId}' not found.`);
  }

  const expectedFabric = Number((recipe.stdFabricYards * targetQty).toFixed(2));

  const components = recipe.components.map((comp) => ({
    componentId: comp.id,
    componentName: comp.componentName,
    piecesPerGarment: comp.piecesPerGarment,
    expectedQty: targetQty * comp.piecesPerGarment,
  }));

  return {
    recipe: {
      id: recipe.id,
      recipeCode: recipe.recipeCode,
      name: recipe.name,
      stdFabricYards: recipe.stdFabricYards,
      wastageCap: recipe.wastageCap,
    },
    targetQty,
    expectedFabricYds: expectedFabric,
    components,
  };
}

/**
 * Creates a new Cutting Order and initializes its verification items.
 * Strictly requires cutting_supervisor role.
 * Status starts as PENDING_VERIFICATION.
 */
export async function createOrder(session: SessionPayload, input: CreateOrderInput) {
  requireRole(session, [Role.cutting_supervisor]);

  const recipe = await prisma.recipe.findUnique({
    where: { id: input.recipeId },
    include: { components: true },
  });

  if (!recipe) {
    throw new NotFoundError(`Recipe with ID '${input.recipeId}' not found.`);
  }

  if (!recipe.components || recipe.components.length === 0) {
    throw new NotFoundError(`Recipe '${recipe.name}' has no registered components.`);
  }

  const orderNo = await generateOrderNumber();

  return prisma.$transaction(async (tx) => {
    // 1. Create the cutting order
    const order = await tx.cuttingOrder.create({
      data: {
        orderNo,
        recipeId: recipe.id,
        targetQty: input.targetQty,
        fabricRollId: input.fabricRollId,
        actualFabricYds: input.actualFabricYds,
        status: OrderStatus.PENDING_VERIFICATION,
        createdById: session.userId,
      },
    });

    // 2. Initialize verification items for each recipe component
    const verificationItemData = recipe.components.map((comp) => ({
      orderId: order.id,
      componentId: comp.id,
      expectedQty: input.targetQty * comp.piecesPerGarment,
      actualQty: 0,
      status: ItemStatus.RED,
    }));

    await tx.verificationItem.createMany({
      data: verificationItemData,
    });

    // Return complete created order
    return tx.cuttingOrder.findUniqueOrThrow({
      where: { id: order.id },
      include: {
        recipe: true,
        items: {
          include: { component: true },
          orderBy: { component: { componentName: 'asc' } },
        },
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
  });
}

/**
 * Lists orders based on the user's role:
 * - cutting_supervisor: sees only their own created orders
 * - cutting_verifier & sewing_supervisor: sees all active orders across factory
 */
export async function listOrders(session: SessionPayload) {
  const isSupervisor = session.role === Role.cutting_supervisor;

  const whereClause = isSupervisor ? { createdById: session.userId } : {};

  return prisma.cuttingOrder.findMany({
    where: whereClause,
    include: {
      recipe: {
        select: { id: true, recipeCode: true, name: true, stdFabricYards: true, wastageCap: true },
      },
      createdBy: {
        select: { id: true, name: true, email: true, role: true },
      },
      verifiedBy: {
        select: { id: true, name: true, email: true, role: true },
      },
      items: {
        include: { component: true },
      },
      sewingJobs: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export const listOrdersForSupervisor = listOrders;

/**
 * Retrieves a single order by ID with complete details, audit logs, and component status
 */
export async function getOrderById(session: SessionPayload, orderId: string) {
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
      createdBy: {
        select: { id: true, name: true, email: true, role: true },
      },
      verifiedBy: {
        select: { id: true, name: true, email: true, role: true },
      },
      items: {
        include: { component: true },
        orderBy: { component: { componentName: 'asc' } },
      },
      verificationLogs: {
        include: {
          verifier: {
            select: { id: true, name: true, email: true, role: true },
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
    throw new NotFoundError(`Cutting order with ID '${orderId}' not found.`);
  }

  // Supervisors can only access their own orders
  if (session.role === Role.cutting_supervisor && order.createdById !== session.userId) {
    throw new ForbiddenError('You do not have permission to view orders created by other supervisors.');
  }

  return order;
}

/**
 * Resubmits a rejected order for verification after re-cutting
 * Enforces transition REJECTED -> PENDING_VERIFICATION via state machine
 * Resets verification item counts to RED/0
 */
export async function resubmitRejectedOrder(
  session: SessionPayload,
  orderId: string,
  updatedFabricYds?: number
) {
  requireRole(session, [Role.cutting_supervisor]);

  const order = await prisma.cuttingOrder.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    throw new NotFoundError(`Cutting order with ID '${orderId}' not found.`);
  }

  if (order.createdById !== session.userId) {
    throw new ForbiddenError('You can only resubmit cutting orders that you created.');
  }

  // Strict state machine assertion
  assertTransition(order.status, OrderStatus.PENDING_VERIFICATION, order.orderNo);

  return prisma.$transaction(async (tx) => {
    // 1. Reset all verification items to uncounted (RED, actualQty: 0)
    await tx.verificationItem.updateMany({
      where: { orderId: order.id },
      data: {
        actualQty: 0,
        status: ItemStatus.RED,
      },
    });

    // 2. Update the order status and fabric yardage if adjusted
    const updatedOrder = await tx.cuttingOrder.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.PENDING_VERIFICATION,
        actualFabricYds: updatedFabricYds ?? order.actualFabricYds,
        verifiedById: null,
        verifiedAt: null,
        wastagePct: null,
      },
      include: {
        recipe: true,
        items: {
          include: { component: true },
          orderBy: { component: { componentName: 'asc' } },
        },
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return updatedOrder;
  });
}
