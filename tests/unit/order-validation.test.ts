import { describe, it, expect } from 'vitest';
import { createOrderSchema, getExpectedComponentsSchema } from '@/server/validators/order.schema';

describe('Order Zod Validation Unit Tests', () => {
  const validPayload = {
    recipeId: 'rec_123',
    targetQty: 100,
    fabricRollId: 'ROLL-2026-A',
    actualFabricYds: 180.5,
  };

  it('accepts valid cutting order payload', () => {
    const result = createOrderSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('strictly rejects decimal, negative, zero, and NaN target quantities', () => {
    // Decimal targetQty
    const decimalRes = createOrderSchema.safeParse({ ...validPayload, targetQty: 100.5 });
    expect(decimalRes.success).toBe(false);

    // Negative targetQty
    const negativeRes = createOrderSchema.safeParse({ ...validPayload, targetQty: -50 });
    expect(negativeRes.success).toBe(false);

    // Zero targetQty
    const zeroRes = createOrderSchema.safeParse({ ...validPayload, targetQty: 0 });
    expect(zeroRes.success).toBe(false);

    // String / NaN targetQty
    const stringRes = createOrderSchema.safeParse({ ...validPayload, targetQty: 'hundred' });
    expect(stringRes.success).toBe(false);
  });

  it('strictly validates fabricRollId formatting', () => {
    // Empty string
    const emptyRes = createOrderSchema.safeParse({ ...validPayload, fabricRollId: '   ' });
    expect(emptyRes.success).toBe(false);

    // Over 50 characters
    const longRes = createOrderSchema.safeParse({
      ...validPayload,
      fabricRollId: 'A'.repeat(51),
    });
    expect(longRes.success).toBe(false);
  });

  it('validates fabric yards must be positive number with max 2 decimals', () => {
    const negativeYards = createOrderSchema.safeParse({ ...validPayload, actualFabricYds: -10 });
    expect(negativeYards.success).toBe(false);

    const zeroYards = createOrderSchema.safeParse({ ...validPayload, actualFabricYds: 0 });
    expect(zeroYards.success).toBe(false);

    const tooManyDecimals = createOrderSchema.safeParse({
      ...validPayload,
      actualFabricYds: 12.3456,
    });
    expect(tooManyDecimals.success).toBe(false);

    const validTwoDecimals = createOrderSchema.safeParse({
      ...validPayload,
      actualFabricYds: 180.75,
    });
    expect(validTwoDecimals.success).toBe(true);
  });
});
