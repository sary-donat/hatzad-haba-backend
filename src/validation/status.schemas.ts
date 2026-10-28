import { z } from './zod';
import { atLeastOneField, atLeastOneFieldMessage, idSchema, optionalText, requiredText } from './common.schemas';

const suggestedDays = z.number().int().min(0).max(60).nullable().optional();
const sortOrder = z.number().int().min(0).max(10000);

export const createStatusSchema = z.object({
  name: requiredText(60, 2),
  isFinal: z.boolean().default(false),
  suggestedAction: optionalText(200),
  suggestedDays,
  sortOrder: sortOrder.default(100),
  institutionId: idSchema.optional(),
});

export const updateStatusSchema = z
  .object({
    name: requiredText(60, 2).optional(),
    isFinal: z.boolean().optional(),
    suggestedAction: optionalText(200),
    suggestedDays,
    sortOrder: sortOrder.optional(),
    isActive: z.boolean().optional(),
  })
  .refine(atLeastOneField, atLeastOneFieldMessage);

export type CreateStatusInput = z.infer<typeof createStatusSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
