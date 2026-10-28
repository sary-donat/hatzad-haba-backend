import type { Application, ApplicationStatus, NotificationType, Prisma } from '@prisma/client';
import type { AuthUser } from '../auth/authUser';
import { prisma } from '../db/prisma';
import { formatIsraeliDate } from '../utils/dates';
import { notFound } from '../utils/httpError';
import { pageArgs, pageResult, type PageParams } from '../utils/pagination';
import { toNotificationDto } from './mappers';
import type { Suggestion } from './suggestion';

const includeRefs = {
  application: { select: { id: true, companyName: true, jobTitle: true } },
  actor: { select: { id: true, fullName: true } },
} satisfies Prisma.NotificationInclude;

type AppForNotification = Pick<Application, 'id' | 'userId' | 'companyName' | 'jobTitle'>;

interface NotifyInput {
  actor: AuthUser;
  application: AppForNotification;
  type: NotificationType;
  status?: ApplicationStatus;
  actionTitle?: string;
  actionDueOn?: Date;
  suggestion?: Suggestion | null;
}

function buildMessage(input: NotifyInput): string {
  const { application, actor } = input;
  const target = `לתפקיד "${application.jobTitle}" בחברה "${application.companyName}"`;
  switch (input.type) {
    case 'APPLICATION_CREATED':
      return `${actor.fullName} הוסיף/ה עבורך מועמדות ${target}. סטטוס: ${input.status?.name ?? ''}`;
    case 'STATUS_CHANGED':
      return `${actor.fullName} עדכן/ה את המועמדות שלך ${target}. סטטוס חדש: ${input.status?.name ?? ''}`;
    case 'ACTION_ADDED': {
      const due = input.actionDueOn ? ` (עד ${formatIsraeliDate(input.actionDueOn)})` : '';
      return `${actor.fullName} הוסיף/ה פעולה למועמדות שלך ${target}: "${input.actionTitle ?? ''}"${due}`;
    }
  }
}

const TITLES: Record<NotificationType, string> = {
  APPLICATION_CREATED: 'נוספה עבורך מועמדות',
  STATUS_CHANGED: 'עדכון במועמדות שלך',
  ACTION_ADDED: 'נוספה פעולה למועמדות שלך',
};

/** יוצר התראה לתלמיד — רק כשמישהו אחר (מנהל) ביצע את השינוי */
export async function notifyOwnerIfNeeded(input: NotifyInput, tx: Prisma.TransactionClient = prisma) {
  if (input.actor.id === input.application.userId) {
    return;
  }
  await tx.notification.create({
    data: {
      userId: input.application.userId,
      applicationId: input.application.id,
      actorId: input.actor.id,
      type: input.type,
      title: TITLES[input.type],
      message: buildMessage(input).slice(0, 500),
      suggestedAction: input.suggestion?.title ?? null,
      suggestedDueOn: input.suggestion?.dueOnDate ?? null,
    },
  });
}

export async function list(actor: AuthUser, query: PageParams & { unreadOnly?: boolean }) {
  const where: Prisma.NotificationWhereInput = { userId: actor.id, ...(query.unreadOnly ? { isRead: false } : {}) };
  const [items, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      include: includeRefs,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      ...pageArgs(query),
    }),
    prisma.notification.count({ where }),
    unreadCountFor(actor.id),
  ]);
  return { ...pageResult(items.map(toNotificationDto), total, query), unreadCount };
}

export function unreadCountFor(userId: number) {
  return prisma.notification.count({ where: { userId, isRead: false } });
}

export async function markRead(actor: AuthUser, id: number) {
  const result = await prisma.notification.updateMany({ where: { id, userId: actor.id }, data: { isRead: true } });
  if (result.count === 0) {
    throw notFound('ההתראה לא נמצאה');
  }
  const notification = await prisma.notification.findUniqueOrThrow({ where: { id }, include: includeRefs });
  return { notification: toNotificationDto(notification) };
}

export async function markAllRead(actor: AuthUser) {
  const result = await prisma.notification.updateMany({
    where: { userId: actor.id, isRead: false },
    data: { isRead: true },
  });
  return { updated: result.count };
}
