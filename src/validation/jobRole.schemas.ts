import { z } from './zod';
import { atLeastOneField, atLeastOneFieldMessage, booleanQuery, idSchema, requiredText } from './common.schemas';

export const listCatalogQuery = z.object({
  includeInactive: booleanQuery.optional(),
  institutionId: idSchema.optional(),
});

export const createJobRoleSchema = z.object({
  name: requiredText(80, 2),
  institutionId: idSchema.optional(),
});

export const updateJobRoleSchema = z
  .object({
    name: requiredText(80, 2).optional(),
    isActive: z.boolean().optional(),
  })
  .refine(atLeastOneField, atLeastOneFieldMessage);

export type ListCatalogQuery = z.infer<typeof listCatalogQuery>;
export type CreateJobRoleInput = z.infer<typeof createJobRoleSchema>;
export type UpdateJobRoleInput = z.infer<typeof updateJobRoleSchema>;
