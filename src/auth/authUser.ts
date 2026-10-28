import type { Request } from 'express';
import type { Role } from '@prisma/client';
import { unauthorized } from '../utils/httpError';

export interface AuthUser {
  id: number;
  role: Role;
  institutionId: number | null;
  fullName: string;
  email: string;
}

/** מחזיר את המשתמש המחובר. ניתן לקרוא רק בנתיבים שעוברים דרך authenticate */
export function currentUser(req: Request): AuthUser {
  if (!req.user) {
    throw unauthorized();
  }
  return req.user;
}
