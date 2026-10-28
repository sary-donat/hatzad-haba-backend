import request from 'supertest';
import type { Role } from '@prisma/client';
import { createApp } from '../src/app';
import { signAccessToken } from '../src/auth/jwt';
import { hashPassword } from '../src/auth/password';
import { prisma } from '../src/db/prisma';
import { seedBaseStatuses } from '../src/db/seed';
import { formatDateOnly, todayDate, addDays } from '../src/utils/dates';

export const app = createApp();
export const api = () => request(app);

export const PASSWORD = 'Passw0rd!';

export async function resetDatabase() {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "notifications", "actions", "applications", "user_job_roles", "job_roles", "application_statuses", "users", "institutions" RESTART IDENTITY CASCADE',
  );
  await seedBaseStatuses();
}

export async function createUser(data: {
  fullName?: string;
  email: string;
  role: Role;
  institutionId?: number | null;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  isActive?: boolean;
}) {
  const user = await prisma.user.create({
    data: {
      fullName: data.fullName ?? data.email.split('@')[0] ?? 'משתמש',
      email: data.email,
      passwordHash: await hashPassword(PASSWORD),
      role: data.role,
      institutionId: data.institutionId ?? null,
      approvalStatus: data.approvalStatus ?? 'APPROVED',
      isActive: data.isActive ?? true,
    },
  });
  return { ...user, token: signAccessToken(user) };
}

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

export const dateFromToday = (days: number) => formatDateOnly(addDays(todayDate(), days));

export async function baseStatus(name: string) {
  return prisma.applicationStatus.findFirstOrThrow({ where: { institutionId: null, name } });
}

/**
 * מבנה בסיסי לבדיקות:
 * מוסד A עם מנהלת ושתי תלמידות, מוסד B עם מנהל ותלמידה, ומנהל ראשי.
 */
export async function createFixture() {
  await resetDatabase();
  const instA = await prisma.institution.create({ data: { name: 'מוסד א' } });
  const instB = await prisma.institution.create({ data: { name: 'מוסד ב' } });

  const superAdmin = await createUser({ fullName: 'מנהל ראשי', email: 'super@test.com', role: 'SUPER_ADMIN' });
  const adminA = await createUser({ fullName: 'מנהלת א', email: 'admin.a@test.com', role: 'INSTITUTION_ADMIN', institutionId: instA.id });
  const adminB = await createUser({ fullName: 'מנהל ב', email: 'admin.b@test.com', role: 'INSTITUTION_ADMIN', institutionId: instB.id });
  const studentA1 = await createUser({ fullName: 'תלמידה א1', email: 'a1@test.com', role: 'STUDENT', institutionId: instA.id });
  const studentA2 = await createUser({ fullName: 'תלמידה א2', email: 'a2@test.com', role: 'STUDENT', institutionId: instA.id });
  const studentB1 = await createUser({ fullName: 'תלמידה ב1', email: 'b1@test.com', role: 'STUDENT', institutionId: instB.id });

  const roleA = await prisma.jobRole.create({ data: { institutionId: instA.id, name: 'תכנות' } });
  const inactiveRoleA = await prisma.jobRole.create({ data: { institutionId: instA.id, name: 'ישן', isActive: false } });
  const roleB = await prisma.jobRole.create({ data: { institutionId: instB.id, name: 'הוראה' } });

  const statusSent = await baseStatus('נשלחו קורות חיים');
  const statusInterview = await baseStatus('נקבע ראיון');
  const statusRejected = await baseStatus('נדחתה');
  const customStatusB = await prisma.applicationStatus.create({
    data: { institutionId: instB.id, name: 'ראיון שני', suggestedAction: 'להתכונן', suggestedDays: 2, sortOrder: 35 },
  });

  return {
    instA, instB, superAdmin, adminA, adminB, studentA1, studentA2, studentB1,
    roleA, inactiveRoleA, roleB, statusSent, statusInterview, statusRejected, customStatusB,
  };
}

export type Fixture = Awaited<ReturnType<typeof createFixture>>;

export async function createApplication(
  userId: number,
  statusId: number,
  overrides: Partial<{ companyName: string; jobTitle: string; interestLevel: 'LOW' | 'MEDIUM' | 'HIGH'; jobRoleId: number }> = {},
) {
  return prisma.application.create({
    data: {
      userId,
      createdById: userId,
      companyName: overrides.companyName ?? 'חברה כלשהי',
      jobTitle: overrides.jobTitle ?? 'מפתחת',
      submittedOn: todayDate(),
      statusId,
      interestLevel: overrides.interestLevel,
      jobRoleId: overrides.jobRoleId,
    },
  });
}
