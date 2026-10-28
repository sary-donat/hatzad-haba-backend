import { z } from './zod';
import {
  atLeastOneField,
  atLeastOneFieldMessage,
  optionalText,
  requiredText,
  searchQuery,
} from './common.schemas';

/** דוא״ל ליצירת קשר — רשות. מחרוזת ריקה נשמרת כ־null */
const contactEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(255)
  .nullable()
  .optional()
  .transform((value) => (value === '' ? null : value))
  .refine((value) => value == null || z.email().safeParse(value).success, 'כתובת דוא״ל לא תקינה');

export const createInstitutionSchema = z.object({
  name: requiredText(100, 2),
  city: optionalText(80),
  contactEmail: contactEmailSchema,
});

export const updateInstitutionSchema = z
  .object({
    name: requiredText(100, 2).optional(),
    city: optionalText(80),
    contactEmail: contactEmailSchema,
  })
  .refine(atLeastOneField, atLeastOneFieldMessage);

export const institutionSearchQuery = z.object({
  search: searchQuery,
});

export type CreateInstitutionInput = z.infer<typeof createInstitutionSchema>;
export type UpdateInstitutionInput = z.infer<typeof updateInstitutionSchema>;
