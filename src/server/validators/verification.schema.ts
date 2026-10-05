import { z } from 'zod';
import { Decision } from '@prisma/client';

export const saveComponentCountsSchema = z.object({
  counts: z
    .array(
      z.object({
        componentId: z.string().trim().min(1, 'Component ID is required'),
        actualQty: z
          .number()
          .int('Actual quantity must be a whole integer')
          .min(0, 'Actual quantity cannot be negative'),
      })
    )
    .min(1, 'At least one component count is required'),
});

export const verifyOrderSchema = z.object({
  decision: z.nativeEnum(Decision),
  rejectionNote: z
    .string()
    .trim()
    .max(500, 'Rejection note cannot exceed 500 characters')
    .optional(),
});

export const startSewingSchema = z.object({
  notes: z.string().trim().max(500, 'Notes cannot exceed 500 characters').optional(),
});

export type SaveComponentCountsInput = z.infer<typeof saveComponentCountsSchema>;
export type VerifyOrderInput = z.infer<typeof verifyOrderSchema>;
export type StartSewingInput = z.infer<typeof startSewingSchema>;
