import type { Prisma } from '@prisma/client';
import type { AuthUser } from '../auth/authUser';
import { prisma } from '../db/prisma';
import { parseDateOnly } from '../utils/dates';
import { notFound } from '../utils/httpError';
import type { CreateActionInput, UpdateActionInput } from '../validation/action.schemas';
import { applicationScope, findAccessibleApplication } from './access.service';
import { toActionDto } from './mappers';
import { notifyOwnerIfNeeded } from './notification.service';

/** פעולה נגישה רק אם המועמדות שאליה היא שייכת נגישה למשתמש */
async function findAccessibleAction(actor: AuthUser, id: number) {
  const action = await prisma.action.findFirst({ where: { id, application: applicationScope(actor) } });
  if (!action) {
    throw notFound('הפעולה לא נמצאה');
  }
  return action;
}

export async function listForApplication(actor: AuthUser, applicationId: number, status?: 'OPEN' | 'DONE') {
  await findAccessibleApplication(actor, applicationId);
  const actions = await prisma.action.findMany({
    where: { applicationId, ...(status ? { status } : {}) },
    orderBy: [{ status: 'asc' }, { dueOn: 'asc' }, { id: 'asc' }],
  });
  return { items: actions.map(toActionDto) };
}

export async function create(actor: AuthUser, applicationId: number, input: CreateActionInput) {
  const application = await findAccessibleApplication(actor, applicationId);
  const dueOn = parseDateOnly(input.dueOn);

  const action = await prisma.$transaction(async (tx) => {
    const created = await tx.action.create({
      data: {
        applicationId,
        title: input.title,
        dueOn,
        notes: input.notes ?? null,
        createdById: actor.id,
      },
    });
    await notifyOwnerIfNeeded(
      { actor, application, type: 'ACTION_ADDED', actionTitle: input.title, actionDueOn: dueOn },
      tx,
    );
    return created;
  });

  return { action: toActionDto(action) };
}

export async function update(actor: AuthUser, id: number, input: UpdateActionInput) {
  const existing = await findAccessibleAction(actor, id);

  const data: Prisma.ActionUpdateInput = {
    title: input.title,
    dueOn: input.dueOn ? parseDateOnly(input.dueOn) : undefined,
    notes: input.notes,
  };
  // סימון כבוצעה שומר את מועד הביצוע; פתיחה מחדש מאפסת אותו
  if (input.status && input.status !== existing.status) {
    data.status = input.status;
    data.completedAt = input.status === 'DONE' ? new Date() : null;
  }

  const action = await prisma.action.update({ where: { id }, data });
  return { action: toActionDto(action) };
}

export async function remove(actor: AuthUser, id: number) {
  await findAccessibleAction(actor, id);
  await prisma.action.delete({ where: { id } });
}
