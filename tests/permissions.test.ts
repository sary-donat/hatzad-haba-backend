import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/db/prisma';
import { api, bearer, createApplication, createFixture, type Fixture } from './helpers';

let f: Fixture;
let appA1: { id: number };
let appA2: { id: number };
let appB1: { id: number };

beforeEach(async () => {
  f = await createFixture();
  appA1 = await createApplication(f.studentA1.id, f.statusSent.id, { companyName: 'חברת א1' });
  appA2 = await createApplication(f.studentA2.id, f.statusSent.id, { companyName: 'חברת א2' });
  appB1 = await createApplication(f.studentB1.id, f.statusSent.id, { companyName: 'חברת ב1' });
});

describe('הרשאות לפי תפקיד (403)', () => {
  it.each([
    ['get', '/api/institutions'],
    ['post', '/api/institutions'],
    ['get', '/api/users'],
    ['post', '/api/users'],
    ['post', '/api/job-roles'],
    ['post', '/api/statuses'],
  ] as const)('תלמיד אינו רשאי: %s %s', async (method, url) => {
    const res = await api()[method](url).set(bearer(f.studentA1.token)).send({});
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it.each([
    ['get', '/api/institutions'],
    ['post', '/api/institutions'],
    ['post', '/api/users'],
  ] as const)('מנהל מוסד אינו רשאי: %s %s', async (method, url) => {
    const res = await api()[method](url).set(bearer(f.adminA.token)).send({});
    expect(res.status).toBe(403);
  });

  it('מנהל ראשי רשאי לצפות במוסדות', async () => {
    const res = await api().get('/api/institutions').set(bearer(f.superAdmin.token));
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(2);
    expect(res.body.items[0]).toMatchObject({ studentsCount: expect.any(Number), adminsCount: 1 });
  });

  it('ללא Token כל נתיב פרטי מחזיר 401', async () => {
    for (const url of ['/api/applications', '/api/dashboard', '/api/notifications', '/api/statuses', `/api/applications/${appA1.id}`]) {
      const res = await api().get(url);
      expect(res.status, url).toBe(401);
    }
  });
});

describe('בידוד מידע בין משתמשים ומוסדות', () => {
  it('תלמיד רואה ברשימה רק את המועמדויות שלו', async () => {
    const res = await api().get('/api/applications').set(bearer(f.studentA1.token));
    expect(res.status).toBe(200);
    expect(res.body.items.map((a: { id: number }) => a.id)).toEqual([appA1.id]);
  });

  it('תלמיד אינו יכול לצפות, לערוך או למחוק מועמדות של תלמיד אחר (404)', async () => {
    const token = bearer(f.studentA1.token);
    expect((await api().get(`/api/applications/${appA2.id}`).set(token)).status).toBe(404);
    expect((await api().patch(`/api/applications/${appA2.id}`).set(token).send({ notes: 'x' })).status).toBe(404);
    expect((await api().delete(`/api/applications/${appA2.id}`).set(token)).status).toBe(404);
    expect((await api().get(`/api/applications/${appA2.id}/actions`).set(token)).status).toBe(404);
    expect((await api().post(`/api/applications/${appA2.id}/actions`).set(token).send({ title: 'x', dueOn: '2026-01-01' })).status).toBe(404);
    expect(await prisma.application.count({ where: { id: appA2.id } })).toBe(1);
  });

  it('תלמיד אינו יכול לגשת לפעולה של מועמדות אחרת', async () => {
    const action = await prisma.action.create({
      data: { applicationId: appA2.id, title: 'פעולה', dueOn: new Date('2026-01-01'), createdById: f.studentA2.id },
    });
    const token = bearer(f.studentA1.token);
    expect((await api().patch(`/api/actions/${action.id}`).set(token).send({ status: 'DONE' })).status).toBe(404);
    expect((await api().delete(`/api/actions/${action.id}`).set(token)).status).toBe(404);
  });

  it('תלמיד אינו יכול ליצור מועמדות בשם תלמיד אחר', async () => {
    const res = await api()
      .post('/api/applications')
      .set(bearer(f.studentA1.token))
      .send({ userId: f.studentA2.id, companyName: 'x', jobTitle: 'y', submittedOn: '2026-01-01', statusId: f.statusSent.id });
    expect(res.status).toBe(403);
  });

  it('תלמיד אינו יכול לסנן לפי תלמיד אחר', async () => {
    const res = await api().get(`/api/applications?userId=${f.studentA2.id}`).set(bearer(f.studentA1.token));
    expect(res.status).toBe(403);
  });

  it('מנהל מוסד רואה רק את המועמדויות של המוסד שלו', async () => {
    const res = await api().get('/api/applications').set(bearer(f.adminA.token));
    const ids = res.body.items.map((a: { id: number }) => a.id).sort();
    expect(ids).toEqual([appA1.id, appA2.id].sort());
  });

  it('מנהל מוסד אינו יכול לגשת למועמדות במוסד אחר (404)', async () => {
    const token = bearer(f.adminA.token);
    expect((await api().get(`/api/applications/${appB1.id}`).set(token)).status).toBe(404);
    expect((await api().patch(`/api/applications/${appB1.id}`).set(token).send({ notes: 'x' })).status).toBe(404);
    expect((await api().get(`/api/applications?institutionId=${f.instB.id}`).set(token)).status).toBe(403);
  });

  it('מנהל מוסד אינו יכול ליצור מועמדות לתלמיד ממוסד אחר', async () => {
    const res = await api()
      .post('/api/applications')
      .set(bearer(f.adminA.token))
      .send({ userId: f.studentB1.id, companyName: 'x', jobTitle: 'y', submittedOn: '2026-01-01', statusId: f.statusSent.id });
    expect(res.status).toBe(404);
  });

  it('מנהל מוסד אינו יכול לנהל תלמיד ממוסד אחר', async () => {
    const token = bearer(f.adminA.token);
    expect((await api().get(`/api/users/${f.studentB1.id}`).set(token)).status).toBe(404);
    expect((await api().patch(`/api/users/${f.studentB1.id}`).set(token).send({ isActive: false })).status).toBe(404);
    expect((await api().patch(`/api/users/${f.adminB.id}/approve`).set(token)).status).toBe(404);
    expect((await api().get(`/api/dashboard?userId=${f.studentB1.id}`).set(token)).status).toBe(404);
  });

  it('מנהל מוסד רואה ברשימת המשתמשים רק תלמידים מהמוסד שלו', async () => {
    const res = await api().get('/api/users').set(bearer(f.adminA.token));
    expect(res.status).toBe(200);
    expect(res.body.items.every((u: { role: string; institution: { id: number } }) => u.role === 'STUDENT' && u.institution.id === f.instA.id)).toBe(true);
    expect(res.body.total).toBe(2);
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash/);
  });

  it('מנהל ראשי רואה את כל המועמדויות ויכול לסנן לפי מוסד', async () => {
    const all = await api().get('/api/applications').set(bearer(f.superAdmin.token));
    expect(all.body.total).toBe(3);
    const onlyB = await api().get(`/api/applications?institutionId=${f.instB.id}`).set(bearer(f.superAdmin.token));
    expect(onlyB.body.items.map((a: { id: number }) => a.id)).toEqual([appB1.id]);
  });

  it('מנהל מוסד אינו רואה את תחומי התפקיד והסטטוסים של מוסד אחר', async () => {
    const roles = await api().get(`/api/job-roles?institutionId=${f.instB.id}`).set(bearer(f.adminA.token));
    expect(roles.status).toBe(403);
    const statuses = await api().get('/api/statuses').set(bearer(f.adminA.token));
    expect(statuses.body.items.some((s: { id: number }) => s.id === f.customStatusB.id)).toBe(false);
    const edit = await api().patch(`/api/statuses/${f.customStatusB.id}`).set(bearer(f.adminA.token)).send({ name: 'שינוי' });
    expect(edit.status).toBe(404);
    const editRole = await api().patch(`/api/job-roles/${f.roleB.id}`).set(bearer(f.adminA.token)).send({ name: 'שינוי' });
    expect(editRole.status).toBe(404);
  });
});
