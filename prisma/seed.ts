import { PrismaClient, Role, OrderStatus, ItemStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Seed Users
  const passwordSalt = 10;
  const supervisorHash = await bcrypt.hash('Supervisor@123', passwordSalt);
  const verifierHash = await bcrypt.hash('Verifier@123', passwordSalt);
  const sewingHash = await bcrypt.hash('Sewing@123', passwordSalt);

  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@apparelflow.com' },
    update: {
      passwordHash: supervisorHash,
      name: 'Cutting Supervisor',
      role: Role.cutting_supervisor,
    },
    create: {
      email: 'supervisor@apparelflow.com',
      passwordHash: supervisorHash,
      name: 'Cutting Supervisor',
      role: Role.cutting_supervisor,
    },
  });

  const verifier = await prisma.user.upsert({
    where: { email: 'verifier@apparelflow.com' },
    update: {
      passwordHash: verifierHash,
      name: 'QC Gatekeeper',
      role: Role.cutting_verifier,
    },
    create: {
      email: 'verifier@apparelflow.com',
      passwordHash: verifierHash,
      name: 'QC Gatekeeper',
      role: Role.cutting_verifier,
    },
  });

  const sewingSupervisor = await prisma.user.upsert({
    where: { email: 'sewing@apparelflow.com' },
    update: {
      passwordHash: sewingHash,
      name: 'Sewing Supervisor',
      role: Role.sewing_supervisor,
    },
    create: {
      email: 'sewing@apparelflow.com',
      passwordHash: sewingHash,
      name: 'Sewing Supervisor',
      role: Role.sewing_supervisor,
    },
  });

  console.log('✅ Seeded Users:');
  console.log(`   - Supervisor: ${supervisor.email} (${supervisor.name})`);
  console.log(`   - Verifier:   ${verifier.email} (${verifier.name})`);
  console.log(`   - Sewing:     ${sewingSupervisor.email} (${sewingSupervisor.name})`);

  // 2. Seed Recipe A: Casual Blouse
  const recipeBlouse = await prisma.recipe.upsert({
    where: { recipeCode: 'REC-BL01' },
    update: {
      name: 'Casual Blouse',
      stdFabricYards: 1.8,
      wastageCap: 5.0,
    },
    create: {
      recipeCode: 'REC-BL01',
      name: 'Casual Blouse',
      stdFabricYards: 1.8,
      wastageCap: 5.0,
    },
  });

  const blouseComponentsData = [
    { componentName: 'Front Body Panel', piecesPerGarment: 1, imageUrl: '/images/components/front-body.svg' },
    { componentName: 'Back Body Panel', piecesPerGarment: 1, imageUrl: '/images/components/back-body.svg' },
    { componentName: 'Sleeves (Left & Right)', piecesPerGarment: 2, imageUrl: '/images/components/sleeves.svg' },
    { componentName: 'Collar & Stand', piecesPerGarment: 1, imageUrl: '/images/components/collar.svg' },
    { componentName: 'Sleeve Cuffs', piecesPerGarment: 2, imageUrl: '/images/components/cuffs.svg' },
  ];

  const blouseComponents = [];
  for (const comp of blouseComponentsData) {
    const existing = await prisma.recipeComponent.findFirst({
      where: {
        recipeId: recipeBlouse.id,
        componentName: comp.componentName,
      },
    });

    if (existing) {
      const updated = await prisma.recipeComponent.update({
        where: { id: existing.id },
        data: {
          piecesPerGarment: comp.piecesPerGarment,
          imageUrl: comp.imageUrl,
        },
      });
      blouseComponents.push(updated);
    } else {
      const created = await prisma.recipeComponent.create({
        data: {
          recipeId: recipeBlouse.id,
          componentName: comp.componentName,
          piecesPerGarment: comp.piecesPerGarment,
          imageUrl: comp.imageUrl,
        },
      });
      blouseComponents.push(created);
    }
  }

  // 3. Seed Recipe B: Crop Top
  const recipeCropTop = await prisma.recipe.upsert({
    where: { recipeCode: 'REC-CT02' },
    update: {
      name: 'Crop Top',
      stdFabricYards: 1.1,
      wastageCap: 8.0,
    },
    create: {
      recipeCode: 'REC-CT02',
      name: 'Crop Top',
      stdFabricYards: 1.1,
      wastageCap: 8.0,
    },
  });

  const cropTopComponentsData = [
    { componentName: 'Front Chest Panel', piecesPerGarment: 1, imageUrl: '/images/components/front-chest.svg' },
    { componentName: 'Back Support Panel', piecesPerGarment: 1, imageUrl: '/images/components/back-support.svg' },
    { componentName: 'Neck Binding Strip', piecesPerGarment: 1, imageUrl: '/images/components/neck-binding.svg' },
    { componentName: 'Hem Elastic Casing', piecesPerGarment: 1, imageUrl: '/images/components/hem-elastic.svg' },
    { componentName: 'Side Strap Accents', piecesPerGarment: 2, imageUrl: '/images/components/side-straps.svg' },
  ];

  const cropTopComponents = [];
  for (const comp of cropTopComponentsData) {
    const existing = await prisma.recipeComponent.findFirst({
      where: {
        recipeId: recipeCropTop.id,
        componentName: comp.componentName,
      },
    });

    if (existing) {
      const updated = await prisma.recipeComponent.update({
        where: { id: existing.id },
        data: {
          piecesPerGarment: comp.piecesPerGarment,
          imageUrl: comp.imageUrl,
        },
      });
      cropTopComponents.push(updated);
    } else {
      const created = await prisma.recipeComponent.create({
        data: {
          recipeId: recipeCropTop.id,
          componentName: comp.componentName,
          piecesPerGarment: comp.piecesPerGarment,
          imageUrl: comp.imageUrl,
        },
      });
      cropTopComponents.push(created);
    }
  }

  console.log('✅ Seeded Recipes & Components:');
  console.log(`   - ${recipeBlouse.name} (${recipeBlouse.recipeCode}) with ${blouseComponents.length} components`);
  console.log(`   - ${recipeCropTop.name} (${recipeCropTop.recipeCode}) with ${cropTopComponents.length} components`);

  // 4. Seed Demo Orders

  // Order 1: PENDING_VERIFICATION (all-green-able ready scenario)
  const order1 = await prisma.cuttingOrder.upsert({
    where: { orderNo: 'CUT-2026-0001' },
    update: {
      recipeId: recipeBlouse.id,
      targetQty: 100,
      fabricRollId: 'ROLL-BL-901',
      actualFabricYds: 182.0,
      status: OrderStatus.PENDING_VERIFICATION,
      createdById: supervisor.id,
    },
    create: {
      orderNo: 'CUT-2026-0001',
      recipeId: recipeBlouse.id,
      targetQty: 100,
      fabricRollId: 'ROLL-BL-901',
      actualFabricYds: 182.0,
      status: OrderStatus.PENDING_VERIFICATION,
      createdById: supervisor.id,
    },
  });

  for (const comp of blouseComponents) {
    const expected = 100 * comp.piecesPerGarment;
    await prisma.verificationItem.upsert({
      where: {
        orderId_componentId: {
          orderId: order1.id,
          componentId: comp.id,
        },
      },
      update: {
        expectedQty: expected,
        actualQty: expected,
        status: ItemStatus.GREEN,
      },
      create: {
        orderId: order1.id,
        componentId: comp.id,
        expectedQty: expected,
        actualQty: expected,
        status: ItemStatus.GREEN,
      },
    });
  }

  // Order 2: PENDING_VERIFICATION (shortage scenario for rejection test)
  const order2 = await prisma.cuttingOrder.upsert({
    where: { orderNo: 'CUT-2026-0002' },
    update: {
      recipeId: recipeCropTop.id,
      targetQty: 50,
      fabricRollId: 'ROLL-CT-402',
      actualFabricYds: 60.5,
      status: OrderStatus.PENDING_VERIFICATION,
      createdById: supervisor.id,
    },
    create: {
      orderNo: 'CUT-2026-0002',
      recipeId: recipeCropTop.id,
      targetQty: 50,
      fabricRollId: 'ROLL-CT-402',
      actualFabricYds: 60.5,
      status: OrderStatus.PENDING_VERIFICATION,
      createdById: supervisor.id,
    },
  });

  for (const comp of cropTopComponents) {
    const expected = 50 * comp.piecesPerGarment;
    // Shortage on "Neck Binding Strip" (e.g., 42 instead of 50 => RED)
    const isShortage = comp.componentName === 'Neck Binding Strip';
    const actual = isShortage ? 42 : expected;
    const status = isShortage ? ItemStatus.RED : ItemStatus.GREEN;

    await prisma.verificationItem.upsert({
      where: {
        orderId_componentId: {
          orderId: order2.id,
          componentId: comp.id,
        },
      },
      update: {
        expectedQty: expected,
        actualQty: actual,
        status: status,
      },
      create: {
        orderId: order2.id,
        componentId: comp.id,
        expectedQty: expected,
        actualQty: actual,
        status: status,
      },
    });
  }

  // Order 3: IN_PROGRESS (cutting floor active workflow)
  const order3 = await prisma.cuttingOrder.upsert({
    where: { orderNo: 'CUT-2026-0003' },
    update: {
      recipeId: recipeBlouse.id,
      targetQty: 80,
      fabricRollId: 'ROLL-BL-905',
      actualFabricYds: 145.0,
      status: OrderStatus.IN_PROGRESS,
      createdById: supervisor.id,
    },
    create: {
      orderNo: 'CUT-2026-0003',
      recipeId: recipeBlouse.id,
      targetQty: 80,
      fabricRollId: 'ROLL-BL-905',
      actualFabricYds: 145.0,
      status: OrderStatus.IN_PROGRESS,
      createdById: supervisor.id,
    },
  });

  for (const comp of blouseComponents) {
    const expected = 80 * comp.piecesPerGarment;
    await prisma.verificationItem.upsert({
      where: {
        orderId_componentId: {
          orderId: order3.id,
          componentId: comp.id,
        },
      },
      update: {
        expectedQty: expected,
        actualQty: 0,
        status: ItemStatus.RED,
      },
      create: {
        orderId: order3.id,
        componentId: comp.id,
        expectedQty: expected,
        actualQty: 0,
        status: ItemStatus.RED,
      },
    });
  }

  // Order 4: VERIFIED (Verified by Gatekeeper, waiting in Sewing Queue)
  const order4 = await prisma.cuttingOrder.upsert({
    where: { orderNo: 'CUT-2026-0004' },
    update: {
      recipeId: recipeBlouse.id,
      targetQty: 60,
      fabricRollId: 'ROLL-BL-908',
      actualFabricYds: 110.0,
      status: OrderStatus.VERIFIED,
      createdById: supervisor.id,
      verifiedById: verifier.id,
      verifiedAt: new Date(),
    },
    create: {
      orderNo: 'CUT-2026-0004',
      recipeId: recipeBlouse.id,
      targetQty: 60,
      fabricRollId: 'ROLL-BL-908',
      actualFabricYds: 110.0,
      status: OrderStatus.VERIFIED,
      createdById: supervisor.id,
      verifiedById: verifier.id,
      verifiedAt: new Date(),
    },
  });

  for (const comp of blouseComponents) {
    const expected = 60 * comp.piecesPerGarment;
    await prisma.verificationItem.upsert({
      where: {
        orderId_componentId: {
          orderId: order4.id,
          componentId: comp.id,
        },
      },
      update: {
        expectedQty: expected,
        actualQty: expected,
        status: ItemStatus.GREEN,
      },
      create: {
        orderId: order4.id,
        componentId: comp.id,
        expectedQty: expected,
        actualQty: expected,
        status: ItemStatus.GREEN,
      },
    });
  }

  const existingLog4 = await prisma.verificationLog.findFirst({
    where: { orderId: order4.id },
  });
  if (!existingLog4) {
    await prisma.verificationLog.create({
      data: {
        orderId: order4.id,
        verifierId: verifier.id,
        decision: 'APPROVED',
        rejectionNote: null,
        wastagePct: 1.85,
      },
    });
  }

  // Order 5: SEWING_STARTED (Intake started by Sewing Supervisor)
  const order5 = await prisma.cuttingOrder.upsert({
    where: { orderNo: 'CUT-2026-0005' },
    update: {
      recipeId: recipeCropTop.id,
      targetQty: 40,
      fabricRollId: 'ROLL-CT-503',
      actualFabricYds: 45.0,
      status: OrderStatus.SEWING_STARTED,
      createdById: supervisor.id,
      verifiedById: verifier.id,
      verifiedAt: new Date(),
    },
    create: {
      orderNo: 'CUT-2026-0005',
      recipeId: recipeCropTop.id,
      targetQty: 40,
      fabricRollId: 'ROLL-CT-503',
      actualFabricYds: 45.0,
      status: OrderStatus.SEWING_STARTED,
      createdById: supervisor.id,
      verifiedById: verifier.id,
      verifiedAt: new Date(),
    },
  });

  for (const comp of cropTopComponents) {
    const expected = 40 * comp.piecesPerGarment;
    await prisma.verificationItem.upsert({
      where: {
        orderId_componentId: {
          orderId: order5.id,
          componentId: comp.id,
        },
      },
      update: {
        expectedQty: expected,
        actualQty: expected,
        status: ItemStatus.GREEN,
      },
      create: {
        orderId: order5.id,
        componentId: comp.id,
        expectedQty: expected,
        actualQty: expected,
        status: ItemStatus.GREEN,
      },
    });
  }

  const existingLog5 = await prisma.verificationLog.findFirst({
    where: { orderId: order5.id },
  });
  if (!existingLog5) {
    await prisma.verificationLog.create({
      data: {
        orderId: order5.id,
        verifierId: verifier.id,
        decision: 'APPROVED',
        rejectionNote: null,
        wastagePct: 2.27,
      },
    });
  }

  await prisma.sewingJob.upsert({
    where: { orderId: order5.id },
    update: {
      startedById: sewingSupervisor.id,
      startedAt: new Date(),
      notes: 'Line 02 intake initialized - priority shipment',
    },
    create: {
      orderId: order5.id,
      startedById: sewingSupervisor.id,
      startedAt: new Date(),
      notes: 'Line 02 intake initialized - priority shipment',
    },
  });

  // Order 6: REJECTED (Defect detected, returned for re-cut)
  const order6 = await prisma.cuttingOrder.upsert({
    where: { orderNo: 'CUT-2026-0006' },
    update: {
      recipeId: recipeBlouse.id,
      targetQty: 50,
      fabricRollId: 'ROLL-BL-880',
      actualFabricYds: 95.0,
      status: OrderStatus.REJECTED,
      createdById: supervisor.id,
      verifiedById: verifier.id,
      verifiedAt: new Date(),
    },
    create: {
      orderNo: 'CUT-2026-0006',
      recipeId: recipeBlouse.id,
      targetQty: 50,
      fabricRollId: 'ROLL-BL-880',
      actualFabricYds: 95.0,
      status: OrderStatus.REJECTED,
      createdById: supervisor.id,
      verifiedById: verifier.id,
      verifiedAt: new Date(),
    },
  });

  for (const comp of blouseComponents) {
    const expected = 50 * comp.piecesPerGarment;
    const isShortage = comp.componentName === 'Front Body Panel';
    const actual = isShortage ? 45 : expected;
    await prisma.verificationItem.upsert({
      where: {
        orderId_componentId: {
          orderId: order6.id,
          componentId: comp.id,
        },
      },
      update: {
        expectedQty: expected,
        actualQty: actual,
        status: isShortage ? ItemStatus.RED : ItemStatus.GREEN,
      },
      create: {
        orderId: order6.id,
        componentId: comp.id,
        expectedQty: expected,
        actualQty: actual,
        status: isShortage ? ItemStatus.RED : ItemStatus.GREEN,
      },
    });
  }

  const existingLog6 = await prisma.verificationLog.findFirst({
    where: { orderId: order6.id },
  });
  if (!existingLog6) {
    await prisma.verificationLog.create({
      data: {
        orderId: order6.id,
        verifierId: verifier.id,
        decision: 'REJECTED',
        rejectionNote: 'Front Body Panel has a shortage of 5 pieces due to fabric defect on roll edge. Returned for re-cut.',
        wastagePct: 5.56,
      },
    });
  }

  console.log('✅ Seeded Demo Cutting Orders:');
  console.log(`   - CUT-2026-0001 (PENDING_VERIFICATION, all-green ready)`);
  console.log(`   - CUT-2026-0002 (PENDING_VERIFICATION, shortage scenario: Neck Binding Strip RED)`);
  console.log(`   - CUT-2026-0003 (IN_PROGRESS, active cutting floor batch)`);
  console.log(`   - CUT-2026-0004 (VERIFIED, ready for Sewing Floor Queue)`);
  console.log(`   - CUT-2026-0005 (SEWING_STARTED, active sewing assembly line)`);
  console.log(`   - CUT-2026-0006 (REJECTED, returned to supervisor for re-cut)`);
  console.log('🎉 Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Error executing seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
