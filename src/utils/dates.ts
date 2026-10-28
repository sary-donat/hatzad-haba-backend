import { env } from '../config/env';

/**
 * עמודות מסוג DATE (תאריך ללא שעה) נשמרות ב־Prisma כ־Date בחצות לפי UTC.
 * כאן נמצאות פונקציות להמרה בין "YYYY-MM-DD" לבין Date, ולחישוב "היום" לפי שעון ישראל.
 */

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function parseDateOnly(value: string): Date {
  if (!DATE_ONLY.test(value)) {
    throw new Error(`Invalid date: ${value}`);
  }
  return new Date(`${value}T00:00:00.000Z`);
}

export function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function formatDateOnlyOrNull(date: Date | null): string | null {
  return date ? formatDateOnly(date) : null;
}

/** התאריך של היום לפי אזור הזמן של המערכת, בפורמט YYYY-MM-DD */
export function todayString(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: env.APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function todayDate(now: Date = new Date()): Date {
  return parseDateOnly(todayString(now));
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/** תאריך בפורמט ישראלי לתצוגה בהודעות: 20.10.2026 */
export function formatIsraeliDate(date: Date): string {
  const [year, month, day] = formatDateOnly(date).split('-');
  return `${day}.${month}.${year}`;
}
