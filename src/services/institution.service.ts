import type { Institution, Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';
import { conflict, notFound } from '../utils/httpError';
import type { CreateInstitutionInput, UpdateInstitutionInput } from '../validation/institution.schemas';

async function ensureNameAvailable(name: string, exceptId?: number) {
  const existing = await prisma.institution.findFirst({
    where: { name: { equals: name, mode: 'insensitive' }, ...(exceptId ? { NOT: { id: exceptId } } : {}) },
  });
  if (existing) {
    throw conflict('קיים כבר מוסד בשם זה', 'INSTITUTION_NAME_TAKEN');
  }
}

/** חיפוש לפי שם המוסד או העיר */
function searchWhere(search?: string): Prisma.InstitutionWhereInput | undefined {
  if (!search) return undefined;
  return {
    OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { city: { contains: search, mode: 'insensitive' } },
    ],
  };
}

function toDto(institution: Institution) {
  return {
    id: institution.id,
    name: institution.name,
    city: institution.city,
    contactEmail: institution.contactEmail,
    createdAt: institution.createdAt,
    updatedAt: institution.updatedAt,
  };
}

/** רשימה ציבורית לטופס ההרשמה — מזהה, שם ועיר */
export async function listPublic(search?: string) {
  const institutions = await prisma.institution.findMany({
    where: searchWhere(search),
    select: { id: true, name: true, city: true },
    orderBy: { name: 'asc' },
    take: 100,
  });
  return { items: institutions };
}

export async function listAll(search?: string) {
  const institutions = await prisma.institution.findMany({
    where: searchWhere(search),
    orderBy: { name: 'asc' },
    include: { users: { select: { role: true } } },
  });
  return {
    items: institutions.map(({ users, ...institution }) => ({
      ...toDto(institution),
      adminsCount: users.filter((user) => user.role === 'INSTITUTION_ADMIN').length,
      studentsCount: users.filter((user) => user.role === 'STUDENT').length,
    })),
  };
}

export async function create(input: CreateInstitutionInput) {
  await ensureNameAvailable(input.name);
  const institution = await prisma.institution.create({
    data: { name: input.name, city: input.city ?? null, contactEmail: input.contactEmail ?? null },
  });
  return { institution: toDto(institution) };
}

export async function update(id: number, input: UpdateInstitutionInput) {
  const existing = await prisma.institution.findUnique({ where: { id } });
  if (!existing) {
    throw notFound('המוסד לא נמצא');
  }
  if (input.name) {
    await ensureNameAvailable(input.name, id);
  }
  const institution = await prisma.institution.update({
    where: { id },
    data: { name: input.name, city: input.city, contactEmail: input.contactEmail },
  });
  return { institution: toDto(institution) };
}
