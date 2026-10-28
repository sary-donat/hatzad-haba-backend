import type { AuthUser } from '../auth/authUser';

declare global {
  namespace Express {
    interface Request {
      /** המשתמש המחובר — נקבע רק לפי ה־Token, במידלוור authenticate */
      user?: AuthUser;
    }
  }
}

export {};
