import { z } from './zod';
import { atLeastOneField, atLeastOneFieldMessage, dateOnlySchema, optionalText, requiredText } from './common.schemas';

export const actionStatusSchema = z.enum(['OPEN', 'DONE'], { error: 'הסטטוס צריך להיות OPEN או DONE' });

export const createActionSchema = z.object({
  title: requiredText(200),
  dueOn: dateOnlySchema,
  notes: optionalText(2000),
});

export const updateActionSchema = z
  .object({
    title: requiredText(200).optional(),
    dueOn: dateOnlySchema.optional(),
    notes: optionalText(2000),
    status: actionStatusSchema.optional(),
  })
  .refine(atLeastOneField, atLeastOneFieldMessage);

export const listActionsQuery = z.object({
  status: actionStatusSchema.optional(),
});

export type CreateActionInput = z.infer<typeof createActionSchema>;
export type UpdateActionInput = z.infer<typeof updateActionSchema>;
