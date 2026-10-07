import { PrismaClient, Role, OrderStatus, ItemStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seed...');

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
  console.log(`   - Supervisor: ${supervisor.email}`);
  console.log(`   - Verifier:   ${verifier.email}`);
  console.log(`   - Sewing:     ${sewingSupervisor.email}`);

  // Helper function to seed recipe & components
  async function seedRecipe(
    code: string,
    name: string,
    stdYds: number,
    cap: number,
    components: Array<{ name: string; pieces: number; img: string }>
  ) {
    const recipe = await prisma.recipe.upsert({
      where: { recipeCode: code },
      update: { name, stdFabricYards: stdYds, wastageCap: cap },
      create: { recipeCode: code, name, stdFabricYards: stdYds, wastageCap: cap },
    });

    const createdComponents = [];
    for (const comp of components) {
      const existing = await prisma.recipeComponent.findFirst({
        where: { recipeId: recipe.id, componentName: comp.name },
      });
      if (existing) {
        const updated = await prisma.recipeComponent.update({
          where: { id: existing.id },
          data: { piecesPerGarment: comp.pieces, imageUrl: comp.img },
        });
        createdComponents.push(updated);
      } else {
        const created = await prisma.recipeComponent.create({
          data: {
            recipeId: recipe.id,
            componentName: comp.name,
            piecesPerGarment: comp.pieces,
            imageUrl: comp.img,
          },
        });
        createdComponents.push(created);
      }
    }
    return { recipe, components: createdComponents };
  }

  // 2. Seed Full Garment Catalog (7 Styles)
  const blouse = await seedRecipe('REC-BL01', 'Casual Blouse', 1.8, 5.0, [
    { name: 'Front Body Panel', pieces: 1, img: '/images/components/front-body.svg' },
    { name: 'Back Body Panel', pieces: 1, img: '/images/components/back-body.svg' },
    { name: 'Sleeves (Left & Right)', pieces: 2, img: '/images/components/sleeves.svg' },
    { name: 'Collar & Stand', pieces: 1, img: '/images/components/collar.svg' },
    { name: 'Sleeve Cuffs', pieces: 2, img: '/images/components/cuffs.svg' },
  ]);

  const cropTop = await seedRecipe('REC-CT02', 'Crop Top', 1.1, 8.0, [
    { name: 'Front Chest Panel', pieces: 1, img: '/images/components/front-chest.svg' },
    { name: 'Back Support Panel', pieces: 1, img: '/images/components/back-support.svg' },
    { name: 'Neck Binding Strip', pieces: 1, img: '/images/components/neck-binding.svg' },
    { name: 'Hem Elastic Casing', pieces: 1, img: '/images/components/hem-elastic.svg' },
    { name: 'Side Strap Accents', pieces: 2, img: '/images/components/side-straps.svg' },
  ]);

  const polo = await seedRecipe('REC-PL03', 'Classic Polo Shirt', 1.45, 5.0, [
    { name: 'Front Torso Panel', pieces: 1, img: '/images/components/front-body.svg' },
    { name: 'Back Torso Panel', pieces: 1, img: '/images/components/back-body.svg' },
    { name: 'Ribbed Knit Collar', pieces: 1, img: '/images/components/collar.svg' },
    { name: 'Short Sleeves', pieces: 2, img: '/images/components/sleeves.svg' },
    { name: 'Front Button Placket', pieces: 1, img: '/images/components/cuffs.svg' },
  ]);

  const tshirt = await seedRecipe('REC-TS04', 'Crewneck T-Shirt', 1.25, 4.0, [
    { name: 'Front Body Panel', pieces: 1, img: '/images/components/front-body.svg' },
    { name: 'Back Body Panel', pieces: 1, img: '/images/components/back-body.svg' },
    { name: 'Short Sleeves', pieces: 2, img: '/images/components/sleeves.svg' },
    { name: 'Ribbed Neckband', pieces: 1, img: '/images/components/neck-binding.svg' },
  ]);

  const hoodie = await seedRecipe('REC-HD05', 'Fleece Pullover Hoodie', 2.3, 6.0, [
    { name: 'Front Body with Pocket', pieces: 1, img: '/images/components/front-body.svg' },
    { name: 'Back Body Panel', pieces: 1, img: '/images/components/back-body.svg' },
    { name: 'Hood Outer & Inner', pieces: 2, img: '/images/components/collar.svg' },
    { name: 'Raglan Sleeves', pieces: 2, img: '/images/components/sleeves.svg' },
    { name: 'Ribbed Waistband & Cuffs', pieces: 3, img: '/images/components/cuffs.svg' },
  ]);

  const denim = await seedRecipe('REC-DN06', 'Denim Slim Jeans', 2.1, 5.0, [
    { name: 'Front Leg Panels', pieces: 2, img: '/images/components/front-body.svg' },
    { name: 'Back Leg Panels', pieces: 2, img: '/images/components/back-body.svg' },
    { name: 'Waistband Band', pieces: 1, img: '/images/components/hem-elastic.svg' },
    { name: 'Back Pockets', pieces: 2, img: '/images/components/cuffs.svg' },
    { name: 'Belt Loops (Set of 5)', pieces: 5, img: '/images/components/side-straps.svg' },
  ]);

  const oxford = await seedRecipe('REC-OX07', 'Oxford Button-Down Shirt', 1.75, 5.0, [
    { name: 'Left & Right Front', pieces: 2, img: '/images/components/front-body.svg' },
    { name: 'Back Panel with Yoke', pieces: 1, img: '/images/components/back-body.svg' },
    { name: 'Long Sleeves', pieces: 2, img: '/images/components/sleeves.svg' },
    { name: 'Button-Down Collar', pieces: 1, img: '/images/components/collar.svg' },
    { name: 'Wrist Cuffs', pieces: 2, img: '/images/components/cuffs.svg' },
  ]);

  console.log('✅ Seeded 7 Garment Recipes & BOM Components.');

  // Helper function to seed order + verification items
  async function seedOrder(params: {
    orderNo: string;
    recipeData: { recipe: any; components: any[] };
    targetQty: number;
    fabricRollId: string;
    actualFabricYds: number;
    status: OrderStatus;
    verifiedAt?: Date;
    verificationLog?: { decision: 'APPROVED' | 'REJECTED'; note?: string; wastagePct: number };
    sewingJob?: { notes: string };
    shortageComponentIndex?: number;
    shortageQtyDiff?: number;
  }) {
    const order = await prisma.cuttingOrder.upsert({
      where: { orderNo: params.orderNo },
      update: {
        recipeId: params.recipeData.recipe.id,
        targetQty: params.targetQty,
        fabricRollId: params.fabricRollId,
        actualFabricYds: params.actualFabricYds,
        status: params.status,
        createdById: supervisor.id,
        verifiedById: params.verifiedAt ? verifier.id : null,
        verifiedAt: params.verifiedAt || null,
      },
      create: {
        orderNo: params.orderNo,
        recipeId: params.recipeData.recipe.id,
        targetQty: params.targetQty,
        fabricRollId: params.fabricRollId,
        actualFabricYds: params.actualFabricYds,
        status: params.status,
        createdById: supervisor.id,
        verifiedById: params.verifiedAt ? verifier.id : null,
        verifiedAt: params.verifiedAt || null,
      },
    });

    for (let i = 0; i < params.recipeData.components.length; i++) {
      const comp = params.recipeData.components[i];
      const expected = params.targetQty * comp.piecesPerGarment;
      let actual = expected;
      let itemStatus: ItemStatus = ItemStatus.GREEN;

      if (params.status === OrderStatus.IN_PROGRESS) {
        actual = 0;
        itemStatus = ItemStatus.RED;
      } else if (params.shortageComponentIndex === i) {
        actual = Math.max(0, expected - (params.shortageQtyDiff || 5));
        itemStatus = ItemStatus.RED;
      }

      await prisma.verificationItem.upsert({
        where: {
          orderId_componentId: {
            orderId: order.id,
            componentId: comp.id,
          },
        },
        update: {
          expectedQty: expected,
          actualQty: actual,
          status: itemStatus,
        },
        create: {
          orderId: order.id,
          componentId: comp.id,
          expectedQty: expected,
          actualQty: actual,
          status: itemStatus,
        },
      });
    }

    if (params.verificationLog) {
      const existing = await prisma.verificationLog.findFirst({
        where: { orderId: order.id },
      });
      if (!existing) {
        await prisma.verificationLog.create({
          data: {
            orderId: order.id,
            verifierId: verifier.id,
            decision: params.verificationLog.decision,
            rejectionNote: params.verificationLog.note || null,
            wastagePct: params.verificationLog.wastagePct,
          },
        });
      }
    }

    if (params.sewingJob) {
      await prisma.sewingJob.upsert({
        where: { orderId: order.id },
        update: {
          startedById: sewingSupervisor.id,
          startedAt: new Date(),
          notes: params.sewingJob.notes,
        },
        create: {
          orderId: order.id,
          startedById: sewingSupervisor.id,
          startedAt: new Date(),
          notes: params.sewingJob.notes,
        },
      });
    }

    return order;
  }

  // 3. Seed Realistic Apparel Production Orders
  await seedOrder({
    orderNo: 'CUT-2026-0001',
    recipeData: blouse,
    targetQty: 100,
    fabricRollId: 'ROLL-BL-901',
    actualFabricYds: 182.0,
    status: OrderStatus.PENDING_VERIFICATION,
  });

  await seedOrder({
    orderNo: 'CUT-2026-0002',
    recipeData: cropTop,
    targetQty: 50,
    fabricRollId: 'ROLL-CT-402',
    actualFabricYds: 60.5,
    status: OrderStatus.PENDING_VERIFICATION,
    shortageComponentIndex: 2, // Neck Binding Strip
    shortageQtyDiff: 8,
  });

  await seedOrder({
    orderNo: 'CUT-2026-0003',
    recipeData: polo,
    targetQty: 80,
    fabricRollId: 'ROLL-PL-701',
    actualFabricYds: 118.0,
    status: OrderStatus.PENDING_VERIFICATION,
  });

  await seedOrder({
    orderNo: 'CUT-2026-0004',
    recipeData: tshirt,
    targetQty: 150,
    fabricRollId: 'ROLL-TS-310',
    actualFabricYds: 191.0,
    status: OrderStatus.IN_PROGRESS,
  });

  await seedOrder({
    orderNo: 'CUT-2026-0005',
    recipeData: hoodie,
    targetQty: 60,
    fabricRollId: 'ROLL-HD-105',
    actualFabricYds: 142.0,
    status: OrderStatus.IN_PROGRESS,
  });

  await seedOrder({
    orderNo: 'CUT-2026-0006',
    recipeData: denim,
    targetQty: 75,
    fabricRollId: 'ROLL-DN-882',
    actualFabricYds: 161.0,
    status: OrderStatus.VERIFIED,
    verifiedAt: new Date(),
    verificationLog: { decision: 'APPROVED', wastagePct: 2.22 },
  });

  await seedOrder({
    orderNo: 'CUT-2026-0007',
    recipeData: oxford,
    targetQty: 60,
    fabricRollId: 'ROLL-OX-551',
    actualFabricYds: 108.5,
    status: OrderStatus.VERIFIED,
    verifiedAt: new Date(),
    verificationLog: { decision: 'APPROVED', wastagePct: 3.33 },
  });

  await seedOrder({
    orderNo: 'CUT-2026-0008',
    recipeData: cropTop,
    targetQty: 40,
    fabricRollId: 'ROLL-CT-503',
    actualFabricYds: 45.0,
    status: OrderStatus.SEWING_STARTED,
    verifiedAt: new Date(),
    verificationLog: { decision: 'APPROVED', wastagePct: 2.27 },
    sewingJob: { notes: 'Line 02 intake initialized - priority fast-fashion lot' },
  });

  await seedOrder({
    orderNo: 'CUT-2026-0009',
    recipeData: blouse,
    targetQty: 50,
    fabricRollId: 'ROLL-BL-880',
    actualFabricYds: 95.0,
    status: OrderStatus.REJECTED,
    verifiedAt: new Date(),
    shortageComponentIndex: 0,
    shortageQtyDiff: 5,
    verificationLog: {
      decision: 'REJECTED',
      note: 'Front Body Panel has a shortage of 5 pieces due to fabric roll end flaw. Returned to supervisor for re-cut.',
      wastagePct: 5.56,
    },
  });

  console.log('✅ Seeded 9 Demo Orders across all states.');
  console.log('🎉 Database Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error executing seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
