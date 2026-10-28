import type { Prisma } from '@prisma/client';
import type { AuthUser } from '../auth/authUser';
import { hashPassword } from '../auth/password';
import { prisma } from '../db/prisma';
import { pageArgs, pageResult } from '../utils/pagination';
import { badRequest, conflict, forbidden, notFound } from '../utils/httpError';
import type { CreateUserInput, ListUsersQuery, UpdateUserInput } from '../validation/user.schemas';
import { managedUsersScope } from './access.service';
import { toUserDto, userInclude } from './mappers';

async function findManagedUser(actor: AuthUser, id: number) {
  const user = await prisma.user.findFirst({
    where: { AND: [{ id }, managedUsersScope(actor)] },
    include: userInclude,
  });
  if (!user) {
    throw notFound('המשתמש לא נמצא');
  }
  return user;
}

export async function list(actor: AuthUser, query: ListUsersQuery) {
  const filters: Prisma.UserWhereInput[] = [managedUsersScope(actor)];
  if (query.search) {
    filters.push({
      OR: [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ],
    });
  }
  if (query.role) filters.push({ role: query.role });
  if (query.institutionId) filters.push({ institutionId: query.institutionId });
  if (query.isActive !== undefined) filters.push({ isActive: query.isActive });
  if (query.approvalStatus) filters.push({ approvalStatus: query.approvalStatus });
  if (query.jobRoleId) filters.push({ desiredJobRoles: { some: { jobRoleId: query.jobRoleId } } });

  const where: Prisma.UserWhereInput = { AND: filters };
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: userInclude,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      ...pageArgs(query),
    }),
    prisma.user.count({ where }),
  ]);
  return pageResult(users.map(toUserDto), total, query);
}

export async function getById(actor: AuthUser, id: number) {
  return { user: toUserDto(await findManagedUser(actor, id)) };
}

/** רק המנהל הראשי יוצר משתמשים (בעיקר מנהלי מוסדות). אין אפשרות ליצור מנהל ראשי נוסף */
export async function create(actor: AuthUser, input: CreateUserInput) {
  const institution = await prisma.institution.findUnique({ where: { id: input.institutionId } });
  if (!institution) {
    throw notFound('המוסד לא נמצא');
  }
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw conflict('כתובת הדוא״ל כבר רשומה במערכת', 'EMAIL_TAKEN');
  }

  const user = await prisma.user.create({
    data: {
      fullName: input.fullName,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      role: input.role,
      institutionId: institution.id,
      approvalStatus: 'APPROVED',
      approvedById: actor.id,
      approvedAt: new Date(),
    },
    include: userInclude,
  });
  return { user: toUserDto(user) };
}

export async function update(actor: AuthUser, id: number, input: UpdateUserInput) {
  if (id === actor.id && input.isActive === false) {
    throw badRequest('אי אפשר להשבית את החשבון של עצמך', 'CANNOT_DEACTIVATE_SELF');
  }
  // מנהל ראשי יכול לעדכן את השם של עצמו
  if (id !== actor.id || actor.role !== 'SUPER_ADMIN') {
    const target = await findManagedUser(actor, id);
    if (target.role === 'SUPER_ADMIN' && target.id !== actor.id) {
      throw forbidden();
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: { fullName: input.fullName, isActive: input.isActive },
    include: userInclude,
  });
  return { user: toUserDto(user) };
}

export async function setApproval(actor: AuthUser, id: number, decision: 'APPROVED' | 'REJECTED') {
  const target = await findManagedUser(actor, id);
  if (target.role !== 'STUDENT') {
    throw badRequest('אפשר לאשר או לדחות רק תלמידים', 'NOT_A_STUDENT');
  }
  if (decision === 'APPROVED' && target.approvalStatus === 'APPROVED') {
    throw conflict('התלמיד כבר אושר', 'ALREADY_APPROVED');
  }
  if (decision === 'REJECTED' && target.approvalStatus !== 'PENDING') {
    throw conflict('אפשר לדחות רק תלמיד שממתין לאישור', 'NOT_PENDING');
  }

  const user = await prisma.user.update({
    where: { id },
    data: { approvalStatus: decision, approvedById: actor.id, approvedAt: new Date() },
    include: userInclude,
  });
  return { user: toUserDto(user) };
}
