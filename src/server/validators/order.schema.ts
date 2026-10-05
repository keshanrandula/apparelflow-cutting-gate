import { z } from 'zod';

const decimalTwoPlaces = z
  .number()
  .positive('Fabric yards must be greater than 0')
  .refine(
    (val) => {
      // Allow up to 2 decimal places precision
      return Number(val.toFixed(2)) === val || Math.round(val * 100) / 100 === val;
    },
    { message: 'Fabric yards can have at most 2 decimal places' }
  );

export const createOrderSchema = z.object({
  recipeId: z
    .string()
    .trim()
    .min(1, 'Recipe ID cannot be empty'),
  targetQty: z
    .number()
    .int('Target quantity must be a whole integer (no decimals allowed)')
    .min(1, 'Target quantity must be at least 1')
    .max(100000, 'Target quantity cannot exceed 100,000 units'),
  fabricRollId: z
    .string()
    .trim()
    .min(1, 'Fabric Roll ID cannot be empty')
    .max(50, 'Fabric Roll ID cannot exceed 50 characters'),
  actualFabricYds: decimalTwoPlaces,
});

export const resubmitOrderSchema = z.object({
  updatedFabricYds: decimalTwoPlaces.optional(),
});

export const getExpectedComponentsSchema = z.object({
  recipeId: z.string().trim().min(1, 'Recipe ID is required'),
  targetQty: z.coerce
    .number()
    .int('Target quantity must be an integer')
    .min(1, 'Target quantity must be at least 1')
    .max(100000, 'Target quantity cannot exceed 100,000 units'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type ResubmitOrderInput = z.infer<typeof resubmitOrderSchema>;
export type GetExpectedComponentsInput = z.infer<typeof getExpectedComponentsSchema>;
