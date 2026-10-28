import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/db/prisma';
import { api, bearer, createFixture, PASSWORD, type Fixture } from './helpers';

let f: Fixture;
beforeEach(async () => {
  f = await createFixture();
});

describe('התחברות — POST /api/auth/login', () => {
  it('התחברות תקינה מחזירה Token ופרטי משתמש ללא סיסמה', async () => {
    const res = await api().post('/api/auth/login').send({ email: 'A1@Test.com', password: PASSWORD });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user).toMatchObject({ email: 'a1@test.com', role: 'STUDENT', institution: { id: f.instA.id } });
    expect(JSON.stringify(res.body)).not.toMatch(/password/i);

    const decoded = jwt.decode(res.body.token) as jwt.JwtPayload;
    expect(decoded.sub).toBe(String(f.studentA1.id));
    expect(decoded.exp! - decoded.iat!).toBe(3600);
  });

  it('סיסמה שגויה מחזירה 401', async () => {
    const res = await api().post('/api/auth/login').send({ email: 'a1@test.com', password: 'wrong-pass1' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('דוא״ל שאינו קיים מחזיר 401 עם אותה הודעה', async () => {
    const res = await api().post('/api/auth/login').send({ email: 'nobody@test.com', password: PASSWORD });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('שדות חסרים מחזירים 400', async () => {
    const res = await api().post('/api/auth/login').send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.map((d: { field: string }) => d.field)).toEqual(expect.arrayContaining(['email', 'password']));
  });

  it('תלמיד שממתין לאישור מקבל 403 ACCOUNT_PENDING', async () => {
    await prisma.user.update({ where: { id: f.studentA1.id }, data: { approvalStatus: 'PENDING' } });
    const res = await api().post('/api/auth/login').send({ email: 'a1@test.com', password: PASSWORD });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACCOUNT_PENDING');
  });

  it('תלמיד שנדחה מקבל 403 ACCOUNT_REJECTED', async () => {
    await prisma.user.update({ where: { id: f.studentA1.id }, data: { approvalStatus: 'REJECTED' } });
    const res = await api().post('/api/auth/login').send({ email: 'a1@test.com', password: PASSWORD });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACCOUNT_REJECTED');
  });

  it('משתמש מושבת אינו יכול להתחבר', async () => {
    await prisma.user.update({ where: { id: f.studentA1.id }, data: { isActive: false } });
    const res = await api().post('/api/auth/login').send({ email: 'a1@test.com', password: PASSWORD });
    expect(res.status).toBe(401);
  });
});

describe('Token — GET /api/auth/me', () => {
  it('עם Token תקין מחזיר את המשתמש לפי ה־Token', async () => {
    const res = await api().get('/api/auth/me').set(bearer(f.adminA.token));
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ id: f.adminA.id, role: 'INSTITUTION_ADMIN' });
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('ללא Token מחזיר 401', async () => {
    const res = await api().get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('כותרת שאינה Bearer מחזירה 401', async () => {
    const res = await api().get('/api/auth/me').set('Authorization', `Basic ${f.adminA.token}`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('Token לא תקין מחזיר 401', async () => {
    const res = await api().get('/api/auth/me').set(bearer('not.a.token'));
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('Token שנחתם במפתח אחר מחזיר 401', async () => {
    const forged = jwt.sign({ role: 'SUPER_ADMIN' }, 'another-secret-another-secret-another-secret', { subject: String(f.superAdmin.id) });
    const res = await api().get('/api/auth/me').set(bearer(forged));
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('Token ללא חתימה (alg none) נדחה', async () => {
    const unsigned = jwt.sign({ role: 'SUPER_ADMIN' }, '', { algorithm: 'none', subject: String(f.superAdmin.id) });
    const res = await api().get('/api/auth/me').set(bearer(unsigned));
    expect(res.status).toBe(401);
  });

  it('Token שפג תוקפו מחזיר 401 TOKEN_EXPIRED', async () => {
    const expired = jwt.sign({ role: 'STUDENT' }, process.env.JWT_SECRET as string, {
      subject: String(f.studentA1.id),
      expiresIn: -10,
    });
    const res = await api().get('/api/auth/me').set(bearer(expired));
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_EXPIRED');
  });

  it('Token של משתמש שהושבת מפסיק לעבוד מיד', async () => {
    await prisma.user.update({ where: { id: f.studentA1.id }, data: { isActive: false } });
    const res = await api().get('/api/auth/me').set(bearer(f.studentA1.token));
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('ACCOUNT_INACTIVE');
  });

  it('התפקיד נקבע לפי מסד הנתונים ולא לפי מה שכתוב ב־Token', async () => {
    const tampered = jwt.sign({ role: 'SUPER_ADMIN' }, process.env.JWT_SECRET as string, { subject: String(f.studentA1.id) });
    const res = await api().get('/api/institutions').set(bearer(tampered));
    expect(res.status).toBe(403);
  });
});

describe('הרשמה — POST /api/auth/register', () => {
  const body = () => ({ fullName: 'תלמידה חדשה', email: 'new@test.com', password: 'Newpass123', institutionId: f.instA.id });

  it('יוצרת תלמיד ממתין לאישור, ללא Token', async () => {
    const res = await api().post('/api/auth/register').send(body());
    expect(res.status).toBe(201);
    expect(res.body.token).toBeUndefined();
    expect(res.body.user).toMatchObject({ role: 'STUDENT', approvalStatus: 'PENDING', institution: { id: f.instA.id } });

    const login = await api().post('/api/auth/login').send({ email: 'new@test.com', password: 'Newpass123' });
    expect(login.status).toBe(403);
    expect(login.body.error.code).toBe('ACCOUNT_PENDING');
  });

  it('אי אפשר להירשם כמנהל — שדה role מהלקוח מתעלם', async () => {
    const res = await api().post('/api/auth/register').send({ ...body(), role: 'SUPER_ADMIN', approvalStatus: 'APPROVED' });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('STUDENT');
    expect(res.body.user.approvalStatus).toBe('PENDING');
  });

  it('הסיסמה נשמרת כ־Hash', async () => {
    await api().post('/api/auth/register').send(body());
    const user = await prisma.user.findUniqueOrThrow({ where: { email: 'new@test.com' } });
    expect(user.passwordHash).not.toBe('Newpass123');
    expect(user.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it('דוא״ל קיים מחזיר 409', async () => {
    const res = await api().post('/api/auth/register').send({ ...body(), email: 'a1@test.com' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('מוסד שאינו קיים מחזיר 404', async () => {
    const res = await api().post('/api/auth/register').send({ ...body(), institutionId: 9999 });
    expect(res.status).toBe(404);
  });

  it('סיסמה חלשה מחזירה 400', async () => {
    const res = await api().post('/api/auth/register').send({ ...body(), password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].field).toBe('password');
  });
});
