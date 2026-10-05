import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { Role, OrderStatus } from '@prisma/client';
import {
  getSewingQueue,
  getSewingOrderById,
  startSewingOrder,
} from '@/server/services/sewingService';
import { NotFoundError, ForbiddenError } from '@/server/http';
import { SessionPayload } from '@/server/auth/session';

describe('Integration - Sewing Supervisor Floor Queue and Intake', () => {
  let sewingSession: SessionPayload;
  let supervisorSession: SessionPayload;
  let verifierSession: SessionPayload;
  let testRecipe: any;

  let inProgressOrder: any;
  let pendingOrder: any;
  let rejectedOrder: any;
  let verifiedOrder: any;
  let sewingStartedOrder: any;

  beforeEach(async () => {
    // 1. Users
    let supervisor = await prisma.user.findUnique({
      where: { email: 'sew_test_sup@apparelflow.com' },
    });
    if (!supervisor) {
      supervisor = await prisma.user.create({
        data: {
          email: 'sew_test_sup@apparelflow.com',
          name: 'Sewing Test Sup',
          passwordHash: 'dummy',
          role: Role.cutting_supervisor,
        },
      });
    }

    let verifier = await prisma.user.findUnique({
      where: { email: 'sew_test_ver@apparelflow.com' },
    });
    if (!verifier) {
      verifier = await prisma.user.create({
        data: {
          email: 'sew_test_ver@apparelflow.com',
          name: 'Sewing Test Verifier',
          passwordHash: 'dummy',
          role: Role.cutting_verifier,
        },
      });
    }

    let sewing = await prisma.user.findUnique({
      where: { email: 'sew_test_sew@apparelflow.com' },
    });
    if (!sewing) {
      sewing = await prisma.user.create({
        data: {
          email: 'sew_test_sew@apparelflow.com',
          name: 'Sewing Test Lead',
          passwordHash: 'dummy',
          role: Role.sewing_supervisor,
        },
      });
    }

    sewingSession = {
      userId: sewing.id,
      email: sewing.email,
      name: sewing.name,
      role: sewing.role,
    };

    supervisorSession = {
      userId: supervisor.id,
      email: supervisor.email,
      name: supervisor.name,
      role: supervisor.role,
    };

    verifierSession = {
      userId: verifier.id,
      email: verifier.email,
      name: verifier.name,
      role: verifier.role,
    };

    // 2. Recipe
    testRecipe = await prisma.recipe.create({
      data: {
        recipeCode: `SEW-REC-${Date.now()}`,
        name: 'Sewing Queue Test Style',
        stdFabricYards: 1.8,
        wastageCap: 5.0,
      },
    });

    // 3. Create Orders in all 5 statuses
    const ts = Date.now();

    inProgressOrder = await prisma.cuttingOrder.create({
      data: {
        orderNo: `INP-${ts}`,
        recipeId: testRecipe.id,
        targetQty: 20,
        fabricRollId: 'R-INP',
        actualFabricYds: 36.0,
        status: OrderStatus.IN_PROGRESS,
        createdById: supervisor.id,
      },
    });

    pendingOrder = await prisma.cuttingOrder.create({
      data: {
        orderNo: `PND-${ts}`,
        recipeId: testRecipe.id,
        targetQty: 20,
        fabricRollId: 'R-PND',
        actualFabricYds: 36.0,
        status: OrderStatus.PENDING_VERIFICATION,
        createdById: supervisor.id,
      },
    });

    rejectedOrder = await prisma.cuttingOrder.create({
      data: {
        orderNo: `REJ-${ts}`,
        recipeId: testRecipe.id,
        targetQty: 20,
        fabricRollId: 'R-REJ',
        actualFabricYds: 36.0,
        status: OrderStatus.REJECTED,
        createdById: supervisor.id,
      },
    });

    verifiedOrder = await prisma.cuttingOrder.create({
      data: {
        orderNo: `VER-${ts}`,
        recipeId: testRecipe.id,
        targetQty: 20,
        fabricRollId: 'R-VER',
        actualFabricYds: 36.0,
        status: OrderStatus.VERIFIED,
        createdById: supervisor.id,
        verifiedById: verifier.id,
        verifiedAt: new Date(),
        wastagePct: 0.0,
      },
    });

    sewingStartedOrder = await prisma.cuttingOrder.create({
      data: {
        orderNo: `SEW-${ts}`,
        recipeId: testRecipe.id,
        targetQty: 20,
        fabricRollId: 'R-SEW',
        actualFabricYds: 36.0,
        status: OrderStatus.SEWING_STARTED,
        createdById: supervisor.id,
        verifiedById: verifier.id,
        verifiedAt: new Date(),
        wastagePct: 0.0,
      },
    });
  });

  it('5. Sewing queue query never returns PENDING_VERIFICATION, REJECTED, or IN_PROGRESS orders even with tampered query params', async () => {
    const queue = await getSewingQueue(sewingSession);

    const queueOrderNos = queue.map((o) => o.orderNo);

    // Hardcoded security guarantees:
    expect(queueOrderNos).toContain(verifiedOrder.orderNo);
    expect(queueOrderNos).toContain(sewingStartedOrder.orderNo);

    // MUST NEVER CONTAIN unverified orders:
    expect(queueOrderNos).not.toContain(inProgressOrder.orderNo);
    expect(queueOrderNos).not.toContain(pendingOrder.orderNo);
    expect(queueOrderNos).not.toContain(rejectedOrder.orderNo);

    // Ensure every single order returned in queue has status VERIFIED or SEWING_STARTED
    for (const item of queue) {
      expect([OrderStatus.VERIFIED, OrderStatus.SEWING_STARTED]).toContain(item.status);
    }
  });

  it('Strict Role Check: only sewing_supervisor can access getSewingQueue (Supervisor and Verifier get 403)', async () => {
    await expect(getSewingQueue(supervisorSession)).rejects.toThrow(ForbiddenError);
    await expect(getSewingQueue(verifierSession)).rejects.toThrow(ForbiddenError);
  });

  it('Single order inquiry: getSewingOrderById returns 404 (NotFoundError) for unverified orders to prevent ID enumeration/leaks', async () => {
    // Verified order succeeds
    const found = await getSewingOrderById(sewingSession, verifiedOrder.id);
    expect(found.id).toBe(verifiedOrder.id);

    // In-Progress order throws 404
    await expect(getSewingOrderById(sewingSession, inProgressOrder.id)).rejects.toThrow(
      NotFoundError
    );

    // Pending Verification order throws 404
    await expect(getSewingOrderById(sewingSession, pendingOrder.id)).rejects.toThrow(
      NotFoundError
    );

    // Rejected order throws 404
    await expect(getSewingOrderById(sewingSession, rejectedOrder.id)).rejects.toThrow(
      NotFoundError
    );
  });

  it('Intake Action: startSewingOrder transitions VERIFIED -> SEWING_STARTED and records SewingJob', async () => {
    const res = await startSewingOrder(
      sewingSession,
      verifiedOrder.id,
      'Assigned to Line 2 - Lead Stitcher Kamala'
    );

    expect(res.order.status).toBe(OrderStatus.SEWING_STARTED);
    expect(res.sewingJob.notes).toBe('Assigned to Line 2 - Lead Stitcher Kamala');
    expect(res.sewingJob.startedById).toBe(sewingSession.userId);
  });
});
