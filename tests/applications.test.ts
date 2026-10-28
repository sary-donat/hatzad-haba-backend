import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/db/prisma';
import { api, bearer, createApplication, createFixture, dateFromToday, type Fixture } from './helpers';

let f: Fixture;
beforeEach(async () => {
  f = await createFixture();
});

const validBody = (f: Fixture) => ({
  companyName: '  חברת אלפא  ',
  jobTitle: 'מפתחת React',
  submittedOn: dateFromToday(-1),
  statusId: f.statusSent.id,
  jobRoleId: f.roleA.id,
  interestLevel: 'HIGH',
  jobUrl: 'https://example.com/job/1',
  contactName: 'משה',
  jobAttractions: 'צוות טוב',
  pointsToClarify: 'עבודה מהבית',
  interviewAt: '2026-12-01T10:00:00+02:00',
});

describe('הוספת מועמדות — POST /api/applications', () => {
  it('תלמיד מוסיף מועמדות לעצמו ומקבל הצעת צעד הבא', async () => {
    const res = await api().post('/api/applications').set(bearer(f.studentA1.token)).send(validBody(f));
    expect(res.status).toBe(201);
    expect(res.body.application).toMatchObject({
      companyName: 'חברת אלפא',
      user: { id: f.studentA1.id },
      createdBy: { id: f.studentA1.id },
      status: { id: f.statusSent.id, name: 'נשלחו קורות חיים' },
      jobRole: { id: f.roleA.id },
      interestLevel: 'HIGH',
      submittedOn: dateFromToday(-1),
      interviewAt: '2026-12-01T08:00:00.000Z',
      actions: [],
    });
    expect(res.body.suggestedAction).toEqual({ title: 'לבצע מעקב אחרי קורות החיים', dueOn: dateFromToday(7) });
    // ההצעה לא יוצרת פעולה בעצמה
    expect(await prisma.action.count()).toBe(0);
    // תלמיד שמוסיף לעצמו לא מקבל התראה
    expect(await prisma.notification.count()).toBe(0);
  });

  it('מנהל מוסד מוסיף מועמדות לתלמיד — והתלמיד מקבל התראה', async () => {
    const res = await api()
      .post('/api/applications')
      .set(bearer(f.adminA.token))
      .send({ ...validBody(f), userId: f.studentA1.id });
    expect(res.status).toBe(201);
    expect(res.body.application.user.id).toBe(f.studentA1.id);
    expect(res.body.application.createdBy.id).toBe(f.adminA.id);

    const notifications = await prisma.notification.findMany({ where: { userId: f.studentA1.id } });
    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toMatchObject({ type: 'APPLICATION_CREATED', actorId: f.adminA.id, isRead: false });
  });

  it('מנהל חייב לציין userId', async () => {
    const res = await api().post('/api/applications').set(bearer(f.adminA.token)).send(validBody(f));
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].field).toBe('userId');
  });

  it('אי אפשר להוסיף מועמדות לתלמיד שממתין לאישור', async () => {
    await prisma.user.update({ where: { id: f.studentA2.id }, data: { approvalStatus: 'PENDING' } });
    const res = await api()
      .post('/api/applications')
      .set(bearer(f.adminA.token))
      .send({ ...validBody(f), userId: f.studentA2.id });
    expect(res.status).toBe(400);
  });

  it('שדות חובה חסרים מחזירים 400 עם פירוט', async () => {
    const res = await api().post('/api/applications').set(bearer(f.studentA1.token)).send({ companyName: '' });
    expect(res.status).toBe(400);
    const fields = res.body.error.details.map((d: { field: string }) => d.field);
    expect(fields).toEqual(expect.arrayContaining(['companyName', 'jobTitle', 'submittedOn', 'statusId']));
  });

  it.each([
    ['submittedOn', { submittedOn: '2026-02-30' }],
    ['submittedOn', { submittedOn: '01/10/2026' }],
    ['jobUrl', { jobUrl: 'not a url' }],
    ['interestLevel', { interestLevel: 'VERY_HIGH' }],
    ['interviewAt', { interviewAt: 'מחר בעשר' }],
    ['interviewAt', { interviewAt: '2026-02-30T10:00:00+02:00' }],
    ['companyName', { companyName: 'א'.repeat(121) }],
  ])('ולידציה נכשלת על %s', async (field, override) => {
    const res = await api().post('/api/applications').set(bearer(f.studentA1.token)).send({ ...validBody(f), ...override });
    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d: { field: string }) => d.field)).toContain(field);
  });

  it('תאריך הגשה בעתיד נדחה', async () => {
    const res = await api().post('/api/applications').set(bearer(f.studentA1.token)).send({ ...validBody(f), submittedOn: dateFromToday(3) });
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].field).toBe('submittedOn');
  });

  it('סטטוס של מוסד אחר נדחה', async () => {
    const res = await api().post('/api/applications').set(bearer(f.studentA1.token)).send({ ...validBody(f), statusId: f.customStatusB.id });
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].field).toBe('statusId');
  });

  it('תחום תפקיד לא פעיל או של מוסד אחר נדחה', async () => {
    for (const jobRoleId of [f.inactiveRoleA.id, f.roleB.id]) {
      const res = await api().post('/api/applications').set(bearer(f.studentA1.token)).send({ ...validBody(f), jobRoleId });
      expect(res.status).toBe(400);
      expect(res.body.error.details[0].field).toBe('jobRoleId');
    }
  });

  it('תלמיד במוסד ב יכול לבחור את הסטטוס המותאם של המוסד שלו', async () => {
    const res = await api()
      .post('/api/applications')
      .set(bearer(f.studentB1.token))
      .send({ ...validBody(f), jobRoleId: f.roleB.id, statusId: f.customStatusB.id });
    expect(res.status).toBe(201);
    expect(res.body.suggestedAction).toEqual({ title: 'להתכונן', dueOn: dateFromToday(2) });
  });
});

describe('עריכת מועמדות — PATCH /api/applications/:id', () => {
  it('שינוי סטטוס על ידי התלמיד מחזיר הצעה ולא יוצר התראה', async () => {
    const app = await createApplication(f.studentA1.id, f.statusSent.id);
    const res = await api().patch(`/api/applications/${app.id}`).set(bearer(f.studentA1.token)).send({ statusId: f.statusInterview.id });
    expect(res.status).toBe(200);
    expect(res.body.statusChanged).toBe(true);
    expect(res.body.application.status.name).toBe('נקבע ראיון');
    expect(res.body.suggestedAction).toEqual({ title: 'להתכונן לראיון', dueOn: dateFromToday(1) });
    expect(await prisma.notification.count()).toBe(0);
  });

  it('שינוי סטטוס על ידי מנהל המוסד יוצר התראה לתלמיד עם הצעת צעד', async () => {
    const app = await createApplication(f.studentA1.id, f.statusSent.id, { companyName: 'חברה א׳', jobTitle: 'מפתחת React' });
    const res = await api().patch(`/api/applications/${app.id}`).set(bearer(f.adminA.token)).send({ statusId: f.statusInterview.id });
    expect(res.status).toBe(200);

    const list = await api().get('/api/notifications').set(bearer(f.studentA1.token));
    expect(list.body.unreadCount).toBe(1);
    expect(list.body.items[0]).toMatchObject({
      type: 'STATUS_CHANGED',
      title: 'עדכון במועמדות שלך',
      suggestedAction: 'להתכונן לראיון',
      suggestedDueOn: dateFromToday(1),
      application: { id: app.id, companyName: 'חברה א׳' },
      actor: { id: f.adminA.id, fullName: 'מנהלת א' },
    });
    expect(list.body.items[0].message).toContain('סטטוס חדש: נקבע ראיון');
    expect(list.body.items[0].message).toContain('"מפתחת React"');
  });

  it('עדכון בלי שינוי סטטוס אינו מחזיר הצעה ואינו יוצר התראה', async () => {
    const app = await createApplication(f.studentA1.id, f.statusSent.id);
    const res = await api()
      .patch(`/api/applications/${app.id}`)
      .set(bearer(f.adminA.token))
      .send({ notes: 'הערה', statusId: f.statusSent.id, interestLevel: null });
    expect(res.status).toBe(200);
    expect(res.body.statusChanged).toBe(false);
    expect(res.body.suggestedAction).toBeNull();
    expect(res.body.application.notes).toBe('הערה');
    expect(await prisma.notification.count()).toBe(0);
  });

  it('אפשר למחוק שדה רשות עם null או מחרוזת ריקה', async () => {
    const app = await createApplication(f.studentA1.id, f.statusSent.id, { interestLevel: 'HIGH', jobRoleId: f.roleA.id });
    const res = await api()
      .patch(`/api/applications/${app.id}`)
      .set(bearer(f.studentA1.token))
      .send({ interestLevel: null, jobRoleId: null, contactName: '' });
    expect(res.status).toBe(200);
    expect(res.body.application).toMatchObject({ interestLevel: null, jobRole: null, contactName: null });
  });

  it('גוף ריק מחזיר 400', async () => {
    const app = await createApplication(f.studentA1.id, f.statusSent.id);
    const res = await api().patch(`/api/applications/${app.id}`).set(bearer(f.studentA1.token)).send({});
    expect(res.status).toBe(400);
  });

  it('מזהה לא מספרי מחזיר 400', async () => {
    const res = await api().get('/api/applications/abc').set(bearer(f.studentA1.token));
    expect(res.status).toBe(400);
  });
});

describe('צפייה ומחיקה', () => {
  it('GET מחזיר פרטים מלאים כולל פעולות', async () => {
    const app = await createApplication(f.studentA1.id, f.statusSent.id);
    await prisma.action.create({ data: { applicationId: app.id, title: 'פעולה', dueOn: new Date('2026-11-01'), createdById: f.studentA1.id } });
    const res = await api().get(`/api/applications/${app.id}`).set(bearer(f.studentA1.token));
    expect(res.status).toBe(200);
    expect(res.body.application.actions).toHaveLength(1);
    expect(res.body.application.actions[0]).toMatchObject({ title: 'פעולה', dueOn: '2026-11-01', status: 'OPEN' });
  });

  it('DELETE מוחק את המועמדות יחד עם הפעולות וההתראות', async () => {
    const app = await createApplication(f.studentA1.id, f.statusSent.id);
    await prisma.action.create({ data: { applicationId: app.id, title: 'פעולה', dueOn: new Date('2026-11-01'), createdById: f.studentA1.id } });
    await api().patch(`/api/applications/${app.id}`).set(bearer(f.adminA.token)).send({ statusId: f.statusInterview.id });

    const res = await api().delete(`/api/applications/${app.id}`).set(bearer(f.studentA1.token));
    expect(res.status).toBe(204);
    expect(await prisma.application.count()).toBe(0);
    expect(await prisma.action.count()).toBe(0);
    expect(await prisma.notification.count()).toBe(0);
    expect((await api().get(`/api/applications/${app.id}`).set(bearer(f.studentA1.token))).status).toBe(404);
  });
});

describe('חיפוש, סינון ומיון — GET /api/applications', () => {
  beforeEach(async () => {
    await createApplication(f.studentA1.id, f.statusSent.id, { companyName: 'Alpha Software', jobTitle: 'React Developer', interestLevel: 'LOW', jobRoleId: f.roleA.id });
    await createApplication(f.studentA1.id, f.statusInterview.id, { companyName: 'בטא מערכות', jobTitle: 'בודקת תוכנה', interestLevel: 'HIGH' });
    await createApplication(f.studentA1.id, f.statusRejected.id, { companyName: 'גמא', jobTitle: 'מפתחת react', interestLevel: 'MEDIUM' });
    await createApplication(f.studentA1.id, f.statusSent.id, { companyName: 'דלתא', jobTitle: 'מנתחת' });
  });

  const get = (qs: string) => api().get(`/api/applications${qs}`).set(bearer(f.studentA1.token));
  const names = (res: { body: { items: { companyName: string }[] } }) => res.body.items.map((a) => a.companyName);

  it('חיפוש לפי שם חברה או תפקיד, ללא תלות באותיות גדולות', async () => {
    expect(names(await get('?search=REACT')).sort()).toEqual(['Alpha Software', 'גמא'].sort());
    expect(names(await get(`?search=${encodeURIComponent('בטא')}`))).toEqual(['בטא מערכות']);
  });

  it('סינון לפי סטטוס, רמת עניין, תחום תפקיד ופתוח/סגור', async () => {
    expect(names(await get(`?statusId=${f.statusInterview.id}`))).toEqual(['בטא מערכות']);
    expect(names(await get('?interestLevel=MEDIUM'))).toEqual(['גמא']);
    expect(names(await get(`?jobRoleId=${f.roleA.id}`))).toEqual(['Alpha Software']);
    expect(names(await get('?isOpen=false'))).toEqual(['גמא']);
    expect((await get('?isOpen=true')).body.total).toBe(3);
  });

  it('מיון לפי שם חברה ורמת עניין', async () => {
    expect(names(await get('?sortBy=companyName&order=asc'))[0]).toBe('Alpha Software');
    const byInterest = (await get('?sortBy=interestLevel&order=desc')).body.items.map((a: { interestLevel: string | null }) => a.interestLevel);
    expect(byInterest).toEqual(['HIGH', 'MEDIUM', 'LOW', null]);
  });

  it('עימוד (pagination)', async () => {
    const res = await get('?page=2&pageSize=3');
    expect(res.body).toMatchObject({ page: 2, pageSize: 3, total: 4, totalPages: 2 });
    expect(res.body.items).toHaveLength(1);
  });

  it('פרמטרים לא תקינים מחזירים 400', async () => {
    expect((await get('?sortBy=password')).status).toBe(400);
    expect((await get('?pageSize=1000')).status).toBe(400);
    expect((await get('?isOpen=yes')).status).toBe(400);
  });

  it('הרשימה כוללת את הפעולה הפתוחה הקרובה', async () => {
    const app = await createApplication(f.studentA1.id, f.statusSent.id, { companyName: 'עם פעולות' });
    await prisma.action.createMany({
      data: [
        { applicationId: app.id, title: 'מאוחרת', dueOn: new Date('2026-12-10'), createdById: f.studentA1.id },
        { applicationId: app.id, title: 'קרובה', dueOn: new Date('2026-11-01'), createdById: f.studentA1.id },
        { applicationId: app.id, title: 'בוצעה', dueOn: new Date('2026-10-01'), createdById: f.studentA1.id, status: 'DONE', completedAt: new Date() },
      ],
    });
    const item = (await get(`?search=${encodeURIComponent('עם פעולות')}`)).body.items[0];
    expect(item.nextAction).toMatchObject({ title: 'קרובה', dueOn: '2026-11-01' });
    expect(item.openActionsCount).toBe(2);
  });
});
