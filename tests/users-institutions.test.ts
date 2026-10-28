import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/db/prisma';
import { api, bearer, createFixture, createUser, PASSWORD, type Fixture } from './helpers';

let f: Fixture;
beforeEach(async () => {
  f = await createFixture();
});

describe('אישור תלמידים', () => {
  let pending: Awaited<ReturnType<typeof createUser>>;
  beforeEach(async () => {
    pending = await createUser({ email: 'pending@test.com', role: 'STUDENT', institutionId: f.instA.id, approvalStatus: 'PENDING' });
  });

  it('מנהל המוסד רואה את התלמידים שממתינים לאישור', async () => {
    const res = await api().get('/api/users?approvalStatus=PENDING').set(bearer(f.adminA.token));
    expect(res.body.items.map((u: { id: number }) => u.id)).toEqual([pending.id]);
  });

  it('אישור מאפשר לתלמיד להתחבר', async () => {
    const res = await api().patch(`/api/users/${pending.id}/approve`).set(bearer(f.adminA.token));
    expect(res.status).toBe(200);
    expect(res.body.user.approvalStatus).toBe('APPROVED');
    const login = await api().post('/api/auth/login').send({ email: 'pending@test.com', password: PASSWORD });
    expect(login.status).toBe(200);
    const again = await api().patch(`/api/users/${pending.id}/approve`).set(bearer(f.adminA.token));
    expect(again.status).toBe(409);
  });

  it('דחייה חוסמת התחברות, ואפשר לאשר מאוחר יותר', async () => {
    const res = await api().patch(`/api/users/${pending.id}/reject`).set(bearer(f.adminA.token));
    expect(res.body.user.approvalStatus).toBe('REJECTED');
    expect((await api().patch(`/api/users/${pending.id}/reject`).set(bearer(f.adminA.token))).status).toBe(409);
    const approved = await api().patch(`/api/users/${pending.id}/approve`).set(bearer(f.superAdmin.token));
    expect(approved.status).toBe(200);
  });

  it('מנהל ממוסד אחר אינו יכול לאשר', async () => {
    expect((await api().patch(`/api/users/${pending.id}/approve`).set(bearer(f.adminB.token))).status).toBe(404);
  });

  it('תלמיד אינו יכול לאשר', async () => {
    expect((await api().patch(`/api/users/${pending.id}/approve`).set(bearer(f.studentA1.token))).status).toBe(403);
  });
});

describe('ניהול משתמשים', () => {
  it('מנהל מוסד משבית ומפעיל תלמיד', async () => {
    const off = await api().patch(`/api/users/${f.studentA1.id}`).set(bearer(f.adminA.token)).send({ isActive: false });
    expect(off.body.user.isActive).toBe(false);
    expect((await api().get('/api/auth/me').set(bearer(f.studentA1.token))).status).toBe(401);
    await api().patch(`/api/users/${f.studentA1.id}`).set(bearer(f.adminA.token)).send({ isActive: true });
    expect((await api().get('/api/auth/me').set(bearer(f.studentA1.token))).status).toBe(200);
  });

  it('מנהל מוסד אינו יכול להשבית מנהל אחר', async () => {
    const res = await api().patch(`/api/users/${f.adminB.id}`).set(bearer(f.adminA.token)).send({ isActive: false });
    expect(res.status).toBe(404);
  });

  it('אי אפשר להשבית את עצמך', async () => {
    const res = await api().patch(`/api/users/${f.superAdmin.id}`).set(bearer(f.superAdmin.token)).send({ isActive: false });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('CANNOT_DEACTIVATE_SELF');
  });

  it('מנהל ראשי יוצר מנהל מוסד שיכול להתחבר מיד', async () => {
    const res = await api()
      .post('/api/users')
      .set(bearer(f.superAdmin.token))
      .send({ fullName: 'מנהלת חדשה', email: 'NEW.ADMIN@test.com', password: 'Admin12345', institutionId: f.instB.id });
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ role: 'INSTITUTION_ADMIN', approvalStatus: 'APPROVED', email: 'new.admin@test.com' });
    const login = await api().post('/api/auth/login').send({ email: 'new.admin@test.com', password: 'Admin12345' });
    expect(login.status).toBe(200);
    expect(login.body.user.institution.id).toBe(f.instB.id);
  });

  it('אי אפשר ליצור מנהל ראשי נוסף', async () => {
    const res = await api()
      .post('/api/users')
      .set(bearer(f.superAdmin.token))
      .send({ fullName: 'עוד מנהל', email: 'super2@test.com', password: 'Admin12345', role: 'SUPER_ADMIN', institutionId: f.instA.id });
    expect(res.status).toBe(400);
  });

  it('דוא״ל כפול מחזיר 409', async () => {
    const res = await api()
      .post('/api/users')
      .set(bearer(f.superAdmin.token))
      .send({ fullName: 'כפול', email: 'a1@test.com', password: 'Admin12345', institutionId: f.instA.id });
    expect(res.status).toBe(409);
  });

  it('מנהל ראשי מסנן משתמשים לפי תפקיד ומוסד', async () => {
    const res = await api().get(`/api/users?role=INSTITUTION_ADMIN&institutionId=${f.instA.id}`).set(bearer(f.superAdmin.token));
    expect(res.body.items.map((u: { id: number }) => u.id)).toEqual([f.adminA.id]);
  });
});

describe('מוסדות', () => {
  it('רשימה ציבורית ללא Token, עם חיפוש', async () => {
    const res = await api().get(`/api/institutions/public?search=${encodeURIComponent('ב')}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([{ id: f.instB.id, name: 'מוסד ב', city: null }]);
  });

  it('הרשימה הציבורית כוללת עיר, אבל לא את הדוא״ל', async () => {
    await prisma.institution.update({ where: { id: f.instA.id }, data: { city: 'ירושלים', contactEmail: 'office@a.test' } });
    const res = await api().get(`/api/institutions/public?search=${encodeURIComponent('ירושלים')}`);
    expect(res.body.items).toEqual([{ id: f.instA.id, name: 'מוסד א', city: 'ירושלים' }]);
  });

  it('יצירה עם עיר ודוא״ל, ועריכה חלקית', async () => {
    const token = bearer(f.superAdmin.token);
    const created = await api()
      .post('/api/institutions')
      .set(token)
      .send({ name: 'מוסד ג', city: '  חיפה ', contactEmail: 'Office@Gimel.Test' });
    expect(created.status).toBe(201);
    expect(created.body.institution).toMatchObject({ name: 'מוסד ג', city: 'חיפה', contactEmail: 'office@gimel.test' });

    const id = created.body.institution.id;
    const updated = await api().patch(`/api/institutions/${id}`).set(token).send({ city: 'צפת' });
    expect(updated.body.institution).toMatchObject({ name: 'מוסד ג', city: 'צפת', contactEmail: 'office@gimel.test' });

    const cleared = await api().patch(`/api/institutions/${id}`).set(token).send({ contactEmail: '', city: null });
    expect(cleared.body.institution).toMatchObject({ city: null, contactEmail: null });

    const list = await api().get('/api/institutions').set(token);
    expect(list.body.items.find((i: { id: number }) => i.id === id)).toMatchObject({ city: null, studentsCount: 0 });
  });

  it('דוא״ל לא תקין או עיר ארוכה מדי נדחים', async () => {
    const token = bearer(f.superAdmin.token);
    const badEmail = await api().post('/api/institutions').set(token).send({ name: 'מוסד ג', contactEmail: 'not-an-email' });
    expect(badEmail.status).toBe(400);
    expect(badEmail.body.error.details[0].field).toBe('contactEmail');
    const longCity = await api().post('/api/institutions').set(token).send({ name: 'מוסד ג', city: 'א'.repeat(81) });
    expect(longCity.status).toBe(400);
    const empty = await api().patch(`/api/institutions/${f.instA.id}`).set(token).send({});
    expect(empty.status).toBe(400);
  });

  it('מנהל ראשי יוצר ועורך מוסד, ושם כפול נדחה', async () => {
    const created = await api().post('/api/institutions').set(bearer(f.superAdmin.token)).send({ name: 'מוסד ג' });
    expect(created.status).toBe(201);
    const dup = await api().post('/api/institutions').set(bearer(f.superAdmin.token)).send({ name: 'מוסד א' });
    expect(dup.status).toBe(409);
    const renamed = await api().patch(`/api/institutions/${created.body.institution.id}`).set(bearer(f.superAdmin.token)).send({ name: 'מוסד ד' });
    expect(renamed.body.institution.name).toBe('מוסד ד');
    const missing = await api().patch('/api/institutions/9999').set(bearer(f.superAdmin.token)).send({ name: 'xx' });
    expect(missing.status).toBe(404);
  });

  it('שם קצר מדי נדחה', async () => {
    const res = await api().post('/api/institutions').set(bearer(f.superAdmin.token)).send({ name: ' א ' });
    expect(res.status).toBe(400);
    expect(await prisma.institution.count()).toBe(2);
  });
});
