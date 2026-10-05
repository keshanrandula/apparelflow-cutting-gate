import { z } from 'zod';
import { Decision } from '@prisma/client';

export const countItemSchema = z
  .object({
    componentId: z.string().trim().min(1, 'Component ID is required'),
    actualQty: z
      .number()
      .int('Actual quantity must be a whole integer')
      .min(0, 'Actual quantity cannot be negative'),
  })
  .strict();

export const saveCountsSchema = z
  .object({
    counts: z.array(countItemSchema).min(1, 'At least one component count is required'),
  })
  .strict();

export const saveComponentCountsSchema = saveCountsSchema;

export const approveOrderSchema = z
  .object({
    counts: z.array(countItemSchema).min(1, 'Component counts are required for approval'),
  })
  .strict();

export const rejectOrderSchema = z
  .object({
    note: z
      .string()
      .trim()
      .min(5, 'Rejection note must be at least 5 characters')
      .max(500, 'Rejection note cannot exceed 500 characters'),
  })
  .strict();

export const verifyOrderSchema = z
  .object({
    decision: z.nativeEnum(Decision),
    rejectionNote: z.string().trim().max(500).optional(),
    counts: z.array(countItemSchema).optional(),
  })
  .strict();

export const startSewingSchema = z
  .object({
    notes: z.string().trim().max(500, 'Notes cannot exceed 500 characters').optional(),
  })
  .strict();

export type CountItemInput = z.infer<typeof countItemSchema>;
export type SaveCountsInput = z.infer<typeof saveCountsSchema>;
export type SaveComponentCountsInput = SaveCountsInput;
export type ApproveOrderInput = z.infer<typeof approveOrderSchema>;
export type RejectOrderInput = z.infer<typeof rejectOrderSchema>;
export type VerifyOrderInput = z.infer<typeof verifyOrderSchema>;
export type StartSewingInput = z.infer<typeof startSewingSchema>;
