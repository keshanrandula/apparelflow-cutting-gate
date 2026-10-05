import { describe, it, expect } from 'vitest';
import { canTransition, assertTransition } from '@/server/domain/stateMachine';
import { OrderStatus } from '@prisma/client';
import { InvalidTransitionError } from '@/server/http';

describe('Central Order State Machine Unit Tests', () => {
  it('allows valid state machine transitions', () => {
    // IN_PROGRESS -> PENDING_VERIFICATION
    expect(canTransition(OrderStatus.IN_PROGRESS, OrderStatus.PENDING_VERIFICATION)).toBe(true);
    expect(() => assertTransition(OrderStatus.IN_PROGRESS, OrderStatus.PENDING_VERIFICATION)).not.toThrow();

    // PENDING_VERIFICATION -> VERIFIED
    expect(canTransition(OrderStatus.PENDING_VERIFICATION, OrderStatus.VERIFIED)).toBe(true);

    // PENDING_VERIFICATION -> REJECTED
    expect(canTransition(OrderStatus.PENDING_VERIFICATION, OrderStatus.REJECTED)).toBe(true);

    // REJECTED -> IN_PROGRESS (re-cut)
    expect(canTransition(OrderStatus.REJECTED, OrderStatus.IN_PROGRESS)).toBe(true);

    // REJECTED -> PENDING_VERIFICATION (resubmit)
    expect(canTransition(OrderStatus.REJECTED, OrderStatus.PENDING_VERIFICATION)).toBe(true);

    // VERIFIED -> SEWING_STARTED
    expect(canTransition(OrderStatus.VERIFIED, OrderStatus.SEWING_STARTED)).toBe(true);
  });

  it('strictly rejects illegal transitions with InvalidTransitionError (409)', () => {
    // IN_PROGRESS cannot jump directly to VERIFIED
    expect(canTransition(OrderStatus.IN_PROGRESS, OrderStatus.VERIFIED)).toBe(false);
    expect(() => assertTransition(OrderStatus.IN_PROGRESS, OrderStatus.VERIFIED, 'CUT-2026-0001')).toThrow(
      InvalidTransitionError
    );

    // IN_PROGRESS cannot jump directly to SEWING_STARTED
    expect(canTransition(OrderStatus.IN_PROGRESS, OrderStatus.SEWING_STARTED)).toBe(false);
    expect(() => assertTransition(OrderStatus.IN_PROGRESS, OrderStatus.SEWING_STARTED)).toThrow(
      InvalidTransitionError
    );

    // REJECTED cannot jump directly to VERIFIED (must be re-cut/verified)
    expect(canTransition(OrderStatus.REJECTED, OrderStatus.VERIFIED)).toBe(false);
    expect(() => assertTransition(OrderStatus.REJECTED, OrderStatus.VERIFIED)).toThrow(
      InvalidTransitionError
    );

    // SEWING_STARTED cannot transition backwards
    expect(canTransition(OrderStatus.SEWING_STARTED, OrderStatus.IN_PROGRESS)).toBe(false);
    expect(canTransition(OrderStatus.SEWING_STARTED, OrderStatus.VERIFIED)).toBe(false);
  });
});
