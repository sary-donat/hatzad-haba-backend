import { execSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/db/prisma';
import { BASE_STATUSES, seedBaseStatuses } from '../src/db/seed';
import { createFixture, type Fixture } from './helpers';

let f: Fixture;
beforeEach(async () => {
  f = await createFixture();
});

describe('Prisma ומסד הנתונים', () => {
  it('סכמת Prisma תקינה', () => {
    expect(() => execSync('npx prisma validate', { stdio: 'pipe' })).not.toThrow();
  });

  it('כל ה־Migrations הוחלו על מסד הנתונים', async () => {
    const folders = readdirSync(path.join(__dirname, '..', 'prisma', 'migrations'), { withFileTypes: true }).filter((d) => d.isDirectory());
    const applied = await prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*) AS count FROM "_prisma_migrations" WHERE finished_at IS NOT NULL`;
    expect(Number(applied[0]?.count)).toBe(folders.length);
  });

  it('כל הטבלאות קיימות', async () => {
    const rows = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name <> '_prisma_migrations'`;
    expect(rows.map((r) => r.table_name).sort()).toEqual(
      ['actions', 'application_statuses', 'applications', 'institutions', 'job_roles', 'notifications', 'user_job_roles', 'users'].sort(),
    );
  });

  it('אילוץ: משתמש שאינו מנהל ראשי חייב מוסד', async () => {
    await expect(
      prisma.user.create({ data: { fullName: 'ללא מוסד', email: 'x@test.com', passwordHash: 'x', role: 'STUDENT' } }),
    ).rejects.toThrow();
  });

  it('אילוץ: מנהל ראשי אחד בלבד', async () => {
    await expect(
      prisma.user.create({ data: { fullName: 'שני', email: 'super2@test.com', passwordHash: 'x', role: 'SUPER_ADMIN' } }),
    ).rejects.toThrow();
  });

  it('Foreign Key: אי אפשר ליצור מועמדות למשתמש שאינו קיים', async () => {
    await expect(
      prisma.application.create({
        data: { userId: 9999, createdById: 9999, companyName: 'x', jobTitle: 'y', submittedOn: new Date(), statusId: f.statusSent.id },
      }),
    ).rejects.toThrow();
  });

  it('אילוץ: פעולה שבוצעה חייבת מועד ביצוע', async () => {
    const app = await prisma.application.create({
      data: { userId: f.studentA1.id, createdById: f.studentA1.id, companyName: 'x', jobTitle: 'y', submittedOn: new Date(), statusId: f.statusSent.id },
    });
    await expect(
      prisma.action.create({ data: { applicationId: app.id, title: 'x', dueOn: new Date(), status: 'DONE', createdById: f.studentA1.id } }),
    ).rejects.toThrow();
  });

  it('Seed של הסטטוסים הבסיסיים בטוח להרצה חוזרת', async () => {
    await seedBaseStatuses();
    await seedBaseStatuses();
    expect(await prisma.applicationStatus.count({ where: { institutionId: null } })).toBe(BASE_STATUSES.length);
  });
});
