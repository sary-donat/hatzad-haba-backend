import { z } from './zod';

export const idSchema = z.coerce.number().int().positive();

export const idParamSchema = z.object({ id: idSchema });

/** רשימת מזהים של תחומי תפקיד — כפילויות מוסרות */
export const jobRoleIdsSchema = z
  .array(idSchema, { error: 'יש לשלוח מערך של מזהי תחומי תפקיד' })
  .max(20, 'אפשר לבחור עד 20 תחומים')
  .transform((ids) => [...new Set(ids)]);

/** ערך בוליאני במחרוזת שאילתה: ?flag=true או ?flag=false */
export const booleanQuery = z
  .enum(['true', 'false'], { error: 'הערך צריך להיות true או false' })
  .transform((value) => value === 'true');

export const paginationQuery = {
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
};

export const searchQuery = z.string().trim().max(100).optional();

/** תאריך בלבד בפורמט YYYY-MM-DD */
export const dateOnlySchema = z.iso
  .date({ error: 'יש להזין תאריך בפורמט YYYY-MM-DD' })
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
  }, 'תאריך לא קיים');

/** תאריך ושעה בפורמט ISO 8601, למשל 2026-10-20T10:00:00+03:00 */
export const dateTimeSchema = z.iso
  .datetime({
    offset: true,
    error: 'יש להזין תאריך ושעה בפורמט ISO, למשל 2026-10-20T10:00:00+03:00',
  })
  .refine((value) => dateOnlySchema.safeParse(value.slice(0, 10)).success, 'תאריך לא קיים');

/** טקסט חובה: מסיר רווחים ובודק אורך */
export const requiredText = (max: number, min = 1) => z.string().trim().min(min).max(max);

/** טקסט רשות: מחרוזת ריקה נשמרת כ־null */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((value) => (value === '' ? null : value));

export const passwordSchema = z
  .string()
  .min(8, 'הסיסמה צריכה להכיל לפחות 8 תווים')
  .max(72, 'הסיסמה ארוכה מדי (עד 72 תווים)')
  .regex(/[A-Za-z֐-׿]/, 'הסיסמה צריכה להכיל לפחות אות אחת')
  .regex(/\d/, 'הסיסמה צריכה להכיל לפחות ספרה אחת');

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('כתובת דוא״ל לא תקינה').max(255));

export const fullNameSchema = requiredText(100, 2);

/** דורש שיישלח לפחות שדה אחד לעדכון */
export const atLeastOneField = <T extends Record<string, unknown>>(value: T) =>
  Object.values(value).some((field) => field !== undefined);
export const atLeastOneFieldMessage = { message: 'יש לשלוח לפחות שדה אחד לעדכון' };
