import { ItemStatus } from '@prisma/client';

/**
 * Computes component status based on physical actual quantity vs expected quantity:
 * - GREEN:  actual == expected (Exact match)
 * - YELLOW: actual > expected  (Over-cut surplus)
 * - RED:    actual < expected  (Shortage defect)
 */
export function computeItemStatus(actualQty: number, expectedQty: number): ItemStatus {
  if (actualQty === expectedQty) {
    return ItemStatus.GREEN;
  }
  if (actualQty > expectedQty) {
    return ItemStatus.YELLOW;
  }
  return ItemStatus.RED;
}

/**
 * Computes Fabric Wastage Percentage:
 * Formula: ((actual_fabric_yds - expected_fabric) / expected_fabric) * 100
 * where expected_fabric = std_fabric_yards * target_qty
 */
export function computeFabricWastagePct(
  actualFabricYds: number,
  stdFabricYards: number,
  targetQty: number
): { expectedFabricYds: number; wastagePct: number } {
  const expectedFabricYds = stdFabricYards * targetQty;
  if (expectedFabricYds <= 0) {
    return { expectedFabricYds: 0, wastagePct: 0 };
  }

  const wastagePct = ((actualFabricYds - expectedFabricYds) / expectedFabricYds) * 100;
  return {
    expectedFabricYds: Number(expectedFabricYds.toFixed(2)),
    wastagePct: Number(wastagePct.toFixed(2)),
  };
}
