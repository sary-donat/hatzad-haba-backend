import type {
  Action,
  Application,
  ApplicationStatus,
  Institution,
  JobRole,
  Notification,
  Prisma,
  StudentJobRole,
  User,
} from '@prisma/client';
import { formatDateOnly, formatDateOnlyOrNull } from '../utils/dates';

/**
 * ממירים את רשומות מסד הנתונים למבנה שנשלח ללקוח.
 * כאן מוודאים שלעולם לא נשלחים שדות רגישים כמו password_hash.
 */

/** מה לטעון יחד עם משתמש כדי להחזיר אותו ללקוח */
export const userInclude = {
  institution: true,
  desiredJobRoles: { include: { jobRole: true }, orderBy: { jobRole: { name: 'asc' } } },
} satisfies Prisma.UserInclude;

type UserWithRelations = User & {
  institution: Institution | null;
  desiredJobRoles: (StudentJobRole & { jobRole: JobRole })[];
};

export function toUserDto(user: UserWithRelations) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    approvalStatus: user.approvalStatus,
    isActive: user.isActive,
    institution: user.institution ? { id: user.institution.id, name: user.institution.name } : null,
    desiredJobRoles: user.desiredJobRoles.map(({ jobRole }) => ({
      id: jobRole.id,
      name: jobRole.name,
      isActive: jobRole.isActive,
    })),
    approvedAt: user.approvedAt,
    createdAt: user.createdAt,
  };
}

export function toInstitutionRef(institution: Pick<Institution, 'id' | 'name'>) {
  return { id: institution.id, name: institution.name };
}

export function toStatusDto(status: ApplicationStatus) {
  return {
    id: status.id,
    name: status.name,
    isBase: status.institutionId === null,
    institutionId: status.institutionId,
    isFinal: status.isFinal,
    suggestedAction: status.suggestedAction,
    suggestedDays: status.suggestedDays,
    sortOrder: status.sortOrder,
    isActive: status.isActive,
  };
}

export function toStatusRef(status: ApplicationStatus) {
  return { id: status.id, name: status.name, isFinal: status.isFinal };
}

export function toJobRoleDto(role: JobRole) {
  return {
    id: role.id,
    institutionId: role.institutionId,
    name: role.name,
    isActive: role.isActive,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
}

export function toActionDto(action: Action) {
  return {
    id: action.id,
    applicationId: action.applicationId,
    title: action.title,
    dueOn: formatDateOnly(action.dueOn),
    status: action.status,
    notes: action.notes,
    completedAt: action.completedAt,
    createdById: action.createdById,
    createdAt: action.createdAt,
    updatedAt: action.updatedAt,
  };
}

type UserRef = Pick<User, 'id' | 'fullName'>;

export function toUserRef(user: UserRef) {
  return { id: user.id, fullName: user.fullName };
}

export type ApplicationWithRelations = Application & {
  status: ApplicationStatus;
  jobRole: JobRole | null;
  user: UserRef;
  createdBy: UserRef;
  actions: Action[];
};

export function toApplicationDetail(app: ApplicationWithRelations) {
  return {
    id: app.id,
    user: toUserRef(app.user),
    createdBy: toUserRef(app.createdBy),
    companyName: app.companyName,
    jobTitle: app.jobTitle,
    jobRole: app.jobRole ? { id: app.jobRole.id, name: app.jobRole.name } : null,
    submittedOn: formatDateOnly(app.submittedOn),
    status: toStatusRef(app.status),
    jobUrl: app.jobUrl,
    contactName: app.contactName,
    interestLevel: app.interestLevel,
    jobAttractions: app.jobAttractions,
    pointsToClarify: app.pointsToClarify,
    notes: app.notes,
    interviewAt: app.interviewAt,
    interviewLocation: app.interviewLocation,
    interviewPreparation: app.interviewPreparation,
    interviewQuestions: app.interviewQuestions,
    actions: app.actions.map(toActionDto),
    createdAt: app.createdAt,
    updatedAt: app.updatedAt,
  };
}

/** מבנה מקוצר לרשימת מועמדויות. actions צריכות להכיל רק פעולות פתוחות, ממוינות לפי מועד */
export function toApplicationSummary(app: ApplicationWithRelations) {
  const next = app.actions[0];
  return {
    id: app.id,
    companyName: app.companyName,
    jobTitle: app.jobTitle,
    status: toStatusRef(app.status),
    jobRole: app.jobRole ? { id: app.jobRole.id, name: app.jobRole.name } : null,
    interestLevel: app.interestLevel,
    submittedOn: formatDateOnly(app.submittedOn),
    interviewAt: app.interviewAt,
    nextAction: next ? { id: next.id, title: next.title, dueOn: formatDateOnly(next.dueOn) } : null,
    openActionsCount: app.actions.length,
    user: toUserRef(app.user),
    updatedAt: app.updatedAt,
  };
}

export function toApplicationRef(app: Pick<Application, 'id' | 'companyName' | 'jobTitle'> & { user?: UserRef }) {
  return {
    id: app.id,
    companyName: app.companyName,
    jobTitle: app.jobTitle,
    ...(app.user ? { user: toUserRef(app.user) } : {}),
  };
}

export function toNotificationDto(
  notification: Notification & {
    application: Pick<Application, 'id' | 'companyName' | 'jobTitle'>;
    actor: UserRef;
  },
) {
  return {
    id: notification.id,
    type: notification.type,
    isRead: notification.isRead,
    title: notification.title,
    message: notification.message,
    suggestedAction: notification.suggestedAction,
    suggestedDueOn: formatDateOnlyOrNull(notification.suggestedDueOn),
    application: toApplicationRef(notification.application),
    actor: toUserRef(notification.actor),
    createdAt: notification.createdAt,
  };
}
