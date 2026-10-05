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
      name: 'Nimal Perera',
      role: Role.cutting_supervisor,
    },
    create: {
      email: 'supervisor@apparelflow.com',
      passwordHash: supervisorHash,
      name: 'Nimal Perera',
      role: Role.cutting_supervisor,
    },
  });

  const verifier = await prisma.user.upsert({
    where: { email: 'verifier@apparelflow.com' },
    update: {
      passwordHash: verifierHash,
      name: 'Kamala Silva',
      role: Role.cutting_verifier,
    },
    create: {
      email: 'verifier@apparelflow.com',
      passwordHash: verifierHash,
      name: 'Kamala Silva',
      role: Role.cutting_verifier,
    },
  });

  const sewingSupervisor = await prisma.user.upsert({
    where: { email: 'sewing@apparelflow.com' },
    update: {
      passwordHash: sewingHash,
      name: 'Sunil Fernando',
      role: Role.sewing_supervisor,
    },
    create: {
      email: 'sewing@apparelflow.com',
      passwordHash: sewingHash,
      name: 'Sunil Fernando',
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
    { componentName: 'Front Body Panel', piecesPerGarment: 1 },
    { componentName: 'Back Body Panel', piecesPerGarment: 1 },
    { componentName: 'Sleeves (Left & Right)', piecesPerGarment: 2 },
    { componentName: 'Collar & Stand', piecesPerGarment: 1 },
    { componentName: 'Sleeve Cuffs', piecesPerGarment: 2 },
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
        data: { piecesPerGarment: comp.piecesPerGarment },
      });
      blouseComponents.push(updated);
    } else {
      const created = await prisma.recipeComponent.create({
        data: {
          recipeId: recipeBlouse.id,
          componentName: comp.componentName,
          piecesPerGarment: comp.piecesPerGarment,
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
    { componentName: 'Front Chest Panel', piecesPerGarment: 1 },
    { componentName: 'Back Support Panel', piecesPerGarment: 1 },
    { componentName: 'Neck Binding Strip', piecesPerGarment: 1 },
    { componentName: 'Hem Elastic Casing', piecesPerGarment: 1 },
    { componentName: 'Side Strap Accents', piecesPerGarment: 2 },
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
        data: { piecesPerGarment: comp.piecesPerGarment },
      });
      cropTopComponents.push(updated);
    } else {
      const created = await prisma.recipeComponent.create({
        data: {
          recipeId: recipeCropTop.id,
          componentName: comp.componentName,
          piecesPerGarment: comp.piecesPerGarment,
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

  console.log('✅ Seeded Demo Cutting Orders:');
  console.log(`   - CUT-2026-0001 (PENDING_VERIFICATION, all-green ready)`);
  console.log(`   - CUT-2026-0002 (PENDING_VERIFICATION, shortage scenario: Neck Binding Strip RED)`);
  console.log(`   - CUT-2026-0003 (IN_PROGRESS, active cutting floor batch)`);
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
