import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/db/prisma';
import { parseDateOnly } from '../src/utils/dates';
import { api, bearer, createApplication, createFixture, dateFromToday, type Fixture } from './helpers';

let f: Fixture;
let app: { id: number };
beforeEach(async () => {
  f = await createFixture();
  app = await createApplication(f.studentA1.id, f.statusSent.id, { companyName: 'חברה' });
});

describe('פעולות', () => {
  it('הוספה, סימון כבוצעה, פתיחה מחדש ומחיקה', async () => {
    const token = bearer(f.studentA1.token);
    const created = await api().post(`/api/applications/${app.id}/actions`).set(token).send({ title: 'מעקב', dueOn: dateFromToday(2), notes: '' });
    expect(created.status).toBe(201);
    expect(created.body.action).toMatchObject({ title: 'מעקב', status: 'OPEN', completedAt: null, notes: null, dueOn: dateFromToday(2) });
    const id = created.body.action.id;

    const done = await api().patch(`/api/actions/${id}`).set(token).send({ status: 'DONE' });
    expect(done.status).toBe(200);
    expect(done.body.action.status).toBe('DONE');
    expect(done.body.action.completedAt).not.toBeNull();

    const reopened = await api().patch(`/api/actions/${id}`).set(token).send({ status: 'OPEN', title: 'מעקב שני' });
    expect(reopened.body.action).toMatchObject({ status: 'OPEN', completedAt: null, title: 'מעקב שני' });

    const list = await api().get(`/api/applications/${app.id}/actions?status=OPEN`).set(token);
    expect(list.body.items).toHaveLength(1);

    expect((await api().delete(`/api/actions/${id}`).set(token)).status).toBe(204);
    expect(await prisma.action.count()).toBe(0);
  });

  it('סימון פעולה כבוצעה אינו משפיע על פעולות אחרות', async () => {
    const token = bearer(f.studentA1.token);
    const a = await api().post(`/api/applications/${app.id}/actions`).set(token).send({ title: 'א', dueOn: dateFromToday(1) });
    await api().post(`/api/applications/${app.id}/actions`).set(token).send({ title: 'ב', dueOn: dateFromToday(2) });
    await api().patch(`/api/actions/${a.body.action.id}`).set(token).send({ status: 'DONE' });
    const list = await api().get(`/api/applications/${app.id}/actions`).set(token);
    expect(list.body.items.map((x: { title: string; status: string }) => [x.title, x.status])).toEqual([
      ['ב', 'OPEN'],
      ['א', 'DONE'],
    ]);
  });

  it('מנהל שמוסיף פעולה יוצר התראה לתלמיד', async () => {
    const res = await api().post(`/api/applications/${app.id}/actions`).set(bearer(f.adminA.token)).send({ title: 'להגיש תרגיל', dueOn: '2026-11-05' });
    expect(res.status).toBe(201);
    const notification = await prisma.notification.findFirstOrThrow({ where: { userId: f.studentA1.id } });
    expect(notification.type).toBe('ACTION_ADDED');
    expect(notification.message).toContain('"להגיש תרגיל"');
    expect(notification.message).toContain('05.11.2026');
  });

  it('ולידציה: כותרת ותאריך חובה, סטטוס חוקי', async () => {
    const token = bearer(f.studentA1.token);
    const missing = await api().post(`/api/applications/${app.id}/actions`).set(token).send({});
    expect(missing.status).toBe(400);
    const badStatus = await api().post(`/api/applications/${app.id}/actions`).set(token).send({ title: 'x', dueOn: dateFromToday(1) });
    const res = await api().patch(`/api/actions/${badStatus.body.action.id}`).set(token).send({ status: 'MAYBE' });
    expect(res.status).toBe(400);
  });
});

describe('מסך הבית — GET /api/dashboard', () => {
  beforeEach(async () => {
    const add = (applicationId: number, title: string, offset: number, status: 'OPEN' | 'DONE' = 'OPEN') =>
      prisma.action.create({
        data: {
          applicationId,
          title,
          dueOn: parseDateOnly(dateFromToday(offset)),
          status,
          completedAt: status === 'DONE' ? new Date() : null,
          createdById: f.studentA1.id,
        },
      });
    await add(app.id, 'באיחור', -2);
    await add(app.id, 'היום', 0);
    await add(app.id, 'מחר', 1);
    await add(app.id, 'בעוד שבוע', 7);
    await add(app.id, 'רחוק', 8);
    await add(app.id, 'בוצעה באיחור', -3, 'DONE');

    // מועמדות פתוחה בלי פעולות — צריך לקבוע צעד הבא
    await createApplication(f.studentA1.id, f.statusSent.id, { companyName: 'ללא פעולות' });
    // מועמדות סגורה בלי פעולות — לא מופיעה
    await createApplication(f.studentA1.id, f.statusRejected.id, { companyName: 'סגורה' });
    // ראיון בעוד יומיים
    await prisma.application.update({ where: { id: app.id }, data: { interviewAt: new Date(Date.now() + 2 * 86400000) } });
    // מועמדות של תלמידה אחרת — לא מופיעה
    const other = await createApplication(f.studentA2.id, f.statusSent.id, { companyName: 'של אחרת' });
    await prisma.action.create({ data: { applicationId: other.id, title: 'של אחרת', dueOn: parseDateOnly(dateFromToday(0)), createdById: f.studentA2.id } });
  });

  it('מחלק את הפעולות לקבוצות לפי מועד', async () => {
    const res = await api().get('/api/dashboard').set(bearer(f.studentA1.token));
    expect(res.status).toBe(200);
    const titles = (key: string) => res.body[key].map((a: { title: string }) => a.title);
    expect(res.body.today).toBe(dateFromToday(0));
    expect(titles('overdue')).toEqual(['באיחור']);
    expect(titles('dueToday')).toEqual(['היום']);
    expect(titles('upcoming')).toEqual(['מחר', 'בעוד שבוע']);
    expect(res.body.overdue[0].application).toMatchObject({ id: app.id, companyName: 'חברה' });
    expect(res.body.upcomingInterviews.map((a: { id: number }) => a.id)).toEqual([app.id]);
    expect(res.body.needsNextStep.map((a: { companyName: string }) => a.companyName)).toEqual(['ללא פעולות']);
    expect(res.body.unreadNotifications).toBe(0);
  });

  it('מנהל המוסד רואה את כל המוסד, ויכול לסנן לפי תלמיד', async () => {
    const all = await api().get('/api/dashboard').set(bearer(f.adminA.token));
    expect(all.body.dueToday.map((a: { title: string }) => a.title).sort()).toEqual(['היום', 'של אחרת'].sort());
    const one = await api().get(`/api/dashboard?userId=${f.studentA2.id}`).set(bearer(f.adminA.token));
    expect(one.body.dueToday.map((a: { title: string }) => a.title)).toEqual(['של אחרת']);
  });

  it('תלמיד אינו יכול לבקש מסך בית של תלמיד אחר', async () => {
    const res = await api().get(`/api/dashboard?userId=${f.studentA2.id}`).set(bearer(f.studentA1.token));
    expect(res.status).toBe(403);
  });
});
