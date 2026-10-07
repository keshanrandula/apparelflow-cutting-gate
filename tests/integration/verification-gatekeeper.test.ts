import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { Role, OrderStatus, Decision } from '@prisma/client';
import {
  approveOrder,
  rejectOrder,
  saveCounts,
} from '@/server/services/verificationService';
import {
  BusinessRuleError,
  ForbiddenError,
  InvalidTransitionError,
  ValidationError,
} from '@/server/http';
import {
  approveOrderSchema,
  rejectOrderSchema,
  countItemSchema,
} from '@/server/validators/verification.schema';
import { SessionPayload } from '@/server/auth/session';

describe('Integration - Verifier Gatekeeper Verification Terminal', () => {
  let verifierSession: SessionPayload;
  let supervisorSession: SessionPayload;
  let sewingSession: SessionPayload;
  let testRecipe: any;
  let testOrder: any;

  beforeEach(async () => {
    // 1. Ensure test users exist
    let supervisor = await prisma.user.findUnique({
      where: { email: 'test_sup@apparelflow.com' },
    });
    if (!supervisor) {
      supervisor = await prisma.user.create({
        data: {
          email: 'test_sup@apparelflow.com',
          name: 'Test Supervisor',
          passwordHash: 'dummy',
          role: Role.cutting_supervisor,
        },
      });
    }

    let verifier = await prisma.user.findUnique({
      where: { email: 'test_ver@apparelflow.com' },
    });
    if (!verifier) {
      verifier = await prisma.user.create({
        data: {
          email: 'test_ver@apparelflow.com',
          name: 'Test Verifier',
          passwordHash: 'dummy',
          role: Role.cutting_verifier,
        },
      });
    }

    let sewing = await prisma.user.findUnique({
      where: { email: 'test_sew@apparelflow.com' },
    });
    if (!sewing) {
      sewing = await prisma.user.create({
        data: {
          email: 'test_sew@apparelflow.com',
          name: 'Test Sewing',
          passwordHash: 'dummy',
          role: Role.sewing_supervisor,
        },
      });
    }

    verifierSession = {
      userId: verifier.id,
      email: verifier.email,
      name: verifier.name,
      role: verifier.role,
    };

    supervisorSession = {
      userId: supervisor.id,
      email: supervisor.email,
      name: supervisor.name,
      role: supervisor.role,
    };

    sewingSession = {
      userId: sewing.id,
      email: sewing.email,
      name: sewing.name,
      role: sewing.role,
    };

    // 2. Create or find test recipe
    const code = `TEST-REC-${Date.now()}`;
    testRecipe = await prisma.recipe.create({
      data: {
        recipeCode: code,
        name: 'Test Polo Shirt',
        stdFabricYards: 1.5,
        wastageCap: 4.0,
        components: {
          create: [
            { componentName: 'Front Body', piecesPerGarment: 1 },
            { componentName: 'Back Body', piecesPerGarment: 1 },
            { componentName: 'Sleeves', piecesPerGarment: 2 },
          ],
        },
      },
      include: {
        components: true,
      },
    });

    // 3. Create fresh test cutting order
    const orderNo = `CUT-TEST-${Date.now()}`;
    testOrder = await prisma.cuttingOrder.create({
      data: {
        orderNo,
        recipeId: testRecipe.id,
        targetQty: 10,
        fabricRollId: 'ROLL-TEST-01',
        actualFabricYds: 16.0, // expected: 10 * 1.5 = 15 yds -> wastage: +6.67%
        status: OrderStatus.PENDING_VERIFICATION,
        createdById: supervisor.id,
        items: {
          create: testRecipe.components.map((comp: any) => ({
            componentId: comp.id,
            expectedQty: 10 * comp.piecesPerGarment,
            actualQty: 0,
            status: 'RED',
          })),
        },
      },
      include: {
        recipe: { include: { components: true } },
        items: { include: { component: true } },
      },
    });
  });

  it('1. All-GREEN order approved by verifier -> status VERIFIED, log written with verifier id, wastagePct saved', async () => {
    // Build all-GREEN counts (Front: 10, Back: 10, Sleeves: 20)
    const counts = testRecipe.components.map((comp: any) => ({
      componentId: comp.id,
      actualQty: 10 * comp.piecesPerGarment,
    }));

    const approved = await approveOrder(verifierSession, testOrder.id, counts);

    expect(approved.status).toBe(OrderStatus.VERIFIED);
    expect(approved.verifiedById).toBe(verifierSession.userId);
    expect(approved.verifiedAt).toBeDefined();
    expect(approved.wastagePct).toBe(6.67);

    // Verify immutable audit log
    const logs = await prisma.verificationLog.findMany({
      where: { orderId: testOrder.id },
    });
    expect(logs.length).toBe(1);
    expect(logs[0].decision).toBe(Decision.APPROVED);
    expect(logs[0].verifierId).toBe(verifierSession.userId);
    expect(logs[0].wastagePct).toBe(6.67);
  });

  it('2. Order with one RED component -> approval returns 422 (BusinessRuleError), order stays PENDING_VERIFICATION, no log written', async () => {
    // Sleeves has shortage: 15 instead of 20
    const counts = testRecipe.components.map((comp: any) => ({
      componentId: comp.id,
      actualQty: comp.componentName === 'Sleeves' ? 15 : 10 * comp.piecesPerGarment,
    }));

    await expect(approveOrder(verifierSession, testOrder.id, counts)).rejects.toThrow(
      BusinessRuleError
    );

    // Verify order was not modified and no approval log created
    const refreshed = await prisma.cuttingOrder.findUniqueOrThrow({
      where: { id: testOrder.id },
    });
    expect(refreshed.status).toBe(OrderStatus.PENDING_VERIFICATION);

    const logs = await prisma.verificationLog.findMany({
      where: { orderId: testOrder.id },
    });
    expect(logs.length).toBe(0);
  });

  it('3. Reject without reason (empty / whitespace / too short) -> 400 (ValidationError)', async () => {
    // Schema level validation
    expect(() => rejectOrderSchema.parse({ note: '' })).toThrow();
    expect(() => rejectOrderSchema.parse({ note: '   ' })).toThrow();
    expect(() => rejectOrderSchema.parse({ note: 'bad' })).toThrow();

    // Service level validation
    await expect(rejectOrder(verifierSession, testOrder.id, '  ')).rejects.toThrow(
      ValidationError
    );
    await expect(rejectOrder(verifierSession, testOrder.id, 'abc')).rejects.toThrow(
      ValidationError
    );

    // Valid rejection succeeds
    const rejected = await rejectOrder(
      verifierSession,
      testOrder.id,
      'Shortage of 5 pieces on Sleeve component.'
    );
    expect(rejected.status).toBe(OrderStatus.REJECTED);
  });

  it('4. Supervisor and sewing roles calling approve -> 403 (ForbiddenError)', async () => {
    const counts = testRecipe.components.map((comp: any) => ({
      componentId: comp.id,
      actualQty: 10 * comp.piecesPerGarment,
    }));

    // Supervisor calling approve -> 403
    await expect(approveOrder(supervisorSession, testOrder.id, counts)).rejects.toThrow(
      ForbiddenError
    );

    // Sewing supervisor calling approve -> 403
    await expect(approveOrder(sewingSession, testOrder.id, counts)).rejects.toThrow(
      ForbiddenError
    );
  });

  it('Extra 1: Missing component counts in approval payload -> 422 (BusinessRuleError)', async () => {
    // Only supply 2 out of 3 components
    const incompleteCounts = [
      { componentId: testRecipe.components[0].id, actualQty: 10 },
      { componentId: testRecipe.components[1].id, actualQty: 10 },
    ];

    await expect(
      approveOrder(verifierSession, testOrder.id, incompleteCounts)
    ).rejects.toThrow(BusinessRuleError);
  });

  it('Extra 2: Body trying to inject verifierId is rejected (strict schema) & verifier identity strictly comes from session', async () => {
    const maliciousPayload = {
      counts: [{ componentId: 'comp-1', actualQty: 10 }],
      verifierId: 'hacker-user-id',
    };

    expect(() => approveOrderSchema.parse(maliciousPayload)).toThrow();
  });

  it('Extra 3: Double-approve / Already approved order -> 409 (InvalidTransitionError)', async () => {
    const counts = testRecipe.components.map((comp: any) => ({
      componentId: comp.id,
      actualQty: 10 * comp.piecesPerGarment,
    }));

    // First approval
    await approveOrder(verifierSession, testOrder.id, counts);

    // Attempt second approval on already VERIFIED order
    await expect(approveOrder(verifierSession, testOrder.id, counts)).rejects.toThrow(
      InvalidTransitionError
    );
  });

  it('Extra 4: Negative, decimal, and string counts are rejected (400 validation error)', async () => {
    // Negative count
    expect(() =>
      countItemSchema.parse({ componentId: 'c1', actualQty: -5 })
    ).toThrow();

    // Decimal count
    expect(() =>
      countItemSchema.parse({ componentId: 'c1', actualQty: 10.5 })
    ).toThrow();

    // String count
    expect(() =>
      countItemSchema.parse({ componentId: 'c1', actualQty: 'twenty' as any })
    ).toThrow();
  });

  afterAll(async () => {
    // Clean up test data generated by this suite
    await prisma.verificationLog.deleteMany({
      where: { order: { orderNo: { startsWith: 'CUT-TEST-' } } },
    });
    await prisma.verificationItem.deleteMany({
      where: { order: { orderNo: { startsWith: 'CUT-TEST-' } } },
    });
    await prisma.cuttingOrder.deleteMany({
      where: { orderNo: { startsWith: 'CUT-TEST-' } },
    });
    await prisma.recipeComponent.deleteMany({
      where: { recipe: { recipeCode: { startsWith: 'TEST-REC-' } } },
    });
    await prisma.recipe.deleteMany({
      where: { recipeCode: { startsWith: 'TEST-REC-' } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: ['test_sup@apparelflow.com', 'test_ver@apparelflow.com', 'test_sew@apparelflow.com'] } },
    });
  });
});
