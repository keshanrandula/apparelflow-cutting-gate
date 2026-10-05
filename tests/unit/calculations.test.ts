import { describe, it, expect } from 'vitest';
import { computeItemStatus, computeFabricWastagePct } from '@/server/domain/calculations';
import { ItemStatus } from '@prisma/client';

describe('Domain Calculations & Verification Rules Unit Tests', () => {
  it('computes exact component traffic light statuses', () => {
    // Exact match -> GREEN
    expect(computeItemStatus(100, 100)).toBe(ItemStatus.GREEN);
    expect(computeItemStatus(0, 0)).toBe(ItemStatus.GREEN);

    // Surplus actual > expected -> YELLOW
    expect(computeItemStatus(105, 100)).toBe(ItemStatus.YELLOW);
    expect(computeItemStatus(1, 0)).toBe(ItemStatus.YELLOW);

    // Shortage actual < expected -> RED
    expect(computeItemStatus(95, 100)).toBe(ItemStatus.RED);
    expect(computeItemStatus(0, 50)).toBe(ItemStatus.RED);
  });

  it('computes fabric wastage % correctly according to domain formula', () => {
    // Formula: ((actual - expected) / expected) * 100
    // stdFabric = 1.8, targetQty = 100 -> expected = 180.0
    // actual = 189.0 -> wastage = ((189 - 180) / 180) * 100 = 5.0%
    const res1 = computeFabricWastagePct(189.0, 1.8, 100);
    expect(res1.expectedFabricYds).toBe(180.0);
    expect(res1.wastagePct).toBe(5.0);

    // actual = 180.0 -> wastage = 0%
    const res2 = computeFabricWastagePct(180.0, 1.8, 100);
    expect(res2.wastagePct).toBe(0.0);

    // actual = 171.0 (fabric savings) -> wastage = -5.0%
    const res3 = computeFabricWastagePct(171.0, 1.8, 100);
    expect(res3.wastagePct).toBe(-5.0);
  });
});
