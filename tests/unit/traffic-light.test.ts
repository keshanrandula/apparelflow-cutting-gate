import { describe, it, expect } from 'vitest';
import { computeItemStatus, computeWastagePct } from '@/server/domain/trafficLight';
import { ItemStatus } from '@prisma/client';

describe('Gatekeeper Traffic Light & Wastage Pure Domain Functions', () => {
  describe('computeItemStatus(expected, actual)', () => {
    it('returns GREEN when actual exactly equals expected quantity', () => {
      expect(computeItemStatus(100, 100)).toBe(ItemStatus.GREEN);
      expect(computeItemStatus(1, 1)).toBe(ItemStatus.GREEN);
      expect(computeItemStatus(0, 0)).toBe(ItemStatus.GREEN);
    });

    it('returns YELLOW when actual is greater than expected (surplus)', () => {
      expect(computeItemStatus(100, 101)).toBe(ItemStatus.YELLOW);
      expect(computeItemStatus(50, 60)).toBe(ItemStatus.YELLOW);
    });

    it('returns RED when actual is less than expected (shortage defect)', () => {
      expect(computeItemStatus(100, 99)).toBe(ItemStatus.RED);
      expect(computeItemStatus(50, 0)).toBe(ItemStatus.RED);
      expect(computeItemStatus(10, 8)).toBe(ItemStatus.RED);
    });
  });

  describe('computeWastagePct(actualYds, stdYards, targetQty)', () => {
    it('accurately computes positive wastage percentage', () => {
      // stdYards = 1.8, targetQty = 100 -> expected = 180 yds
      // actual = 189 yds -> wastage = ((189 - 180) / 180) * 100 = 5.0%
      const wastage = computeWastagePct(189.0, 1.8, 100);
      expect(wastage).toBe(5.0);
    });

    it('returns 0% when actual matches expected standard exactly', () => {
      const wastage = computeWastagePct(180.0, 1.8, 100);
      expect(wastage).toBe(0.0);
    });

    it('returns negative percentage when fabric is saved (efficiency gain)', () => {
      const wastage = computeWastagePct(171.0, 1.8, 100);
      expect(wastage).toBe(-5.0);
    });

    it('safely handles zero target quantity without dividing by zero', () => {
      const wastage = computeWastagePct(100.0, 1.8, 0);
      expect(wastage).toBe(0);
    });
  });
});
