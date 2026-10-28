import type { Prisma, User } from '@prisma/client';
import type { AuthUser } from '../auth/authUser';
import { prisma } from '../db/prisma';
import { parseDateOnly, todayString } from '../utils/dates';
import { badRequest, fieldError, forbidden, notFound } from '../utils/httpError';
import { pageArgs, pageResult } from '../utils/pagination';
import type {
  CreateApplicationInput,
  ListApplicationsQuery,
  UpdateApplicationInput,
} from '../validation/application.schemas';
import { applicationScope, findAccessibleApplication, isAdmin, managedUsersScope } from './access.service';
import { toApplicationDetail, toApplicationSummary } from './mappers';
import { notifyOwnerIfNeeded } from './notification.service';
import { suggestNextStep, toSuggestionDto } from './suggestion';

const detailInclude = {
  status: true,
  jobRole: true,
  user: { select: { id: true, fullName: true } },
  createdBy: { select: { id: true, fullName: true } },
  actions: { orderBy: [{ status: 'asc' }, { dueOn: 'asc' }, { id: 'asc' }] },
} satisfies Prisma.ApplicationInclude;

const summaryInclude = {
  status: true,
  jobRole: true,
  user: { select: { id: true, fullName: true } },
  createdBy: { select: { id: true, fullName: true } },
  actions: { where: { status: 'OPEN' }, orderBy: [{ dueOn: 'asc' }, { id: 'asc' }] },
} satisfies Prisma.ApplicationInclude;

/** סטטוס חייב להיות פעיל, ובסיסי או שייך למוסד של התלמיד */
async function validateStatus(statusId: number, institutionId: number | null) {
  const status = await prisma.applicationStatus.findFirst({
    where: {
      id: statusId,
      isActive: true,
      OR: [{ institutionId: null }, ...(institutionId !== null ? [{ institutionId }] : [])],
    },
  });
  if (!status) {
    throw fieldError('statusId', 'הסטטוס שנבחר אינו קיים או אינו זמין למוסד');
  }
  return status;
}

/** תחום תפקיד חייב להיות פעיל ושייך למוסד של התלמיד */
async function validateJobRole(jobRoleId: number, institutionId: number | null) {
  const role = await prisma.jobRole.findFirst({
    where: { id: jobRoleId, isActive: true, institutionId: institutionId ?? -1 },
  });
  if (!role) {
    throw fieldError('jobRoleId', 'תחום התפקיד שנבחר אינו קיים או אינו זמין למוסד');
  }
  return role;
}

function validateSubmittedOn(value: string | undefined) {
  if (value && value > todayString()) {
    throw fieldError('submittedOn', 'תאריך ההגשה אינו יכול להיות בעתיד');
  }
}

/** קובע של מי המועמדות: תלמיד — תמיד של עצמו. מנהל — של התלמיד שציין */
async function resolveOwner(actor: AuthUser, userId: number | undefined): Promise<Pick<User, 'id' | 'institutionId'>> {
  if (actor.role === 'STUDENT') {
    if (userId !== undefined && userId !== actor.id) {
      throw forbidden('תלמיד יכול להוסיף מועמדויות רק לעצמו');
    }
    return { id: actor.id, institutionId: actor.institutionId };
  }

  if (userId === undefined) {
    throw fieldError('userId', 'יש לבחור עבור איזה תלמיד מוסיפים את המועמדות');
  }
  const owner = await prisma.user.findFirst({
    where: { AND: [{ id: userId, role: 'STUDENT' }, managedUsersScope(actor)] },
  });
  if (!owner) {
    throw notFound('התלמיד לא נמצא');
  }
  if (!owner.isActive || owner.approvalStatus !== 'APPROVED') {
    throw badRequest('אפשר להוסיף מועמדות רק לתלמיד פעיל ומאושר', 'STUDENT_NOT_ACTIVE');
  }
  return owner;
}

function nullableDate(value: string | null | undefined, parse: (v: string) => Date) {
  if (value === undefined) return undefined;
  return value === null ? null : parse(value);
}

export async function list(actor: AuthUser, query: ListApplicationsQuery) {
  const filters: Prisma.ApplicationWhereInput[] = [applicationScope(actor)];

  if (query.userId !== undefined) {
    if (!isAdmin(actor) && query.userId !== actor.id) {
      throw forbidden('הסינון לפי תלמיד זמין למנהלים בלבד');
    }
    filters.push({ userId: query.userId });
  }
  if (query.institutionId !== undefined) {
    if (actor.role !== 'SUPER_ADMIN' && query.institutionId !== actor.institutionId) {
      throw forbidden('אפשר לצפות רק בנתוני המוסד שלך');
    }
    filters.push({ user: { institutionId: query.institutionId } });
  }
  if (query.search) {
    filters.push({
      OR: [
        { companyName: { contains: query.search, mode: 'insensitive' } },
        { jobTitle: { contains: query.search, mode: 'insensitive' } },
      ],
    });
  }
  if (query.statusId) filters.push({ statusId: query.statusId });
  if (query.interestLevel) filters.push({ interestLevel: query.interestLevel });
  if (query.jobRoleId) filters.push({ jobRoleId: query.jobRoleId });
  if (query.isOpen !== undefined) filters.push({ status: { isFinal: !query.isOpen } });

  const orderBy: Prisma.ApplicationOrderByWithRelationInput[] = [
    query.sortBy === 'interestLevel'
      ? { interestLevel: { sort: query.order, nulls: 'last' } }
      : { [query.sortBy]: query.order },
    { id: query.order },
  ];

  const where: Prisma.ApplicationWhereInput = { AND: filters };
  const [items, total] = await Promise.all([
    prisma.application.findMany({ where, include: summaryInclude, orderBy, ...pageArgs(query) }),
    prisma.application.count({ where }),
  ]);
  return pageResult(items.map(toApplicationSummary), total, query);
}

export async function getById(actor: AuthUser, id: number) {
  await findAccessibleApplication(actor, id);
  const application = await prisma.application.findUniqueOrThrow({ where: { id }, include: detailInclude });
  return { application: toApplicationDetail(application) };
}

export async function create(actor: AuthUser, input: CreateApplicationInput) {
  const owner = await resolveOwner(actor, input.userId);
  const status = await validateStatus(input.statusId, owner.institutionId);
  if (input.jobRoleId) {
    await validateJobRole(input.jobRoleId, owner.institutionId);
  }
  validateSubmittedOn(input.submittedOn);

  const suggestion = suggestNextStep(status);

  const application = await prisma.$transaction(async (tx) => {
    const created = await tx.application.create({
      data: {
        userId: owner.id,
        createdById: actor.id,
        companyName: input.companyName,
        jobTitle: input.jobTitle,
        jobRoleId: input.jobRoleId ?? null,
        submittedOn: parseDateOnly(input.submittedOn),
        statusId: status.id,
        jobUrl: input.jobUrl ?? null,
        contactName: input.contactName ?? null,
        interestLevel: input.interestLevel ?? null,
        jobAttractions: input.jobAttractions ?? null,
        pointsToClarify: input.pointsToClarify ?? null,
        notes: input.notes ?? null,
        interviewAt: input.interviewAt ? new Date(input.interviewAt) : null,
        interviewLocation: input.interviewLocation ?? null,
        interviewPreparation: input.interviewPreparation ?? null,
        interviewQuestions: input.interviewQuestions ?? null,
      },
      include: detailInclude,
    });
    await notifyOwnerIfNeeded({ actor, application: created, type: 'APPLICATION_CREATED', status, suggestion }, tx);
    return created;
  });

  return { application: toApplicationDetail(application), suggestedAction: toSuggestionDto(suggestion) };
}

export async function update(actor: AuthUser, id: number, input: UpdateApplicationInput) {
  const existing = await findAccessibleApplication(actor, id);
  const institutionId = existing.user.institutionId;

  const statusChanged = input.statusId !== undefined && input.statusId !== existing.statusId;
  const newStatus = statusChanged ? await validateStatus(input.statusId as number, institutionId) : null;
  if (input.jobRoleId && input.jobRoleId !== existing.jobRoleId) {
    await validateJobRole(input.jobRoleId, institutionId);
  }
  validateSubmittedOn(input.submittedOn);

  const suggestion = newStatus ? suggestNextStep(newStatus) : null;

  const application = await prisma.$transaction(async (tx) => {
    const updated = await tx.application.update({
      where: { id },
      data: {
        companyName: input.companyName,
        jobTitle: input.jobTitle,
        jobRoleId: input.jobRoleId,
        submittedOn: input.submittedOn ? parseDateOnly(input.submittedOn) : undefined,
        statusId: input.statusId,
        jobUrl: input.jobUrl,
        contactName: input.contactName,
        interestLevel: input.interestLevel,
        jobAttractions: input.jobAttractions,
        pointsToClarify: input.pointsToClarify,
        notes: input.notes,
        interviewAt: nullableDate(input.interviewAt, (value) => new Date(value)),
        interviewLocation: input.interviewLocation,
        interviewPreparation: input.interviewPreparation,
        interviewQuestions: input.interviewQuestions,
      },
      include: detailInclude,
    });
    if (newStatus) {
      await notifyOwnerIfNeeded(
        { actor, application: updated, type: 'STATUS_CHANGED', status: newStatus, suggestion },
        tx,
      );
    }
    return updated;
  });

  return {
    application: toApplicationDetail(application),
    statusChanged,
    suggestedAction: toSuggestionDto(suggestion),
  };
}

export async function remove(actor: AuthUser, id: number) {
  await findAccessibleApplication(actor, id);
  await prisma.application.delete({ where: { id } });
}
