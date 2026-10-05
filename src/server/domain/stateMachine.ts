import { OrderStatus } from '@prisma/client';
import { InvalidTransitionError } from '../http';

/**
 * State Transition Rules for ApparelFlow Cutting Orders:
 *
 * IN_PROGRESS             -> PENDING_VERIFICATION
 * PENDING_VERIFICATION    -> VERIFIED | REJECTED
 * REJECTED                -> IN_PROGRESS (re-cut start) | PENDING_VERIFICATION (re-cut resubmit)
 * VERIFIED                -> SEWING_STARTED
 */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  [OrderStatus.IN_PROGRESS]: [OrderStatus.PENDING_VERIFICATION],
  [OrderStatus.PENDING_VERIFICATION]: [OrderStatus.VERIFIED, OrderStatus.REJECTED],
  [OrderStatus.REJECTED]: [OrderStatus.IN_PROGRESS, OrderStatus.PENDING_VERIFICATION],
  [OrderStatus.VERIFIED]: [OrderStatus.SEWING_STARTED],
  [OrderStatus.SEWING_STARTED]: [], // Terminal state in cutting subsystem
} as const;

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  const allowed = ALLOWED_TRANSITIONS[from];
  return Boolean(allowed && allowed.includes(to));
}

export function assertTransition(from: OrderStatus, to: OrderStatus, orderNo?: string): void {
  if (!canTransition(from, to)) {
    const orderRef = orderNo ? ` for order ${orderNo}` : '';
    throw new InvalidTransitionError(
      `Illegal order status transition${orderRef}: Cannot transition from '${from}' to '${to}'.`
    );
  }
}
