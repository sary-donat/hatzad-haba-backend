import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../auth/jwt';
import { prisma } from '../db/prisma';
import { unauthorized } from '../utils/httpError';

/**
 * בודק את ה־Bearer Token ומצרף לבקשה את המשתמש המחובר.
 * המשתמש נטען מחדש ממסד הנתונים בכל בקשה, כך שמשתמש שהושבת מאבד גישה מיד.
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header) {
    throw unauthorized('נדרשת התחברות. יש לשלוח Authorization: Bearer <token>', 'UNAUTHORIZED');
  }

  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw unauthorized('כותרת Authorization אינה בפורמט Bearer <token>', 'INVALID_TOKEN');
  }

  const result = verifyAccessToken(token);
  if (!result.ok) {
    throw result.reason === 'expired'
      ? unauthorized('תוקף ההתחברות פג. יש להתחבר מחדש', 'TOKEN_EXPIRED')
      : unauthorized('ה־Token אינו תקין', 'INVALID_TOKEN');
  }

  const user = await prisma.user.findUnique({ where: { id: result.userId } });
  if (!user || !user.isActive || user.approvalStatus !== 'APPROVED') {
    throw unauthorized('החשבון אינו פעיל. יש להתחבר מחדש', 'ACCOUNT_INACTIVE');
  }

  req.user = {
    id: user.id,
    role: user.role,
    institutionId: user.institutionId,
    fullName: user.fullName,
    email: user.email,
  };
  next();
}
