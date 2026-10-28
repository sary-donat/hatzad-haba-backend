import { z } from './zod';
import {
  atLeastOneField,
  atLeastOneFieldMessage,
  booleanQuery,
  emailSchema,
  fullNameSchema,
  idSchema,
  paginationQuery,
  passwordSchema,
  searchQuery,
} from './common.schemas';

export const listUsersQuery = z.object({
  search: searchQuery,
  role: z.enum(['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'STUDENT']).optional(),
  institutionId: idSchema.optional(),
  isActive: booleanQuery.optional(),
  approvalStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  /** תלמידים שמחפשים עבודה בתחום הזה */
  jobRoleId: idSchema.optional(),
  ...paginationQuery,
});

export const createUserSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: z
    .enum(['INSTITUTION_ADMIN', 'STUDENT'], { error: 'אפשר ליצור רק מנהל מוסד (INSTITUTION_ADMIN) או תלמיד (STUDENT)' })
    .default('INSTITUTION_ADMIN'),
  institutionId: idSchema,
});

export const updateUserSchema = z
  .object({
    fullName: fullNameSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .refine(atLeastOneField, atLeastOneFieldMessage);

export type ListUsersQuery = z.infer<typeof listUsersQuery>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
