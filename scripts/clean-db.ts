import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning up test artifacts and recipes without components...');

  // 1. Delete test sewing jobs
  await prisma.sewingJob.deleteMany({
    where: {
      order: {
        recipe: {
          recipeCode: {
            startsWith: 'SEW-REC-',
          },
        },
      },
    },
  });

  // 2. Delete test verification logs
  await prisma.verificationLog.deleteMany({
    where: {
      order: {
        recipe: {
          recipeCode: {
            startsWith: 'SEW-REC-',
          },
        },
      },
    },
  });

  // 3. Delete test verification items
  await prisma.verificationItem.deleteMany({
    where: {
      order: {
        recipe: {
          recipeCode: {
            startsWith: 'SEW-REC-',
          },
        },
      },
    },
  });

  // 4. Delete test cutting orders
  const deletedOrders = await prisma.cuttingOrder.deleteMany({
    where: {
      recipe: {
        recipeCode: {
          startsWith: 'SEW-REC-',
        },
      },
    },
  });
  console.log(`Deleted ${deletedOrders.count} test orders.`);

  // 5. Delete recipes with code starting with SEW-REC- or having 0 components
  const recipesWithoutComponents = await prisma.recipe.findMany({
    where: {
      OR: [
        { recipeCode: { startsWith: 'SEW-REC-' } },
        { components: { none: {} } },
      ],
    },
    include: {
      cuttingOrders: true,
    },
  });

  for (const r of recipesWithoutComponents) {
    if (r.cuttingOrders.length === 0) {
      await prisma.recipe.delete({
        where: { id: r.id },
      });
      console.log(`Deleted orphaned recipe: ${r.name} (${r.recipeCode})`);
    }
  }

  // 6. Delete test users
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      email: {
        in: [
          'sew_test_sup@apparelflow.com',
          'sew_test_ver@apparelflow.com',
          'sew_test_sew@apparelflow.com',
        ],
      },
    },
  });
  console.log(`Deleted ${deletedUsers.count} test users.`);

  console.log('✨ Cleanup complete!');
}

main()
  .catch((e) => {
    console.error('Error during cleanup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
