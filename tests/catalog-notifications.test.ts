import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/db/prisma';
import { api, bearer, createApplication, createFixture, type Fixture } from './helpers';

let f: Fixture;
beforeEach(async () => {
  f = await createFixture();
});

describe('סטטוסים', () => {
  it('תלמיד רואה את 8 הסטטוסים הבסיסיים ואת הסטטוסים של המוסד שלו, לפי הסדר', async () => {
    const res = await api().get('/api/statuses').set(bearer(f.studentB1.token));
    expect(res.status).toBe(200);
    const names = res.body.items.map((s: { name: string }) => s.name);
    expect(names).toHaveLength(9);
    expect(names.indexOf('ראיון שני')).toBe(names.indexOf('נקבע ראיון') + 1);
    expect(res.body.items[0]).toMatchObject({ name: 'נשלחו קורות חיים', isBase: true, isFinal: false });
  });

  it('מנהל מוסד יוצר סטטוס, עורך אותו והופך ללא פעיל', async () => {
    const token = bearer(f.adminA.token);
    const created = await api().post('/api/statuses').set(token).send({ name: 'מבחן מקצועי', suggestedAction: 'להתכונן למבחן', sortOrder: 45 });
    expect(created.status).toBe(201);
    expect(created.body.status).toMatchObject({ institutionId: f.instA.id, isBase: false, suggestedDays: 3, isActive: true });

    const id = created.body.status.id;
    const updated = await api().patch(`/api/statuses/${id}`).set(token).send({ suggestedAction: null, isFinal: true });
    expect(updated.body.status).toMatchObject({ suggestedAction: null, suggestedDays: null, isFinal: true });

    await api().patch(`/api/statuses/${id}`).set(token).send({ isActive: false });
    const studentView = await api().get('/api/statuses').set(bearer(f.studentA1.token));
    expect(studentView.body.items.some((s: { id: number }) => s.id === id)).toBe(false);
    const adminView = await api().get('/api/statuses?includeInactive=true').set(token);
    expect(adminView.body.items.some((s: { id: number }) => s.id === id)).toBe(true);

    // סטטוס לא פעיל אי אפשר לבחור
    const app = await api()
      .post('/api/applications')
      .set(bearer(f.studentA1.token))
      .send({ companyName: 'x', jobTitle: 'y', submittedOn: '2026-01-01', statusId: id });
    expect(app.status).toBe(400);
  });

  it('אי אפשר לשנות סטטוס בסיסי', async () => {
    const res = await api().patch(`/api/statuses/${f.statusSent.id}`).set(bearer(f.superAdmin.token)).send({ name: 'אחר' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('BASE_STATUS_READONLY');
  });

  it('שם סטטוס שקיים כבר (גם בסיסי) נדחה', async () => {
    const res = await api().post('/api/statuses').set(bearer(f.adminA.token)).send({ name: 'נדחתה' });
    expect(res.status).toBe(409);
  });

  it('מנהל ראשי חייב לציין מוסד ביצירת סטטוס', async () => {
    const res = await api().post('/api/statuses').set(bearer(f.superAdmin.token)).send({ name: 'חדש' });
    expect(res.status).toBe(400);
    const ok = await api().post('/api/statuses').set(bearer(f.superAdmin.token)).send({ name: 'חדש', institutionId: f.instA.id });
    expect(ok.status).toBe(201);
  });

  it('מנהל מוסד אינו יכול ליצור סטטוס למוסד אחר', async () => {
    const res = await api().post('/api/statuses').set(bearer(f.adminA.token)).send({ name: 'חדש', institutionId: f.instB.id });
    expect(res.status).toBe(403);
  });
});

describe('תחומי תפקיד', () => {
  it('תלמיד רואה רק תחומים פעילים של המוסד שלו', async () => {
    const res = await api().get('/api/job-roles').set(bearer(f.studentA1.token));
    expect(res.body.items.map((r: { name: string }) => r.name)).toEqual(['תכנות']);
    const withInactive = await api().get('/api/job-roles?includeInactive=true').set(bearer(f.studentA1.token));
    expect(withInactive.body.items).toHaveLength(1);
  });

  it('מנהל מוסד יוצר ועורך, ושם כפול נדחה', async () => {
    const token = bearer(f.adminA.token);
    const created = await api().post('/api/job-roles').set(token).send({ name: 'גרפיקה' });
    expect(created.status).toBe(201);
    expect((await api().post('/api/job-roles').set(token).send({ name: 'תכנות' })).status).toBe(409);
    const updated = await api().patch(`/api/job-roles/${created.body.jobRole.id}`).set(token).send({ isActive: false });
    expect(updated.body.jobRole.isActive).toBe(false);
  });

  it('הפיכת תחום ללא פעיל שומרת אותו במועמדויות קיימות', async () => {
    const app = await createApplication(f.studentA1.id, f.statusSent.id, { jobRoleId: f.roleA.id });
    await api().patch(`/api/job-roles/${f.roleA.id}`).set(bearer(f.adminA.token)).send({ isActive: false });
    const res = await api().get(`/api/applications/${app.id}`).set(bearer(f.studentA1.token));
    expect(res.body.application.jobRole).toEqual({ id: f.roleA.id, name: 'תכנות' });
  });

  it('מנהל ראשי חייב לציין institutionId ברשימה', async () => {
    expect((await api().get('/api/job-roles').set(bearer(f.superAdmin.token))).status).toBe(400);
    const res = await api().get(`/api/job-roles?institutionId=${f.instB.id}`).set(bearer(f.superAdmin.token));
    expect(res.body.items.map((r: { name: string }) => r.name)).toEqual(['הוראה']);
  });
});

describe('התראות', () => {
  beforeEach(async () => {
    const app = await createApplication(f.studentA1.id, f.statusSent.id);
    await api().patch(`/api/applications/${app.id}`).set(bearer(f.adminA.token)).send({ statusId: f.statusInterview.id });
    await api().post(`/api/applications/${app.id}/actions`).set(bearer(f.adminA.token)).send({ title: 'פעולה', dueOn: '2026-11-01' });
  });

  it('ספירה, סימון אחת כנקראה, וסימון הכול', async () => {
    const token = bearer(f.studentA1.token);
    expect((await api().get('/api/notifications/unread-count').set(token)).body).toEqual({ count: 2 });

    const list = await api().get('/api/notifications?unreadOnly=true').set(token);
    expect(list.body.items.map((n: { type: string }) => n.type)).toEqual(['ACTION_ADDED', 'STATUS_CHANGED']);

    const read = await api().patch(`/api/notifications/${list.body.items[0].id}/read`).set(token);
    expect(read.body.notification.isRead).toBe(true);
    expect((await api().get('/api/notifications/unread-count').set(token)).body.count).toBe(1);

    const all = await api().patch('/api/notifications/read-all').set(token);
    expect(all.body.updated).toBe(1);
    expect((await api().get('/api/dashboard').set(token)).body.unreadNotifications).toBe(0);
  });

  it('אי אפשר לסמן התראה של משתמש אחר', async () => {
    const notification = await prisma.notification.findFirstOrThrow();
    const res = await api().patch(`/api/notifications/${notification.id}/read`).set(bearer(f.studentA2.token));
    expect(res.status).toBe(404);
    const others = await api().get('/api/notifications').set(bearer(f.studentA2.token));
    expect(others.body.total).toBe(0);
  });
});
