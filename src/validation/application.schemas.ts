import { z } from './zod';
import {
  atLeastOneField,
  atLeastOneFieldMessage,
  booleanQuery,
  dateOnlySchema,
  dateTimeSchema,
  idSchema,
  optionalText,
  paginationQuery,
  requiredText,
  searchQuery,
} from './common.schemas';

export const interestLevelSchema = z.enum(['LOW', 'MEDIUM', 'HIGH'], {
  error: 'רמת העניין צריכה להיות LOW, MEDIUM או HIGH',
});

const jobUrlSchema = z
  .string()
  .trim()
  .max(500)
  .nullable()
  .optional()
  .transform((value) => (value === '' ? null : value))
  .refine((value) => value == null || /^https?:\/\/\S+\.\S+/.test(value), 'יש להזין כתובת אינטרנט מלאה שמתחילה ב־http:// או https://');

const applicationFields = {
  companyName: requiredText(120),
  jobTitle: requiredText(120),
  submittedOn: dateOnlySchema,
  statusId: idSchema,
  jobRoleId: idSchema.nullable().optional(),
  jobUrl: jobUrlSchema,
  contactName: optionalText(100),
  interestLevel: interestLevelSchema.nullable().optional(),
  jobAttractions: optionalText(2000),
  pointsToClarify: optionalText(2000),
  notes: optionalText(5000),
  interviewAt: dateTimeSchema.nullable().optional(),
  interviewLocation: optionalText(300),
  interviewPreparation: optionalText(5000),
  interviewQuestions: optionalText(5000),
};

export const createApplicationSchema = z.object({
  ...applicationFields,
  /** מנהלים חייבים לציין עבור איזה תלמיד. תלמיד אינו צריך לשלוח */
  userId: idSchema.optional(),
});

export const updateApplicationSchema = z
  .object({
    companyName: applicationFields.companyName.optional(),
    jobTitle: applicationFields.jobTitle.optional(),
    submittedOn: applicationFields.submittedOn.optional(),
    statusId: applicationFields.statusId.optional(),
    jobRoleId: applicationFields.jobRoleId,
    jobUrl: applicationFields.jobUrl,
    contactName: applicationFields.contactName,
    interestLevel: applicationFields.interestLevel,
    jobAttractions: applicationFields.jobAttractions,
    pointsToClarify: applicationFields.pointsToClarify,
    notes: applicationFields.notes,
    interviewAt: applicationFields.interviewAt,
    interviewLocation: applicationFields.interviewLocation,
    interviewPreparation: applicationFields.interviewPreparation,
    interviewQuestions: applicationFields.interviewQuestions,
  })
  .refine(atLeastOneField, atLeastOneFieldMessage);

export const listApplicationsQuery = z.object({
  search: searchQuery,
  statusId: idSchema.optional(),
  interestLevel: interestLevelSchema.optional(),
  jobRoleId: idSchema.optional(),
  isOpen: booleanQuery.optional(),
  userId: idSchema.optional(),
  institutionId: idSchema.optional(),
  sortBy: z.enum(['submittedOn', 'companyName', 'updatedAt', 'interestLevel']).default('submittedOn'),
  order: z.enum(['asc', 'desc']).default('desc'),
  ...paginationQuery,
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type ListApplicationsQuery = z.infer<typeof listApplicationsQuery>;
