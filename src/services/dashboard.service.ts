import type { Prisma } from '@prisma/client';
import type { AuthUser } from '../auth/authUser';
import { prisma } from '../db/prisma';
import { addDays, formatDateOnly, todayDate } from '../utils/dates';
import { forbidden, notFound } from '../utils/httpError';
import { applicationScope, isAdmin, managedUsersScope } from './access.service';
import { toActionDto, toApplicationRef, toStatusRef } from './mappers';
import { unreadCountFor } from './notification.service';

const UPCOMING_DAYS = 7;
const LIST_LIMIT = 100;

const applicationRefSelect = {
  id: true,
  companyName: true,
  jobTitle: true,
  user: { select: { id: true, fullName: true } },
} satisfies Prisma.ApplicationSelect;

/**
 * נתוני מסך הבית. הקבוצות מחושבות בכל בקשה לפי התאריכים — אינן נשמרות בטבלה.
 */
export async function getDashboard(actor: AuthUser, userId?: number) {
  const scope: Prisma.ApplicationWhereInput[] = [applicationScope(actor)];

  if (userId !== undefined) {
    if (!isAdmin(actor)) {
      throw forbidden('הסינון לפי תלמיד זמין למנהלים בלבד');
    }
    const student = await prisma.user.findFirst({ where: { AND: [{ id: userId }, managedUsersScope(actor)] } });
    if (!student) {
      throw notFound('התלמיד לא נמצא');
    }
    scope.push({ userId });
  }

  const applicationWhere: Prisma.ApplicationWhereInput = { AND: scope };
  const today = todayDate();
  const upcomingEnd = addDays(today, UPCOMING_DAYS);
  const now = new Date();

  const openActions = (dueOn: Prisma.DateTimeFilter) =>
    prisma.action.findMany({
      where: { status: 'OPEN', dueOn, application: applicationWhere },
      include: { application: { select: applicationRefSelect } },
      orderBy: [{ dueOn: 'asc' }, { id: 'asc' }],
      take: LIST_LIMIT,
    });

  const [overdue, dueToday, upcoming, interviews, needsNextStep, unreadNotifications] = await Promise.all([
    openActions({ lt: today }),
    openActions({ equals: today }),
    openActions({ gt: today, lte: upcomingEnd }),
    prisma.application.findMany({
      where: { AND: [applicationWhere, { interviewAt: { gte: now, lte: addDays(now, UPCOMING_DAYS) } }] },
      select: { ...applicationRefSelect, interviewAt: true, interviewLocation: true },
      orderBy: { interviewAt: 'asc' },
      take: LIST_LIMIT,
    }),
    // תהליכים פתוחים שאין להם אף פעולה פתוחה
    prisma.application.findMany({
      where: {
        AND: [applicationWhere, { status: { isFinal: false } }, { actions: { none: { status: 'OPEN' } } }],
      },
      select: { ...applicationRefSelect, status: true, updatedAt: true },
      orderBy: { updatedAt: 'asc' },
      take: LIST_LIMIT,
    }),
    unreadCountFor(actor.id),
  ]);

  const actionItem = (action: (typeof overdue)[number]) => ({
    ...toActionDto(action),
    application: toApplicationRef(action.application),
  });

  return {
    today: formatDateOnly(today),
    overdue: overdue.map(actionItem),
    dueToday: dueToday.map(actionItem),
    upcoming: upcoming.map(actionItem),
    upcomingInterviews: interviews.map((app) => ({
      ...toApplicationRef(app),
      interviewAt: app.interviewAt,
      interviewLocation: app.interviewLocation,
    })),
    needsNextStep: needsNextStep.map((app) => ({
      ...toApplicationRef(app),
      status: toStatusRef(app.status),
      updatedAt: app.updatedAt,
    })),
    unreadNotifications,
  };
}
