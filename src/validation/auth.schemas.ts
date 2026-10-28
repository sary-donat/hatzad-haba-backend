import { z } from './zod';
import { emailSchema, fullNameSchema, idSchema, jobRoleIdsSchema, passwordSchema } from './common.schemas';

export const registerSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  password: passwordSchema,
  institutionId: idSchema,
  /** התחומים שהתלמיד מחפש בהם עבודה — רשות */
  jobRoleIds: jobRoleIdsSchema.default([]),
});

export const updateMyJobRolesSchema = z.object({
  jobRoleIds: jobRoleIdsSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(200),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateMyJobRolesInput = z.infer<typeof updateMyJobRolesSchema>;
