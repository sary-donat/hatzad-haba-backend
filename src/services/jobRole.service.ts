import type { AuthUser } from '../auth/authUser';
import { prisma } from '../db/prisma';
import { badRequest, conflict, fieldError, notFound } from '../utils/httpError';
import type { CreateJobRoleInput, ListCatalogQuery, UpdateJobRoleInput } from '../validation/jobRole.schemas';
import { isAdmin, resolveManagedInstitutionId, resolveViewInstitutionId } from './access.service';
import { toJobRoleDto } from './mappers';

async function ensureNameAvailable(institutionId: number, name: string, exceptId?: number) {
  const existing = await prisma.jobRole.findFirst({
    where: {
      institutionId,
      name: { equals: name, mode: 'insensitive' },
      ...(exceptId ? { NOT: { id: exceptId } } : {}),
    },
  });
  if (existing) {
    throw conflict('קיים כבר תחום תפקיד בשם זה במוסד', 'JOB_ROLE_NAME_TAKEN');
  }
}

export async function list(actor: AuthUser, query: ListCatalogQuery) {
  const institutionId = resolveViewInstitutionId(actor, query.institutionId);
  if (institutionId === null) {
    throw badRequest('יש לציין institutionId', 'VALIDATION_ERROR', [
      { field: 'institutionId', message: 'שדה חובה עבור מנהל ראשי' },
    ]);
  }
  const includeInactive = isAdmin(actor) && query.includeInactive === true;
  const roles = await prisma.jobRole.findMany({
    where: { institutionId, ...(includeInactive ? {} : { isActive: true }) },
    orderBy: { name: 'asc' },
  });
  return { items: roles.map(toJobRoleDto) };
}

async function findManagedRole(actor: AuthUser, id: number) {
  const role = await prisma.jobRole.findUnique({ where: { id } });
  if (!role || (actor.role === 'INSTITUTION_ADMIN' && role.institutionId !== actor.institutionId)) {
    throw notFound('תחום התפקיד לא נמצא');
  }
  return role;
}

export async function create(actor: AuthUser, input: CreateJobRoleInput) {
  const institutionId = await resolveManagedInstitutionId(actor, input.institutionId);
  await ensureNameAvailable(institutionId, input.name);
  const role = await prisma.jobRole.create({ data: { institutionId, name: input.name } });
  return { jobRole: toJobRoleDto(role) };
}

export async function update(actor: AuthUser, id: number, input: UpdateJobRoleInput) {
  const existing = await findManagedRole(actor, id);
  if (input.name) {
    await ensureNameAvailable(existing.institutionId, input.name, id);
  }
  const role = await prisma.jobRole.update({
    where: { id },
    data: { name: input.name, isActive: input.isActive },
  });
  return { jobRole: toJobRoleDto(role) };
}

/** תחומי התפקיד הפעילים של מוסד — ציבורי, לטופס ההרשמה */
export async function listPublicForInstitution(institutionId: number) {
  const institution = await prisma.institution.findUnique({ where: { id: institutionId } });
  if (!institution) {
    throw notFound('המוסד לא נמצא');
  }
  const roles = await prisma.jobRole.findMany({
    where: { institutionId, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
  return { items: roles };
}

/** בודק שכל התחומים קיימים, פעילים ושייכים למוסד */
export async function validateActiveJobRoleIds(institutionId: number | null, ids: number[]) {
  if (ids.length === 0) return;
  const count = await prisma.jobRole.count({
    where: { id: { in: ids }, institutionId: institutionId ?? -1, isActive: true },
  });
  if (count !== ids.length) {
    throw fieldError('jobRoleIds', 'אחד או יותר מתחומי התפקיד אינם קיימים או אינם זמינים במוסד');
  }
}
