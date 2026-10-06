import { describe, it, expect } from 'vitest';
import { computeItemStatus, computeWastagePct } from '@/server/domain/trafficLight';
import { canTransition, assertTransition } from '@/server/domain/stateMachine';
import { OrderStatus, ItemStatus } from '@prisma/client';
import { InvalidTransitionError } from '@/server/http';

describe('Unit (Pure) - computeItemStatus', () => {
  it('returns GREEN when actual equals expected', () => {
    expect(computeItemStatus(100, 100)).toBe(ItemStatus.GREEN);
    expect(computeItemStatus(1, 1)).toBe(ItemStatus.GREEN);
  });

  it('returns YELLOW when actual is greater than expected (surplus/excess)', () => {
    expect(computeItemStatus(100, 105)).toBe(ItemStatus.YELLOW);
    expect(computeItemStatus(50, 51)).toBe(ItemStatus.YELLOW);
  });

  it('returns RED when actual is less than expected (shortage)', () => {
    expect(computeItemStatus(100, 99)).toBe(ItemStatus.RED);
    expect(computeItemStatus(50, 40)).toBe(ItemStatus.RED);
  });

  it('handles zero values correctly (zero expected and zero actual is GREEN, zero actual with positive expected is RED)', () => {
    expect(computeItemStatus(0, 0)).toBe(ItemStatus.GREEN);
    expect(computeItemStatus(50, 0)).toBe(ItemStatus.RED);
    expect(computeItemStatus(0, 5)).toBe(ItemStatus.YELLOW);
  });
});

describe('Unit (Pure) - computeWastagePct', () => {
  it('computes exact fabric wastage percentage against standard target', () => {
    // 50 garments * 1.5 yds = 75 yds expected. Actual = 80 yds -> ((80-75)/75)*100 = 6.67%
    expect(computeWastagePct(80, 1.5, 50)).toBe(6.67);
  });

  it('computes 0% wastage when actual matches expected perfectly', () => {
    // 100 * 2.0 = 200 yds expected. Actual = 200 yds -> 0.00%
    expect(computeWastagePct(200, 2.0, 100)).toBe(0);
  });

  it('computes negative percentage if fabric used was under standard', () => {
    // 100 * 2.0 = 200 yds expected. Actual = 190 yds -> -5.00%
    expect(computeWastagePct(190, 2.0, 100)).toBe(-5.0);
  });

  it('returns 0 when expected fabric is 0 (handles division by zero safely)', () => {
    expect(computeWastagePct(50, 0, 0)).toBe(0);
  });
});

describe('Unit (Pure) - State Machine canTransition & assertTransition', () => {
  it('allows all valid transitions defined in state map', () => {
    // IN_PROGRESS -> PENDING_VERIFICATION
    expect(canTransition(OrderStatus.IN_PROGRESS, OrderStatus.PENDING_VERIFICATION)).toBe(true);
    expect(() =>
      assertTransition(OrderStatus.IN_PROGRESS, OrderStatus.PENDING_VERIFICATION)
    ).not.toThrow();

    // PENDING_VERIFICATION -> VERIFIED
    expect(canTransition(OrderStatus.PENDING_VERIFICATION, OrderStatus.VERIFIED)).toBe(true);
    expect(() =>
      assertTransition(OrderStatus.PENDING_VERIFICATION, OrderStatus.VERIFIED)
    ).not.toThrow();

    // PENDING_VERIFICATION -> REJECTED
    expect(canTransition(OrderStatus.PENDING_VERIFICATION, OrderStatus.REJECTED)).toBe(true);
    expect(() =>
      assertTransition(OrderStatus.PENDING_VERIFICATION, OrderStatus.REJECTED)
    ).not.toThrow();

    // REJECTED -> IN_PROGRESS
    expect(canTransition(OrderStatus.REJECTED, OrderStatus.IN_PROGRESS)).toBe(true);

    // REJECTED -> PENDING_VERIFICATION (Supervisor resubmit)
    expect(canTransition(OrderStatus.REJECTED, OrderStatus.PENDING_VERIFICATION)).toBe(true);

    // VERIFIED -> SEWING_STARTED
    expect(canTransition(OrderStatus.VERIFIED, OrderStatus.SEWING_STARTED)).toBe(true);
    expect(() =>
      assertTransition(OrderStatus.VERIFIED, OrderStatus.SEWING_STARTED)
    ).not.toThrow();
  });

  it('strictly rejects illegal transitions with InvalidTransitionError (409)', () => {
    // IN_PROGRESS -> VERIFIED (Bypassing verification)
    expect(canTransition(OrderStatus.IN_PROGRESS, OrderStatus.VERIFIED)).toBe(false);
    expect(() =>
      assertTransition(OrderStatus.IN_PROGRESS, OrderStatus.VERIFIED, 'ORD-001')
    ).toThrow(InvalidTransitionError);

    // IN_PROGRESS -> SEWING_STARTED
    expect(canTransition(OrderStatus.IN_PROGRESS, OrderStatus.SEWING_STARTED)).toBe(false);
    expect(() =>
      assertTransition(OrderStatus.IN_PROGRESS, OrderStatus.SEWING_STARTED, 'ORD-001')
    ).toThrow(InvalidTransitionError);

    // REJECTED -> VERIFIED (Direct bypass)
    expect(canTransition(OrderStatus.REJECTED, OrderStatus.VERIFIED)).toBe(false);
    expect(() =>
      assertTransition(OrderStatus.REJECTED, OrderStatus.VERIFIED, 'ORD-001')
    ).toThrow(InvalidTransitionError);

    // SEWING_STARTED -> IN_PROGRESS or VERIFIED
    expect(canTransition(OrderStatus.SEWING_STARTED, OrderStatus.IN_PROGRESS)).toBe(false);
    expect(canTransition(OrderStatus.SEWING_STARTED, OrderStatus.VERIFIED)).toBe(false);
    expect(() =>
      assertTransition(OrderStatus.SEWING_STARTED, OrderStatus.VERIFIED, 'ORD-001')
    ).toThrow(InvalidTransitionError);
  });
});
