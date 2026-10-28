import { prisma } from '../db/prisma';
import { signAccessToken } from '../auth/jwt';
import { hashPassword, verifyAgainstDummy, verifyPassword } from '../auth/password';
import { conflict, forbidden, notFound, unauthorized } from '../utils/httpError';
import type { AuthUser } from '../auth/authUser';
import type { LoginInput, RegisterInput, UpdateMyJobRolesInput } from '../validation/auth.schemas';
import { validateActiveJobRoleIds } from './jobRole.service';
import { toUserDto, userInclude } from './mappers';

export async function register(input: RegisterInput) {
  const institution = await prisma.institution.findUnique({ where: { id: input.institutionId } });
  if (!institution) {
    throw notFound('המוסד שנבחר לא נמצא');
  }

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw conflict('כתובת הדוא״ל כבר רשומה במערכת', 'EMAIL_TAKEN');
  }

  await validateActiveJobRoleIds(institution.id, input.jobRoleIds);

  // תלמיד שנרשם בעצמו תמיד מקבל תפקיד STUDENT וממתין לאישור מנהל המוסד
  const user = await prisma.user.create({
    data: {
      fullName: input.fullName,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      role: 'STUDENT',
      institutionId: institution.id,
      approvalStatus: 'PENDING',
      desiredJobRoles: { create: input.jobRoleIds.map((jobRoleId) => ({ jobRoleId })) },
    },
    include: userInclude,
  });

  return {
    message: 'ההרשמה התקבלה. החשבון ממתין לאישור מנהל המוסד',
    user: toUserDto(user),
  };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: userInclude,
  });

  const passwordOk = user ? await verifyPassword(input.password, user.passwordHash) : await verifyAgainstDummy(input.password);

  if (!user || !passwordOk || !user.isActive) {
    throw unauthorized('דוא״ל או סיסמה שגויים', 'INVALID_CREDENTIALS');
  }
  if (user.approvalStatus === 'PENDING') {
    throw forbidden('החשבון ממתין לאישור מנהל המוסד', 'ACCOUNT_PENDING');
  }
  if (user.approvalStatus === 'REJECTED') {
    throw forbidden('בקשת ההרשמה נדחתה. לפרטים יש לפנות למנהל המוסד', 'ACCOUNT_REJECTED');
  }

  return {
    token: signAccessToken(user),
    user: toUserDto(user),
  };
}

export async function getMe(userId: number) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, include: userInclude });
  return { user: toUserDto(user) };
}

/** התלמיד מעדכן את התחומים שהוא מחפש בהם עבודה. הרשימה שנשלחת מחליפה את הקודמת */
export async function updateMyJobRoles(actor: AuthUser, input: UpdateMyJobRolesInput) {
  if (actor.role !== 'STUDENT') {
    throw forbidden('רק תלמידים בוחרים תחומים מבוקשים');
  }
  await validateActiveJobRoleIds(actor.institutionId, input.jobRoleIds);

  await prisma.$transaction([
    prisma.studentJobRole.deleteMany({ where: { userId: actor.id } }),
    prisma.studentJobRole.createMany({ data: input.jobRoleIds.map((jobRoleId) => ({ userId: actor.id, jobRoleId })) }),
  ]);

  return getMe(actor.id);
}
