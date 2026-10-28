import type { AuthUser } from '../auth/authUser';
import { prisma } from '../db/prisma';
import { conflict, forbidden, notFound } from '../utils/httpError';
import type { ListCatalogQuery } from '../validation/jobRole.schemas';
import type { CreateStatusInput, UpdateStatusInput } from '../validation/status.schemas';
import { isAdmin, resolveManagedInstitutionId, resolveViewInstitutionId } from './access.service';
import { toStatusDto } from './mappers';

/** שם סטטוס חייב להיות ייחודי במוסד, ולא זהה לשם של סטטוס בסיסי */
async function ensureNameAvailable(institutionId: number, name: string, exceptId?: number) {
  const existing = await prisma.applicationStatus.findFirst({
    where: {
      OR: [{ institutionId }, { institutionId: null }],
      name: { equals: name, mode: 'insensitive' },
      ...(exceptId ? { NOT: { id: exceptId } } : {}),
    },
  });
  if (existing) {
    throw conflict('קיים כבר סטטוס בשם זה', 'STATUS_NAME_TAKEN');
  }
}

/** סטטוסים בסיסיים + סטטוסים של המוסד, לפי סדר ההצגה */
export async function list(actor: AuthUser, query: ListCatalogQuery) {
  const institutionId = resolveViewInstitutionId(actor, query.institutionId);
  const includeInactive = isAdmin(actor) && query.includeInactive === true;
  const statuses = await prisma.applicationStatus.findMany({
    where: {
      OR: [{ institutionId: null }, ...(institutionId !== null ? [{ institutionId }] : [])],
      ...(includeInactive ? {} : { isActive: true }),
    },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  });
  return { items: statuses.map(toStatusDto) };
}

export async function create(actor: AuthUser, input: CreateStatusInput) {
  const institutionId = await resolveManagedInstitutionId(actor, input.institutionId);
  await ensureNameAvailable(institutionId, input.name);
  const status = await prisma.applicationStatus.create({
    data: {
      institutionId,
      name: input.name,
      isFinal: input.isFinal,
      suggestedAction: input.suggestedAction ?? null,
      suggestedDays: input.suggestedAction ? (input.suggestedDays ?? 3) : null,
      sortOrder: input.sortOrder,
    },
  });
  return { status: toStatusDto(status) };
}

export async function update(actor: AuthUser, id: number, input: UpdateStatusInput) {
  const existing = await prisma.applicationStatus.findUnique({ where: { id } });
  if (!existing) {
    throw notFound('הסטטוס לא נמצא');
  }
  if (existing.institutionId === null) {
    throw forbidden('אי אפשר לשנות סטטוס בסיסי', 'BASE_STATUS_READONLY');
  }
  if (actor.role === 'INSTITUTION_ADMIN' && existing.institutionId !== actor.institutionId) {
    throw notFound('הסטטוס לא נמצא');
  }
  if (input.name) {
    await ensureNameAvailable(existing.institutionId, input.name, id);
  }

  const suggestedAction = input.suggestedAction === undefined ? existing.suggestedAction : input.suggestedAction;
  let suggestedDays = input.suggestedDays === undefined ? existing.suggestedDays : input.suggestedDays;
  if (!suggestedAction) {
    suggestedDays = null;
  } else if (suggestedDays === null) {
    suggestedDays = 3;
  }

  const status = await prisma.applicationStatus.update({
    where: { id },
    data: {
      name: input.name,
      isFinal: input.isFinal,
      suggestedAction,
      suggestedDays,
      sortOrder: input.sortOrder,
      isActive: input.isActive,
    },
  });
  return { status: toStatusDto(status) };
}
