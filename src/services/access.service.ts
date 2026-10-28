import type { Prisma } from '@prisma/client';
import type { AuthUser } from '../auth/authUser';
import { prisma } from '../db/prisma';
import { badRequest, forbidden, notFound } from '../utils/httpError';

/**
 * כללי ההרשאות המרכזיים: מי רשאי לראות אילו נתונים.
 * כל שליפה של מועמדויות ותלמידים עוברת דרך הפונקציות האלה.
 */

/** תנאי Prisma שמגביל את המועמדויות לפי המשתמש המחובר */
export function applicationScope(actor: AuthUser): Prisma.ApplicationWhereInput {
  switch (actor.role) {
    case 'STUDENT':
      return { userId: actor.id };
    case 'INSTITUTION_ADMIN':
      return { user: { institutionId: actor.institutionId ?? -1 } };
    case 'SUPER_ADMIN':
      return {};
  }
}

/** תנאי Prisma שמגביל את המשתמשים שמנהל רשאי לנהל */
export function managedUsersScope(actor: AuthUser): Prisma.UserWhereInput {
  switch (actor.role) {
    case 'SUPER_ADMIN':
      return {};
    case 'INSTITUTION_ADMIN':
      return { role: 'STUDENT', institutionId: actor.institutionId ?? -1 };
    case 'STUDENT':
      return { id: -1 };
  }
}

export const isAdmin = (actor: AuthUser) => actor.role === 'SUPER_ADMIN' || actor.role === 'INSTITUTION_ADMIN';

/** מוצא מועמדות שהמשתמש רשאי לגשת אליה. אחרת — 404, כדי לא לחשוף שהיא קיימת */
export async function findAccessibleApplication(actor: AuthUser, id: number) {
  const application = await prisma.application.findFirst({
    where: { AND: [{ id }, applicationScope(actor)] },
    include: { user: true, status: true },
  });
  if (!application) {
    throw notFound('המועמדות לא נמצאה');
  }
  return application;
}

/**
 * קובע לאיזה מוסד שייכת פעולת ניהול (תחום תפקיד, סטטוס).
 * מנהל מוסד — תמיד המוסד שלו. מנהל ראשי — חייב לציין institutionId.
 */
export async function resolveManagedInstitutionId(actor: AuthUser, requested?: number): Promise<number> {
  if (actor.role === 'INSTITUTION_ADMIN') {
    if (requested !== undefined && requested !== actor.institutionId) {
      throw forbidden('אפשר לנהל רק את המוסד שלך');
    }
    return actor.institutionId as number;
  }
  if (actor.role === 'SUPER_ADMIN') {
    if (requested === undefined) {
      throw badRequest('יש לציין institutionId', 'VALIDATION_ERROR', [
        { field: 'institutionId', message: 'שדה חובה עבור מנהל ראשי' },
      ]);
    }
    const institution = await prisma.institution.findUnique({ where: { id: requested } });
    if (!institution) {
      throw notFound('המוסד לא נמצא');
    }
    return requested;
  }
  throw forbidden();
}

/** קובע את המוסד שאת הקטלוג שלו (תפקידים/סטטוסים) המשתמש רואה */
export function resolveViewInstitutionId(actor: AuthUser, requested?: number): number | null {
  if (actor.role === 'SUPER_ADMIN') {
    return requested ?? null;
  }
  if (requested !== undefined && requested !== actor.institutionId) {
    throw forbidden('אפשר לצפות רק בנתוני המוסד שלך');
  }
  return actor.institutionId;
}
