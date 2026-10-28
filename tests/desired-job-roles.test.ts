import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/db/prisma';
import { api, bearer, createFixture, type Fixture } from './helpers';

let f: Fixture;
let roleA2: { id: number };
beforeEach(async () => {
  f = await createFixture();
  roleA2 = await prisma.jobRole.create({ data: { institutionId: f.instA.id, name: 'בדיקות תוכנה' } });
});

const registerBody = (f: Fixture, jobRoleIds?: number[]) => ({
  fullName: 'תלמידה חדשה',
  email: 'new@test.com',
  password: 'Newpass123',
  institutionId: f.instA.id,
  ...(jobRoleIds ? { jobRoleIds } : {}),
});

describe('תחומי התפקיד של מוסד — רשימה ציבורית', () => {
  it('מחזירה רק תחומים פעילים, בלי Token', async () => {
    const res = await api().get(`/api/institutions/${f.instA.id}/job-roles`);
    expect(res.status).toBe(200);
    expect(res.body.items.map((r: { name: string }) => r.name)).toEqual(['בדיקות תוכנה', 'תכנות']);
  });

  it('מוסד שאינו קיים מחזיר 404', async () => {
    expect((await api().get('/api/institutions/9999/job-roles')).status).toBe(404);
  });
});

describe('בחירת תחומים בהרשמה', () => {
  it('נשמרים התחומים שנבחרו, וכפילויות מוסרות', async () => {
    const res = await api().post('/api/auth/register').send(registerBody(f, [f.roleA.id, roleA2.id, f.roleA.id]));
    expect(res.status).toBe(201);
    expect(res.body.user.desiredJobRoles.map((r: { id: number }) => r.id).sort()).toEqual([f.roleA.id, roleA2.id].sort());
  });

  it('אפשר להירשם בלי תחומים', async () => {
    const res = await api().post('/api/auth/register').send(registerBody(f));
    expect(res.status).toBe(201);
    expect(res.body.user.desiredJobRoles).toEqual([]);
  });

  it('תחום של מוסד אחר או תחום לא פעיל נדחה, והמשתמש לא נוצר', async () => {
    for (const id of [f.roleB.id, f.inactiveRoleA.id, 9999]) {
      const res = await api().post('/api/auth/register').send(registerBody(f, [f.roleA.id, id]));
      expect(res.status).toBe(400);
      expect(res.body.error.details[0].field).toBe('jobRoleIds');
    }
    expect(await prisma.user.count({ where: { email: 'new@test.com' } })).toBe(0);
  });

  it('ערך שאינו מערך נדחה', async () => {
    const res = await api().post('/api/auth/register').send({ ...registerBody(f), jobRoleIds: 'תכנות' });
    expect(res.status).toBe(400);
  });
});

describe('עדכון התחומים שלי — PUT /api/auth/me/job-roles', () => {
  it('התלמיד מחליף את רשימת התחומים', async () => {
    const token = bearer(f.studentA1.token);
    const first = await api().put('/api/auth/me/job-roles').set(token).send({ jobRoleIds: [f.roleA.id] });
    expect(first.status).toBe(200);
    expect(first.body.user.desiredJobRoles).toEqual([{ id: f.roleA.id, name: 'תכנות', isActive: true }]);

    const second = await api().put('/api/auth/me/job-roles').set(token).send({ jobRoleIds: [roleA2.id] });
    expect(second.body.user.desiredJobRoles.map((r: { id: number }) => r.id)).toEqual([roleA2.id]);

    const cleared = await api().put('/api/auth/me/job-roles').set(token).send({ jobRoleIds: [] });
    expect(cleared.body.user.desiredJobRoles).toEqual([]);

    const me = await api().get('/api/auth/me').set(token);
    expect(me.body.user.desiredJobRoles).toEqual([]);
  });

  it('אי אפשר לבחור תחום של מוסד אחר', async () => {
    const res = await api().put('/api/auth/me/job-roles').set(bearer(f.studentA1.token)).send({ jobRoleIds: [f.roleB.id] });
    expect(res.status).toBe(400);
  });

  it('מנהלים אינם רשאים, ובלי Token מתקבל 401', async () => {
    expect((await api().put('/api/auth/me/job-roles').set(bearer(f.adminA.token)).send({ jobRoleIds: [] })).status).toBe(403);
    expect((await api().put('/api/auth/me/job-roles').send({ jobRoleIds: [] })).status).toBe(401);
  });

  it('שדה חסר מחזיר 400', async () => {
    const res = await api().put('/api/auth/me/job-roles').set(bearer(f.studentA1.token)).send({});
    expect(res.status).toBe(400);
  });
});

describe('המנהל מוצא תלמידים לפי תחום — GET /api/users?jobRoleId=', () => {
  beforeEach(async () => {
    await prisma.studentJobRole.createMany({
      data: [
        { userId: f.studentA1.id, jobRoleId: f.roleA.id },
        { userId: f.studentA2.id, jobRoleId: roleA2.id },
        { userId: f.studentB1.id, jobRoleId: f.roleB.id },
      ],
    });
  });

  it('מחזיר רק את התלמידים שמחפשים בתחום', async () => {
    const res = await api().get(`/api/users?jobRoleId=${f.roleA.id}`).set(bearer(f.adminA.token));
    expect(res.status).toBe(200);
    expect(res.body.items.map((u: { id: number }) => u.id)).toEqual([f.studentA1.id]);
    expect(res.body.items[0].desiredJobRoles).toEqual([{ id: f.roleA.id, name: 'תכנות', isActive: true }]);
  });

  it('מנהל מוסד לא רואה תלמידים ממוסד אחר גם אם ישלח תחום של אותו מוסד', async () => {
    const res = await api().get(`/api/users?jobRoleId=${f.roleB.id}`).set(bearer(f.adminA.token));
    expect(res.body.items).toEqual([]);
  });

  it('תחום שהפך ללא פעיל עדיין מוצג אצל התלמיד, עם isActive: false', async () => {
    await prisma.jobRole.update({ where: { id: f.roleA.id }, data: { isActive: false } });
    const res = await api().get(`/api/users/${f.studentA1.id}`).set(bearer(f.adminA.token));
    expect(res.body.user.desiredJobRoles).toEqual([{ id: f.roleA.id, name: 'תכנות', isActive: false }]);
  });
});
