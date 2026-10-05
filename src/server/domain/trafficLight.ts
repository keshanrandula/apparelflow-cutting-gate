import { ItemStatus } from '@prisma/client';

/**
 * Computes component traffic light status based on expected vs actual quantities:
 * - GREEN:  actual == expected (Exact match)
 * - YELLOW: actual > expected  (Surplus)
 * - RED:    actual < expected  (Shortage)
 */
export function computeItemStatus(expected: number, actual: number): ItemStatus {
  if (actual === expected) {
    return ItemStatus.GREEN;
  }
  if (actual > expected) {
    return ItemStatus.YELLOW;
  }
  return ItemStatus.RED;
}

/**
 * Computes Fabric Wastage Percentage:
 * Formula: ((actual_fabric_yds - expected_fabric) / expected_fabric) * 100
 * where expected_fabric = std_fabric_yards * target_qty
 */
export function computeWastagePct(
  actualYds: number,
  stdYards: number,
  targetQty: number
): number {
  const expectedFabric = stdYards * targetQty;
  if (expectedFabric <= 0) {
    return 0;
  }

  const wastage = ((actualYds - expectedFabric) / expectedFabric) * 100;
  return Number(wastage.toFixed(2));
}
