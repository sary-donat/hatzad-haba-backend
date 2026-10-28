/**
 * Seed — הכנסת נתונים התחלתיים למסד הנתונים.
 *
 * 1. סטטוסים בסיסיים — תמיד (בטוח להרצה חוזרת).
 * 2. מנהל ראשי — רק אם הוגדרו SUPER_ADMIN_EMAIL ו־SUPER_ADMIN_PASSWORD, ורק אם עדיין אין מנהל ראשי.
 * 3. נתוני הדגמה — בסביבת פיתוח כברירת מחדל. ב־Production רק אם SEED_DEMO_DATA=true
 *    ו־DEMO_PASSWORD הוגדר, כך שאין חשבונות עם סיסמה קבועה וידועה לציבור.
 *
 * הרצה: npm run db:seed (פיתוח) או npm run db:seed:prod (אחרי build)
 */
import type { InterestLevel, PrismaClient } from '@prisma/client';
import { hashPassword } from '../auth/password';
import { env } from '../config/env';
import { addDays, formatDateOnly, todayDate } from '../utils/dates';
import { emailSchema, passwordSchema } from '../validation/common.schemas';
import { prisma } from './prisma';

export const BASE_STATUSES = [
  { name: 'נשלחו קורות חיים', isFinal: false, suggestedAction: 'לבצע מעקב אחרי קורות החיים', suggestedDays: 7, sortOrder: 10 },
  { name: 'שיחת היכרות', isFinal: false, suggestedAction: 'לשלוח תודה ולברר מה השלב הבא', suggestedDays: 2, sortOrder: 20 },
  { name: 'נקבע ראיון', isFinal: false, suggestedAction: 'להתכונן לראיון', suggestedDays: 1, sortOrder: 30 },
  { name: 'תרגיל בית', isFinal: false, suggestedAction: 'להגיש את תרגיל הבית', suggestedDays: 3, sortOrder: 40 },
  { name: 'ממתינה לתשובה', isFinal: false, suggestedAction: 'לבדוק אם התקבלה תשובה', suggestedDays: 5, sortOrder: 50 },
  { name: 'התקבלה הצעה', isFinal: true, suggestedAction: 'לענות על ההצעה', suggestedDays: 3, sortOrder: 60 },
  { name: 'נדחתה', isFinal: true, suggestedAction: null, suggestedDays: null, sortOrder: 70 },
  { name: 'נסגרה ביוזמת המועמד', isFinal: true, suggestedAction: null, suggestedDays: null, sortOrder: 80 },
] as const;

export const DEMO_INSTITUTION_NAME = 'מכללת אופק';

const log = (message: string) => console.log(`[seed] ${message}`);

export async function seedBaseStatuses(db: PrismaClient = prisma) {
  for (const status of BASE_STATUSES) {
    const existing = await db.applicationStatus.findFirst({ where: { institutionId: null, name: status.name } });
    if (existing) {
      await db.applicationStatus.update({ where: { id: existing.id }, data: { ...status, isActive: true } });
    } else {
      await db.applicationStatus.create({ data: { ...status, institutionId: null } });
    }
  }
  log(`סטטוסים בסיסיים: ${BASE_STATUSES.length}`);
}

async function seedSuperAdmin() {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;

  const existing = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  if (existing) {
    log('מנהל ראשי כבר קיים — לא נוצר חדש');
    return;
  }
  if (!email || !password) {
    log('לא הוגדרו SUPER_ADMIN_EMAIL ו־SUPER_ADMIN_PASSWORD — מנהל ראשי לא נוצר');
    return;
  }

  const parsedEmail = emailSchema.safeParse(email);
  const parsedPassword = passwordSchema.safeParse(password);
  if (!parsedEmail.success || !parsedPassword.success) {
    throw new Error('SUPER_ADMIN_EMAIL או SUPER_ADMIN_PASSWORD אינם תקינים (סיסמה: לפחות 8 תווים, אות וספרה)');
  }
  if (env.isProduction && password.length < 12) {
    throw new Error('ב־Production הסיסמה של המנהל הראשי צריכה להכיל לפחות 12 תווים');
  }

  await prisma.user.create({
    data: {
      fullName: process.env.SUPER_ADMIN_NAME?.trim() || 'מנהל ראשי',
      email: parsedEmail.data,
      passwordHash: await hashPassword(password),
      role: 'SUPER_ADMIN',
      institutionId: null,
      approvalStatus: 'APPROVED',
      approvedAt: new Date(),
    },
  });
  log(`נוצר מנהל ראשי: ${parsedEmail.data}`);
}

function demoPasswords() {
  const shared = process.env.DEMO_PASSWORD?.trim() || undefined;
  if (env.isProduction) {
    if (!shared || !passwordSchema.safeParse(shared).success || shared.length < 10) {
      throw new Error('ב־Production יש להגדיר DEMO_PASSWORD (לפחות 10 תווים, אות וספרה) כדי ליצור נתוני הדגמה');
    }
    return { admin: shared, student: shared };
  }
  return { admin: shared ?? 'Admin1234!', student: shared ?? 'Student1234!' };
}

async function seedDemoData() {
  const exists = await prisma.institution.findUnique({ where: { name: DEMO_INSTITUTION_NAME } });
  if (exists) {
    log('נתוני הדגמה כבר קיימים — מדלג');
    return;
  }

  const passwords = demoPasswords();
  const adminHash = await hashPassword(passwords.admin);
  const studentHash = await hashPassword(passwords.student);
  const today = todayDate();
  const day = (offset: number) => addDays(today, offset);
  const at = (offset: number, hour: number) => new Date(`${formatDateOnly(day(offset))}T${String(hour).padStart(2, '0')}:00:00+03:00`);

  const statuses = await prisma.applicationStatus.findMany({ where: { institutionId: null } });
  const status = (name: string) => {
    const found = statuses.find((s) => s.name === name);
    if (!found) throw new Error(`Missing base status ${name}`);
    return found.id;
  };

  const ofek = await prisma.institution.create({
    data: { name: DEMO_INSTITUTION_NAME, city: 'ירושלים', contactEmail: 'office@ofek.example.com' },
  });
  const nativ = await prisma.institution.create({
    data: { name: 'מרכז הכשרה נתיב', city: 'בני ברק', contactEmail: 'info@nativ.example.com' },
  });

  const approved = { approvalStatus: 'APPROVED' as const, approvedAt: new Date() };
  const ronit = await prisma.user.create({
    data: { fullName: 'רונית מנהלת', email: 'ronit@example.com', passwordHash: adminHash, role: 'INSTITUTION_ADMIN', institutionId: ofek.id, ...approved },
  });
  const yossi = await prisma.user.create({
    data: { fullName: 'יוסי רכז', email: 'yossi@example.com', passwordHash: adminHash, role: 'INSTITUTION_ADMIN', institutionId: nativ.id, ...approved },
  });
  const student = (fullName: string, email: string, institutionId: number, approvedById: number) =>
    prisma.user.create({
      data: { fullName, email, passwordHash: studentHash, role: 'STUDENT', institutionId, approvedById, ...approved },
    });
  const dana = await student('דנה כהן', 'dana@example.com', ofek.id, ronit.id);
  const yael = await student('יעל לוי', 'yael@example.com', ofek.id, ronit.id);
  const michal = await student('מיכל ברק', 'michal@example.com', nativ.id, yossi.id);
  await prisma.user.create({
    data: { fullName: 'נועה ממתינה', email: 'noa@example.com', passwordHash: studentHash, role: 'STUDENT', institutionId: ofek.id, approvalStatus: 'PENDING' },
  });

  const roles = async (institutionId: number, names: string[]) => {
    const result: Record<string, number> = {};
    for (const name of names) {
      result[name] = (await prisma.jobRole.create({ data: { institutionId, name } })).id;
    }
    return result;
  };
  const ofekRoles = await roles(ofek.id, ['תכנות', 'בדיקות תוכנה', 'ניתוח מערכות']);
  const nativRoles = await roles(nativ.id, ['הוראה', 'גרפיקה', 'הנהלת חשבונות']);

  // התחומים שכל תלמידה מחפשת בהם עבודה
  const desired: [number, number][] = [
    [dana.id, ofekRoles['תכנות']!],
    [yael.id, ofekRoles['תכנות']!],
    [yael.id, ofekRoles['ניתוח מערכות']!],
    [michal.id, nativRoles['הוראה']!],
    [michal.id, nativRoles['גרפיקה']!],
  ];
  await prisma.studentJobRole.createMany({ data: desired.map(([userId, jobRoleId]) => ({ userId, jobRoleId })) });

  const secondInterview = await prisma.applicationStatus.create({
    data: { institutionId: ofek.id, name: 'ראיון שני', isFinal: false, suggestedAction: 'להתכונן לראיון השני', suggestedDays: 2, sortOrder: 35 },
  });

  interface DemoApp {
    userId: number;
    createdById: number;
    companyName: string;
    jobTitle: string;
    jobRoleId?: number;
    submittedOn: Date;
    statusId: number;
    interestLevel?: InterestLevel;
    jobUrl?: string;
    contactName?: string;
    jobAttractions?: string;
    pointsToClarify?: string;
    notes?: string;
    interviewAt?: Date;
    interviewLocation?: string;
    interviewPreparation?: string;
    interviewQuestions?: string;
    actions?: { title: string; dueOn: Date; done?: boolean }[];
  }

  const apps: DemoApp[] = [
    {
      userId: dana.id, createdById: dana.id, companyName: 'חברת אלפא תוכנה', jobTitle: 'מפתחת React מתחילה', jobRoleId: ofekRoles['תכנות'],
      submittedOn: day(-12), statusId: status('נקבע ראיון'), interestLevel: 'HIGH', jobUrl: 'https://example.com/jobs/alpha-react',
      contactName: 'משה לוי', jobAttractions: 'צוות קטן, הרבה למידה', pointsToClarify: 'האם אפשר לעבוד יום בשבוע מהבית',
      interviewAt: at(2, 10), interviewLocation: 'רחוב הדוגמה 1, תל אביב', interviewPreparation: 'לחזור על פרויקט הגמר ועל TypeScript',
      interviewQuestions: 'איך נראה יום עבודה? מי ילווה אותי בהתחלה?',
      actions: [
        { title: 'להתכונן לראיון', dueOn: day(1) },
        { title: 'לברר שעות עבודה ואפשרות לעבוד מהבית', dueOn: day(-1) },
        { title: 'לשלוח קורות חיים מעודכנים', dueOn: day(-10), done: true },
      ],
    },
    {
      userId: dana.id, createdById: ronit.id, companyName: 'בטא מערכות', jobTitle: 'בודקת תוכנה', jobRoleId: ofekRoles['בדיקות תוכנה'],
      submittedOn: day(-5), statusId: status('נשלחו קורות חיים'), interestLevel: 'MEDIUM', contactName: 'שרה כץ',
      actions: [{ title: 'לבצע מעקב אחרי קורות החיים', dueOn: day(0) }],
    },
    {
      userId: dana.id, createdById: dana.id, companyName: 'גמא פתרונות', jobTitle: 'מפתחת Full Stack', jobRoleId: ofekRoles['תכנות'],
      submittedOn: day(-20), statusId: status('ממתינה לתשובה'), interestLevel: 'LOW', notes: 'הגשתי תרגיל בית לפני שבועיים',
    },
    {
      userId: dana.id, createdById: dana.id, companyName: 'דלתא דיגיטל', jobTitle: 'מפתחת צד לקוח', jobRoleId: ofekRoles['תכנות'],
      submittedOn: day(-30), statusId: status('נדחתה'), interestLevel: 'MEDIUM',
    },
    {
      userId: yael.id, createdById: yael.id, companyName: 'חברת אלפא תוכנה', jobTitle: 'מפתחת .NET', jobRoleId: ofekRoles['תכנות'],
      submittedOn: day(-8), statusId: secondInterview.id, interestLevel: 'HIGH', interviewAt: at(4, 13), interviewLocation: 'https://meet.example.com/abc',
      actions: [{ title: 'להתכונן לראיון השני', dueOn: day(3) }],
    },
    {
      userId: yael.id, createdById: yael.id, companyName: 'אומגה נתונים', jobTitle: 'מנתחת מערכות', jobRoleId: ofekRoles['ניתוח מערכות'],
      submittedOn: day(-3), statusId: status('תרגיל בית'), interestLevel: 'MEDIUM',
      actions: [{ title: 'להגיש את תרגיל הבית', dueOn: day(5) }],
    },
    {
      userId: michal.id, createdById: michal.id, companyName: 'בית ספר האלון', jobTitle: 'מורה למתמטיקה', jobRoleId: nativRoles['הוראה'],
      submittedOn: day(-6), statusId: status('שיחת היכרות'), interestLevel: 'HIGH',
      actions: [{ title: 'לשלוח תודה ולברר מה השלב הבא', dueOn: day(-2) }],
    },
    {
      userId: michal.id, createdById: yossi.id, companyName: 'סטודיו קו', jobTitle: 'מעצבת גרפית', jobRoleId: nativRoles['גרפיקה'],
      submittedOn: day(-15), statusId: status('התקבלה הצעה'), interestLevel: 'MEDIUM',
      actions: [{ title: 'לענות על ההצעה', dueOn: day(2) }],
    },
  ];

  for (const { actions = [], ...data } of apps) {
    await prisma.application.create({
      data: {
        ...data,
        actions: {
          create: actions.map((action) => ({
            title: action.title,
            dueOn: action.dueOn,
            status: action.done ? 'DONE' : 'OPEN',
            completedAt: action.done ? new Date() : null,
            createdById: data.createdById,
          })),
        },
      },
    });
  }

  const betaApp = await prisma.application.findFirstOrThrow({ where: { userId: dana.id, companyName: 'בטא מערכות' } });
  await prisma.notification.create({
    data: {
      userId: dana.id,
      applicationId: betaApp.id,
      actorId: ronit.id,
      type: 'APPLICATION_CREATED',
      title: 'נוספה עבורך מועמדות',
      message: `${ronit.fullName} הוסיף/ה עבורך מועמדות לתפקיד "${betaApp.jobTitle}" בחברה "${betaApp.companyName}". סטטוס: נשלחו קורות חיים`,
      suggestedAction: 'לבצע מעקב אחרי קורות החיים',
      suggestedDueOn: day(7),
    },
  });

  log(`נתוני הדגמה נוצרו: 2 מוסדות, 2 מנהלי מוסד, 4 תלמידים (אחת ממתינה לאישור), ${apps.length} מועמדויות`);
  if (!env.isProduction && !process.env.DEMO_PASSWORD?.trim()) { 
    log('סיסמאות הדגמה: מנהלי מוסד — Admin1234!  |  תלמידים — Student1234!');
  }
}

async function main() {
  await seedBaseStatuses();
  await seedSuperAdmin();

  const demoDefault = env.isProduction ? 'false' : 'true';
  if ((process.env.SEED_DEMO_DATA ?? demoDefault) === 'true') {
    await seedDemoData();
  } else {
    log('נתוני הדגמה לא נוצרו (SEED_DEMO_DATA אינו true)');
  }
}

if (require.main === module) {
  main()
    .then(() => prisma.$disconnect())
    .catch(async (error) => {
      console.error('[seed] שגיאה:', error instanceof Error ? error.message : error);
      await prisma.$disconnect();
      process.exit(1);
    });
}
