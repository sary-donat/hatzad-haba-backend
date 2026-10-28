import bcrypt from 'bcryptjs';
import { env } from '../config/env';

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, env.BCRYPT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Hash קבוע להשוואה כשהמשתמש לא קיים, כדי שזמן התגובה לא יחשוף אילו כתובות דוא״ל רשומות
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', 4);

export async function verifyAgainstDummy(password: string): Promise<false> {
  await bcrypt.compare(password, DUMMY_HASH);
  return false;
}
