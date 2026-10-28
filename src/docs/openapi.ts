/**
 * מסמך OpenAPI 3 של השרת. משמש את Swagger UI בכתובת /api-docs,
 * ומיוצא גם לקובץ openapi.json (npm run openapi:export).
 */

type Schema = Record<string, unknown>;

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const json = (schema: Schema, example?: unknown) => ({
  'application/json': { schema, ...(example !== undefined ? { example } : {}) },
});

const ERROR_RESPONSES: Record<number, string> = {
  400: 'BadRequest',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'NotFound',
  409: 'Conflict',
};

function errors(...codes: number[]) {
  return Object.fromEntries(codes.map((code) => [code, { $ref: `#/components/responses/${ERROR_RESPONSES[code]}` }]));
}

const bearer = [{ bearerAuth: [] }];

const pathId = (description: string) => ({
  name: 'id',
  in: 'path',
  required: true,
  description,
  schema: { type: 'integer', minimum: 1 },
  example: 1,
});

const query = (name: string, schema: Schema, description: string, example?: unknown) => ({
  name,
  in: 'query',
  required: false,
  description,
  schema,
  ...(example !== undefined ? { example } : {}),
});

const boolQuery = (name: string, description: string) => query(name, { type: 'string', enum: ['true', 'false'] }, description);

const pageQueries = [
  query('page', { type: 'integer', minimum: 1, default: 1 }, 'מספר העמוד'),
  query('pageSize', { type: 'integer', minimum: 1, maximum: 100, default: 20 }, 'כמה פריטים בעמוד'),
];

const pageOf = (item: string) => ({
  type: 'object',
  required: ['items', 'page', 'pageSize', 'total', 'totalPages'],
  properties: {
    items: { type: 'array', items: ref(item) },
    page: { type: 'integer', example: 1 },
    pageSize: { type: 'integer', example: 20 },
    total: { type: 'integer', example: 1 },
    totalPages: { type: 'integer', example: 1 },
  },
});

const roles = (text: string) => `\n\n**הרשאה:** ${text}`;

// ===== דוגמאות =====

const exInstitution = { id: 1, name: 'מכללת אופק' };
const exUser = {
  id: 3,
  fullName: 'דנה כהן',
  email: 'dana@example.com',
  role: 'STUDENT',
  approvalStatus: 'APPROVED',
  isActive: true,
  institution: exInstitution,
  desiredJobRoles: [{ id: 1, name: 'תכנות', isActive: true }],
  approvedAt: '2026-10-01T08:00:00.000Z',
  createdAt: '2026-10-01T07:00:00.000Z',
};
const exStatus = {
  id: 3,
  name: 'נקבע ראיון',
  isBase: true,
  institutionId: null,
  isFinal: false,
  suggestedAction: 'להתכונן לראיון',
  suggestedDays: 1,
  sortOrder: 30,
  isActive: true,
};
const exAction = {
  id: 12,
  applicationId: 101,
  title: 'להתכונן לראיון',
  dueOn: '2026-10-20',
  status: 'OPEN',
  notes: null,
  completedAt: null,
  createdById: 3,
  createdAt: '2026-10-19T08:00:00.000Z',
  updatedAt: '2026-10-19T08:00:00.000Z',
};
const exApplicationDetail = {
  id: 101,
  user: { id: 3, fullName: 'דנה כהן' },
  createdBy: { id: 3, fullName: 'דנה כהן' },
  companyName: 'חברה א׳',
  jobTitle: 'מפתח React מתחיל',
  jobRole: { id: 1, name: 'תכנות' },
  submittedOn: '2026-10-01',
  status: { id: 3, name: 'נקבע ראיון', isFinal: false },
  jobUrl: 'https://example.com/jobs/1',
  contactName: 'משה לוי',
  interestLevel: 'HIGH',
  jobAttractions: 'צוות קטן ואפשרויות למידה',
  pointsToClarify: 'האם יש עבודה מהבית',
  notes: null,
  interviewAt: '2026-10-21T07:00:00.000Z',
  interviewLocation: 'רחוב הדוגמה 1, תל אביב',
  interviewPreparation: 'לחזור על פרויקט הגמר',
  interviewQuestions: 'איך נראה יום עבודה?',
  actions: [exAction],
  createdAt: '2026-10-01T08:00:00.000Z',
  updatedAt: '2026-10-19T08:00:00.000Z',
};
const exApplicationSummary = {
  id: 101,
  companyName: 'חברה א׳',
  jobTitle: 'מפתח React מתחיל',
  status: { id: 3, name: 'נקבע ראיון', isFinal: false },
  jobRole: { id: 1, name: 'תכנות' },
  interestLevel: 'HIGH',
  submittedOn: '2026-10-01',
  interviewAt: '2026-10-21T07:00:00.000Z',
  nextAction: { id: 12, title: 'להתכונן לראיון', dueOn: '2026-10-20' },
  openActionsCount: 1,
  user: { id: 3, fullName: 'דנה כהן' },
  updatedAt: '2026-10-19T08:00:00.000Z',
};
const exNotification = {
  id: 5,
  type: 'STATUS_CHANGED',
  isRead: false,
  title: 'עדכון במועמדות שלך',
  message: 'רונית מנהלת עדכן/ה את המועמדות שלך לתפקיד "מפתח React מתחיל" בחברה "חברה א׳". סטטוס חדש: נקבע ראיון',
  suggestedAction: 'להתכונן לראיון',
  suggestedDueOn: '2026-10-20',
  application: { id: 101, companyName: 'חברה א׳', jobTitle: 'מפתח React מתחיל' },
  actor: { id: 2, fullName: 'רונית מנהלת' },
  createdAt: '2026-10-19T08:00:00.000Z',
};

// ===== סכמות =====

const nullableString = (maxLength: number, example?: string) => ({
  type: 'string',
  nullable: true,
  maxLength,
  ...(example ? { example } : {}),
});

const applicationInputProps: Record<string, Schema> = {
  companyName: { type: 'string', minLength: 1, maxLength: 120, example: 'חברה א׳' },
  jobTitle: { type: 'string', minLength: 1, maxLength: 120, example: 'מפתח React מתחיל' },
  submittedOn: { type: 'string', format: 'date', example: '2026-10-01', description: 'לא יכול להיות בעתיד' },
  statusId: { type: 'integer', example: 1, description: 'סטטוס פעיל — בסיסי או של המוסד' },
  jobRoleId: { type: 'integer', nullable: true, example: 1, description: 'תחום תפקיד פעיל של המוסד' },
  jobUrl: { ...nullableString(500, 'https://example.com/jobs/1'), description: 'מתחיל ב־http:// או https://' },
  contactName: nullableString(100, 'משה לוי'),
  interestLevel: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'], nullable: true, example: 'HIGH' },
  jobAttractions: nullableString(2000, 'צוות קטן ואפשרויות למידה'),
  pointsToClarify: nullableString(2000, 'האם יש עבודה מהבית'),
  notes: nullableString(5000),
  interviewAt: { type: 'string', format: 'date-time', nullable: true, example: '2026-10-21T10:00:00+03:00' },
  interviewLocation: nullableString(300, 'רחוב הדוגמה 1, תל אביב'),
  interviewPreparation: nullableString(5000),
  interviewQuestions: nullableString(5000),
};

const schemas: Record<string, Schema> = {
  Error: {
    type: 'object',
    required: ['error'],
    properties: {
      error: {
        type: 'object',
        required: ['code', 'message'],
        properties: {
          code: { type: 'string', example: 'VALIDATION_ERROR' },
          message: { type: 'string', example: 'הנתונים שנשלחו אינם תקינים' },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: { field: { type: 'string', example: 'companyName' }, message: { type: 'string', example: 'שדה חובה' } },
            },
          },
        },
      },
    },
  },
  Role: { type: 'string', enum: ['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'STUDENT'] },
  ApprovalStatus: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'] },
  InterestLevel: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'], description: 'נמוכה / בינונית / גבוהה' },
  Ref: {
    type: 'object',
    properties: { id: { type: 'integer', example: 1 }, name: { type: 'string', example: 'מכללת אופק' } },
  },
  UserRef: {
    type: 'object',
    properties: { id: { type: 'integer', example: 3 }, fullName: { type: 'string', example: 'דנה כהן' } },
  },
  StatusRef: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 3 },
      name: { type: 'string', example: 'נקבע ראיון' },
      isFinal: { type: 'boolean', example: false },
    },
  },
  ApplicationRef: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 101 },
      companyName: { type: 'string', example: 'חברה א׳' },
      jobTitle: { type: 'string', example: 'מפתח React מתחיל' },
      user: ref('UserRef'),
    },
  },
  User: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      fullName: { type: 'string' },
      email: { type: 'string', format: 'email' },
      role: ref('Role'),
      approvalStatus: ref('ApprovalStatus'),
      isActive: { type: 'boolean' },
      institution: { allOf: [ref('Ref')], nullable: true },
      desiredJobRoles: {
        type: 'array',
        description: 'התחומים שהתלמיד מחפש בהם עבודה (למנהלים — מערך ריק)',
        items: {
          type: 'object',
          properties: { id: { type: 'integer' }, name: { type: 'string' }, isActive: { type: 'boolean' } },
        },
      },
      approvedAt: { type: 'string', format: 'date-time', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
    },
    example: exUser,
  },
  Institution: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      name: { type: 'string' },
      city: { type: 'string', nullable: true },
      contactEmail: { type: 'string', format: 'email', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
    example: {
      ...exInstitution,
      city: 'ירושלים',
      contactEmail: 'office@ofek.example.com',
      createdAt: '2026-09-01T08:00:00.000Z',
      updatedAt: '2026-09-01T08:00:00.000Z',
    },
  },
  PublicInstitution: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      name: { type: 'string', example: 'מכללת אופק' },
      city: { type: 'string', nullable: true, example: 'ירושלים' },
    },
  },
  InstitutionWithCounts: {
    allOf: [
      ref('Institution'),
      { type: 'object', properties: { adminsCount: { type: 'integer', example: 1 }, studentsCount: { type: 'integer', example: 12 } } },
    ],
  },
  JobRole: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      institutionId: { type: 'integer' },
      name: { type: 'string' },
      isActive: { type: 'boolean' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
    example: { id: 1, institutionId: 1, name: 'תכנות', isActive: true, createdAt: '2026-09-01T08:00:00.000Z', updatedAt: '2026-09-01T08:00:00.000Z' },
  },
  Status: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      name: { type: 'string' },
      isBase: { type: 'boolean', description: 'true = סטטוס בסיסי שאי אפשר לשנות' },
      institutionId: { type: 'integer', nullable: true },
      isFinal: { type: 'boolean', description: 'האם הסטטוס מסיים את התהליך' },
      suggestedAction: { type: 'string', nullable: true },
      suggestedDays: { type: 'integer', nullable: true },
      sortOrder: { type: 'integer' },
      isActive: { type: 'boolean' },
    },
    example: exStatus,
  },
  Suggestion: {
    type: 'object',
    nullable: true,
    description: 'צעד הבא מוצע לפי הסטטוס. השרת אינו יוצר את הפעולה — הלקוח שולח POST אם המשתמש מאשר',
    properties: { title: { type: 'string', example: 'להתכונן לראיון' }, dueOn: { type: 'string', format: 'date', example: '2026-10-20' } },
  },
  Action: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      applicationId: { type: 'integer' },
      title: { type: 'string' },
      dueOn: { type: 'string', format: 'date' },
      status: { type: 'string', enum: ['OPEN', 'DONE'] },
      notes: { type: 'string', nullable: true },
      completedAt: { type: 'string', format: 'date-time', nullable: true },
      createdById: { type: 'integer' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
    example: exAction,
  },
  ActionWithApplication: {
    allOf: [ref('Action'), { type: 'object', properties: { application: ref('ApplicationRef') } }],
  },
  ApplicationSummary: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      companyName: { type: 'string' },
      jobTitle: { type: 'string' },
      status: ref('StatusRef'),
      jobRole: { allOf: [ref('Ref')], nullable: true },
      interestLevel: { allOf: [ref('InterestLevel')], nullable: true },
      submittedOn: { type: 'string', format: 'date' },
      interviewAt: { type: 'string', format: 'date-time', nullable: true },
      nextAction: {
        type: 'object',
        nullable: true,
        description: 'הפעולה הפתוחה הקרובה ביותר',
        properties: { id: { type: 'integer' }, title: { type: 'string' }, dueOn: { type: 'string', format: 'date' } },
      },
      openActionsCount: { type: 'integer' },
      user: ref('UserRef'),
      updatedAt: { type: 'string', format: 'date-time' },
    },
    example: exApplicationSummary,
  },
  ApplicationDetail: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      user: ref('UserRef'),
      createdBy: ref('UserRef'),
      ...applicationInputProps,
      jobRole: { allOf: [ref('Ref')], nullable: true },
      status: ref('StatusRef'),
      actions: { type: 'array', items: ref('Action') },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
    example: exApplicationDetail,
  },
  Notification: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      type: { type: 'string', enum: ['APPLICATION_CREATED', 'STATUS_CHANGED', 'ACTION_ADDED'] },
      isRead: { type: 'boolean' },
      title: { type: 'string' },
      message: { type: 'string' },
      suggestedAction: { type: 'string', nullable: true },
      suggestedDueOn: { type: 'string', format: 'date', nullable: true },
      application: ref('ApplicationRef'),
      actor: ref('UserRef'),
      createdAt: { type: 'string', format: 'date-time' },
    },
    example: exNotification,
  },
  AuthResponse: {
    type: 'object',
    properties: { token: { type: 'string', description: 'JWT Access Token' }, user: ref('User') },
    example: { token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', user: exUser },
  },
  RegisterRequest: {
    type: 'object',
    required: ['fullName', 'email', 'password', 'institutionId'],
    properties: {
      fullName: { type: 'string', minLength: 2, maxLength: 100, example: 'נועה ישראלי' },
      email: { type: 'string', format: 'email', example: 'noa@example.com' },
      password: { type: 'string', minLength: 8, maxLength: 72, description: 'לפחות 8 תווים, אות אחת וספרה אחת', example: 'Noa12345!' },
      institutionId: { type: 'integer', example: 1 },
      jobRoleIds: {
        type: 'array',
        items: { type: 'integer' },
        maxItems: 20,
        description: 'רשות: התחומים שהתלמיד מחפש בהם עבודה, מתוך GET /api/institutions/{id}/job-roles',
        example: [1, 2],
      },
    },
  },
  UpdateMyJobRolesRequest: {
    type: 'object',
    required: ['jobRoleIds'],
    properties: {
      jobRoleIds: {
        type: 'array',
        items: { type: 'integer' },
        maxItems: 20,
        description: 'הרשימה המלאה של התחומים — מחליפה את הקודמת. מערך ריק מוחק את כולם',
        example: [1, 3],
      },
    },
  },
  LoginRequest: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email', example: 'dana@example.com' },
      password: { type: 'string', example: 'Student1234!' },
    },
  },
  CreateInstitutionRequest: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 100, example: 'מכללת אופק' },
      city: { type: 'string', nullable: true, maxLength: 80, example: 'ירושלים' },
      contactEmail: { type: 'string', format: 'email', nullable: true, maxLength: 255, example: 'office@ofek.example.com' },
    },
  },
  UpdateInstitutionRequest: {
    type: 'object',
    minProperties: 1,
    description: 'עדכון חלקי — שולחים רק את השדות שהשתנו. ערך null מוחק עיר או דוא״ל',
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 100, example: 'מכללת אופק' },
      city: { type: 'string', nullable: true, maxLength: 80, example: 'ירושלים' },
      contactEmail: { type: 'string', format: 'email', nullable: true, maxLength: 255, example: 'office@ofek.example.com' },
    },
  },
  CreateUserRequest: {
    type: 'object',
    required: ['fullName', 'email', 'password', 'institutionId'],
    properties: {
      fullName: { type: 'string', minLength: 2, maxLength: 100, example: 'רונית מנהלת' },
      email: { type: 'string', format: 'email', example: 'ronit@example.com' },
      password: { type: 'string', minLength: 8, example: 'Ronit1234!' },
      role: { type: 'string', enum: ['INSTITUTION_ADMIN', 'STUDENT'], default: 'INSTITUTION_ADMIN' },
      institutionId: { type: 'integer', example: 1 },
    },
  },
  UpdateUserRequest: {
    type: 'object',
    minProperties: 1,
    properties: {
      fullName: { type: 'string', minLength: 2, maxLength: 100, example: 'דנה כהן-לוי' },
      isActive: { type: 'boolean', example: false },
    },
  },
  CreateJobRoleRequest: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 80, example: 'תכנות' },
      institutionId: { type: 'integer', description: 'חובה למנהל ראשי בלבד', example: 1 },
    },
  },
  UpdateJobRoleRequest: {
    type: 'object',
    minProperties: 1,
    properties: { name: { type: 'string', minLength: 2, maxLength: 80, example: 'פיתוח תוכנה' }, isActive: { type: 'boolean', example: false } },
  },
  CreateStatusRequest: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 60, example: 'ראיון שני' },
      isFinal: { type: 'boolean', default: false },
      suggestedAction: { type: 'string', nullable: true, maxLength: 200, example: 'להתכונן לראיון השני' },
      suggestedDays: { type: 'integer', nullable: true, minimum: 0, maximum: 60, example: 1, description: 'ברירת מחדל 3 כשיש צעד מוצע' },
      sortOrder: { type: 'integer', minimum: 0, default: 100, example: 35 },
      institutionId: { type: 'integer', description: 'חובה למנהל ראשי בלבד', example: 1 },
    },
  },
  UpdateStatusRequest: {
    type: 'object',
    minProperties: 1,
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 60 },
      isFinal: { type: 'boolean' },
      suggestedAction: { type: 'string', nullable: true, maxLength: 200 },
      suggestedDays: { type: 'integer', nullable: true, minimum: 0, maximum: 60 },
      sortOrder: { type: 'integer', minimum: 0 },
      isActive: { type: 'boolean', example: false },
    },
  },
  CreateApplicationRequest: {
    type: 'object',
    required: ['companyName', 'jobTitle', 'submittedOn', 'statusId'],
    properties: {
      ...applicationInputProps,
      userId: { type: 'integer', description: 'חובה למנהלים: התלמיד שעבורו נוצרת המועמדות. תלמיד אינו שולח שדה זה', example: 3 },
    },
  },
  UpdateApplicationRequest: {
    type: 'object',
    minProperties: 1,
    description: 'עדכון חלקי — שולחים רק את השדות שהשתנו. ערך null מוחק שדה רשות',
    properties: applicationInputProps,
  },
  CreateActionRequest: {
    type: 'object',
    required: ['title', 'dueOn'],
    properties: {
      title: { type: 'string', minLength: 1, maxLength: 200, example: 'להתכונן לראיון' },
      dueOn: { type: 'string', format: 'date', example: '2026-10-20' },
      notes: { type: 'string', nullable: true, maxLength: 2000 },
    },
  },
  UpdateActionRequest: {
    type: 'object',
    minProperties: 1,
    properties: {
      title: { type: 'string', minLength: 1, maxLength: 200 },
      dueOn: { type: 'string', format: 'date' },
      notes: { type: 'string', nullable: true, maxLength: 2000 },
      status: { type: 'string', enum: ['OPEN', 'DONE'], example: 'DONE' },
    },
  },
  Dashboard: {
    type: 'object',
    properties: {
      today: { type: 'string', format: 'date', description: 'התאריך של היום לפי שעון ישראל' },
      overdue: { type: 'array', items: ref('ActionWithApplication'), description: 'פעולות פתוחות שתאריך היעד שלהן עבר' },
      dueToday: { type: 'array', items: ref('ActionWithApplication') },
      upcoming: { type: 'array', items: ref('ActionWithApplication'), description: '7 הימים הקרובים' },
      upcomingInterviews: {
        type: 'array',
        items: {
          allOf: [
            ref('ApplicationRef'),
            {
              type: 'object',
              properties: { interviewAt: { type: 'string', format: 'date-time' }, interviewLocation: { type: 'string', nullable: true } },
            },
          ],
        },
      },
      needsNextStep: {
        type: 'array',
        description: 'מועמדויות פתוחות שאין להן אף פעולה פתוחה',
        items: {
          allOf: [
            ref('ApplicationRef'),
            { type: 'object', properties: { status: ref('StatusRef'), updatedAt: { type: 'string', format: 'date-time' } } },
          ],
        },
      },
      unreadNotifications: { type: 'integer' },
    },
  },
};

// ===== נתיבים =====

const paths: Record<string, Record<string, Schema>> = {
  '/api/health': {
    get: {
      tags: ['כללי'],
      summary: 'בדיקת בריאות השרת',
      description: 'בודק שהשרת פועל ושיש חיבור למסד הנתונים.' + roles('ציבורי'),
      security: [],
      responses: {
        200: {
          description: 'השרת ומסד הנתונים תקינים',
          content: json({ type: 'object' }, { status: 'ok', database: 'ok', uptimeSeconds: 120, responseMs: 3, time: '2026-10-19T08:00:00.000Z' }),
        },
        503: { description: 'אין חיבור למסד הנתונים', content: json({ type: 'object' }, { status: 'error', database: 'unavailable' }) },
      },
    },
  },

  '/api/auth/register': {
    post: {
      tags: ['התחברות'],
      summary: 'הרשמת תלמיד',
      description: 'יוצר חשבון תלמיד במוסד שנבחר. החשבון ממתין לאישור מנהל המוסד, ולכן לא מוחזר Token.' + roles('ציבורי'),
      security: [],
      requestBody: { required: true, content: json(ref('RegisterRequest')) },
      responses: {
        201: {
          description: 'ההרשמה התקבלה',
          content: json(
            { type: 'object', properties: { message: { type: 'string' }, user: ref('User') } },
            { message: 'ההרשמה התקבלה. החשבון ממתין לאישור מנהל המוסד', user: { ...exUser, id: 7, fullName: 'נועה ישראלי', email: 'noa@example.com', approvalStatus: 'PENDING', approvedAt: null } },
          ),
        },
        ...errors(400, 404, 409),
      },
    },
  },

  '/api/auth/login': {
    post: {
      tags: ['התחברות'],
      summary: 'כניסה למערכת',
      description:
        'מחזיר JWT. כדי להשתמש בו ב־Swagger: מעתיקים את הערך token, לוחצים על Authorize ומדביקים אותו.' +
        roles('ציבורי') +
        '\n\n403 מוחזר עם קוד ACCOUNT_PENDING כשהחשבון ממתין לאישור, או ACCOUNT_REJECTED כשההרשמה נדחתה.',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: ref('LoginRequest'),
            examples: {
              student: { summary: 'תלמידה — נתוני הדגמה מקומיים (בענן: הסיסמה מ־DEMO_PASSWORD)', value: { email: 'dana@example.com', password: 'Student1234!' } },
              institutionAdmin: { summary: 'מנהלת מוסד — נתוני הדגמה מקומיים (בענן: הסיסמה מ־DEMO_PASSWORD)', value: { email: 'ronit@example.com', password: 'Admin1234!' } },
              superAdmin: { summary: 'מנהל ראשי — הפרטים שהוגדרו ב־SUPER_ADMIN_EMAIL ו־SUPER_ADMIN_PASSWORD', value: { email: 'super@example.com', password: 'הסיסמה-שהגדרתם' } },
            },
          },
        },
      },
      responses: { 200: { description: 'התחברות הצליחה', content: json(ref('AuthResponse')) }, ...errors(400, 401, 403) },
    },
  },

  '/api/auth/me': {
    get: {
      tags: ['התחברות'],
      summary: 'פרטי המשתמש המחובר',
      description: 'מחזיר את המשתמש לפי ה־Token.' + roles('כל משתמש מחובר'),
      security: bearer,
      responses: {
        200: { description: 'פרטי המשתמש', content: json({ type: 'object', properties: { user: ref('User') } }, { user: exUser }) },
        ...errors(401),
      },
    },
  },

  '/api/auth/me/job-roles': {
    put: {
      tags: ['התחברות'],
      summary: 'עדכון התחומים שאני מחפש בהם עבודה',
      description:
        'שולחים את כל רשימת התחומים — היא מחליפה את הקודמת. רק תחומים פעילים של המוסד שלי.' + roles('תלמיד בלבד'),
      security: bearer,
      requestBody: { required: true, content: json(ref('UpdateMyJobRolesRequest')) },
      responses: {
        200: { description: 'עודכן', content: json({ type: 'object', properties: { user: ref('User') } }, { user: exUser }) },
        ...errors(400, 401, 403),
      },
    },
  },

  '/api/institutions/{id}/job-roles': {
    get: {
      tags: ['מוסדות'],
      summary: 'תחומי התפקיד הפעילים של מוסד (לטופס ההרשמה)',
      description: 'מזהה ושם בלבד.' + roles('ציבורי'),
      security: [],
      parameters: [pathId('מזהה המוסד')],
      responses: {
        200: {
          description: 'רשימת תחומי תפקיד',
          content: json({ type: 'object', properties: { items: { type: 'array', items: ref('Ref') } } }, { items: [{ id: 1, name: 'תכנות' }] }),
        },
        ...errors(400, 404),
      },
    },
  },

  '/api/institutions/public': {
    get: {
      tags: ['מוסדות'],
      summary: 'רשימת מוסדות לטופס ההרשמה',
      description: 'מזהה, שם ועיר בלבד.' + roles('ציבורי'),
      security: [],
      parameters: [query('search', { type: 'string' }, 'חיפוש לפי שם המוסד או העיר', 'אופק')],
      responses: {
        200: {
          description: 'רשימת מוסדות',
          content: json(
            { type: 'object', properties: { items: { type: 'array', items: ref('PublicInstitution') } } },
            { items: [{ ...exInstitution, city: 'ירושלים' }] },
          ),
        },
        ...errors(400),
      },
    },
  },

  '/api/institutions': {
    get: {
      tags: ['מוסדות'],
      summary: 'רשימת מוסדות עם מספר משתמשים',
      description: roles('מנהל ראשי'),
      security: bearer,
      parameters: [query('search', { type: 'string' }, 'חיפוש לפי שם או עיר')],
      responses: {
        200: { description: 'רשימת מוסדות', content: json({ type: 'object', properties: { items: { type: 'array', items: ref('InstitutionWithCounts') } } }) },
        ...errors(400, 401, 403),
      },
    },
    post: {
      tags: ['מוסדות'],
      summary: 'יצירת מוסד',
      description: 'השם חובה. עיר ודוא״ל ליצירת קשר — רשות.' + roles('מנהל ראשי'),
      security: bearer,
      requestBody: { required: true, content: json(ref('CreateInstitutionRequest')) },
      responses: {
        201: { description: 'המוסד נוצר', content: json({ type: 'object', properties: { institution: ref('Institution') } }) },
        ...errors(400, 401, 403, 409),
      },
    },
  },

  '/api/institutions/{id}': {
    patch: {
      tags: ['מוסדות'],
      summary: 'עריכת פרטי מוסד',
      description: 'עדכון שם, עיר או דוא״ל ליצירת קשר.' + roles('מנהל ראשי'),
      security: bearer,
      parameters: [pathId('מזהה המוסד')],
      requestBody: { required: true, content: json(ref('UpdateInstitutionRequest')) },
      responses: {
        200: { description: 'המוסד עודכן', content: json({ type: 'object', properties: { institution: ref('Institution') } }) },
        ...errors(400, 401, 403, 404, 409),
      },
    },
  },

  '/api/users': {
    get: {
      tags: ['משתמשים'],
      summary: 'רשימת משתמשים',
      description: 'מנהל מוסד רואה רק את התלמידים של המוסד שלו. מנהל ראשי רואה את כולם.' + roles('מנהל מוסד, מנהל ראשי'),
      security: bearer,
      parameters: [
        query('search', { type: 'string' }, 'חיפוש לפי שם או דוא״ל'),
        query('role', ref('Role'), 'סינון לפי תפקיד'),
        query('institutionId', { type: 'integer' }, 'סינון לפי מוסד'),
        boolQuery('isActive', 'סינון לפי פעיל / מושבת'),
        query('approvalStatus', ref('ApprovalStatus'), 'למשל PENDING — תלמידים שממתינים לאישור', 'PENDING'),
        query('jobRoleId', { type: 'integer' }, 'תלמידים שמחפשים עבודה בתחום הזה'),
        ...pageQueries,
      ],
      responses: { 200: { description: 'רשימת משתמשים', content: json(pageOf('User')) }, ...errors(400, 401, 403) },
    },
    post: {
      tags: ['משתמשים'],
      summary: 'יצירת מנהל מוסד (או תלמיד)',
      description: 'החשבון נוצר מאושר ופעיל. אי אפשר ליצור מנהל ראשי נוסף.' + roles('מנהל ראשי'),
      security: bearer,
      requestBody: { required: true, content: json(ref('CreateUserRequest')) },
      responses: {
        201: { description: 'המשתמש נוצר', content: json({ type: 'object', properties: { user: ref('User') } }) },
        ...errors(400, 401, 403, 404, 409),
      },
    },
  },

  '/api/users/{id}': {
    get: {
      tags: ['משתמשים'],
      summary: 'פרטי משתמש',
      description: roles('מנהל מוסד (תלמידי המוסד), מנהל ראשי'),
      security: bearer,
      parameters: [pathId('מזהה המשתמש')],
      responses: {
        200: { description: 'פרטי המשתמש', content: json({ type: 'object', properties: { user: ref('User') } }) },
        ...errors(400, 401, 403, 404),
      },
    },
    patch: {
      tags: ['משתמשים'],
      summary: 'עדכון שם, השבתה או הפעלה',
      description: 'משתמש מושבת אינו יכול להתחבר, וה־Token שלו מפסיק לעבוד מיד. אי אפשר להשבית את עצמך.' + roles('מנהל מוסד (תלמידי המוסד), מנהל ראשי'),
      security: bearer,
      parameters: [pathId('מזהה המשתמש')],
      requestBody: { required: true, content: json(ref('UpdateUserRequest')) },
      responses: {
        200: { description: 'המשתמש עודכן', content: json({ type: 'object', properties: { user: ref('User') } }) },
        ...errors(400, 401, 403, 404),
      },
    },
  },

  '/api/users/{id}/approve': {
    patch: {
      tags: ['משתמשים'],
      summary: 'אישור תלמיד שנרשם',
      description: roles('מנהל מוסד (תלמידי המוסד), מנהל ראשי'),
      security: bearer,
      parameters: [pathId('מזהה התלמיד')],
      responses: {
        200: { description: 'התלמיד אושר', content: json({ type: 'object', properties: { user: ref('User') } }) },
        ...errors(400, 401, 403, 404, 409),
      },
    },
  },

  '/api/users/{id}/reject': {
    patch: {
      tags: ['משתמשים'],
      summary: 'דחיית תלמיד שנרשם',
      description: 'אפשר לדחות רק תלמיד שממתין לאישור.' + roles('מנהל מוסד (תלמידי המוסד), מנהל ראשי'),
      security: bearer,
      parameters: [pathId('מזהה התלמיד')],
      responses: {
        200: { description: 'ההרשמה נדחתה', content: json({ type: 'object', properties: { user: ref('User') } }) },
        ...errors(400, 401, 403, 404, 409),
      },
    },
  },

  '/api/job-roles': {
    get: {
      tags: ['תחומי תפקיד'],
      summary: 'תחומי התפקיד של המוסד',
      description: 'תלמיד רואה רק תחומים פעילים. מנהל ראשי חייב לשלוח institutionId.' + roles('כל משתמש מחובר'),
      security: bearer,
      parameters: [
        boolQuery('includeInactive', 'למנהלים: לכלול גם תחומים לא פעילים'),
        query('institutionId', { type: 'integer' }, 'למנהל ראשי — חובה'),
      ],
      responses: {
        200: { description: 'רשימת תחומי תפקיד', content: json({ type: 'object', properties: { items: { type: 'array', items: ref('JobRole') } } }) },
        ...errors(400, 401, 403),
      },
    },
    post: {
      tags: ['תחומי תפקיד'],
      summary: 'יצירת תחום תפקיד',
      description: roles('מנהל מוסד (במוסד שלו), מנהל ראשי'),
      security: bearer,
      requestBody: { required: true, content: json(ref('CreateJobRoleRequest')) },
      responses: {
        201: { description: 'נוצר', content: json({ type: 'object', properties: { jobRole: ref('JobRole') } }) },
        ...errors(400, 401, 403, 404, 409),
      },
    },
  },

  '/api/job-roles/{id}': {
    patch: {
      tags: ['תחומי תפקיד'],
      summary: 'עריכת תחום תפקיד או הפיכתו ללא פעיל',
      description: 'לא מוחקים תחום תפקיד — הופכים אותו ללא פעיל, כך שהמועמדויות הקיימות נשמרות.' + roles('מנהל מוסד (במוסד שלו), מנהל ראשי'),
      security: bearer,
      parameters: [pathId('מזהה תחום התפקיד')],
      requestBody: { required: true, content: json(ref('UpdateJobRoleRequest')) },
      responses: {
        200: { description: 'עודכן', content: json({ type: 'object', properties: { jobRole: ref('JobRole') } }) },
        ...errors(400, 401, 403, 404, 409),
      },
    },
  },

  '/api/statuses': {
    get: {
      tags: ['סטטוסים'],
      summary: 'סטטוסים בסיסיים + סטטוסים של המוסד',
      description: 'ממוינים לפי sortOrder. תלמיד רואה רק סטטוסים פעילים.' + roles('כל משתמש מחובר'),
      security: bearer,
      parameters: [
        boolQuery('includeInactive', 'למנהלים: לכלול גם סטטוסים לא פעילים'),
        query('institutionId', { type: 'integer' }, 'למנהל ראשי: להציג גם את הסטטוסים של מוסד מסוים'),
      ],
      responses: {
        200: { description: 'רשימת סטטוסים', content: json({ type: 'object', properties: { items: { type: 'array', items: ref('Status') } } }) },
        ...errors(400, 401, 403),
      },
    },
    post: {
      tags: ['סטטוסים'],
      summary: 'יצירת סטטוס למוסד',
      description: roles('מנהל מוסד (במוסד שלו), מנהל ראשי'),
      security: bearer,
      requestBody: { required: true, content: json(ref('CreateStatusRequest')) },
      responses: {
        201: { description: 'נוצר', content: json({ type: 'object', properties: { status: ref('Status') } }) },
        ...errors(400, 401, 403, 404, 409),
      },
    },
  },

  '/api/statuses/{id}': {
    patch: {
      tags: ['סטטוסים'],
      summary: 'עריכת סטטוס של מוסד',
      description: 'סטטוס בסיסי אינו ניתן לשינוי (403, קוד BASE_STATUS_READONLY).' + roles('מנהל מוסד (במוסד שלו), מנהל ראשי'),
      security: bearer,
      parameters: [pathId('מזהה הסטטוס')],
      requestBody: { required: true, content: json(ref('UpdateStatusRequest')) },
      responses: {
        200: { description: 'עודכן', content: json({ type: 'object', properties: { status: ref('Status') } }) },
        ...errors(400, 401, 403, 404, 409),
      },
    },
  },

  '/api/applications': {
    get: {
      tags: ['מועמדויות'],
      summary: 'רשימת מועמדויות עם חיפוש, סינון ומיון',
      description: 'תלמיד רואה רק את המועמדויות שלו, מנהל מוסד — של המוסד שלו, מנהל ראשי — את כולן.' + roles('כל משתמש מחובר'),
      security: bearer,
      parameters: [
        query('search', { type: 'string' }, 'חיפוש בשם החברה ובשם המשרה', 'react'),
        query('statusId', { type: 'integer' }, 'סינון לפי סטטוס'),
        query('interestLevel', ref('InterestLevel'), 'סינון לפי רמת עניין'),
        query('jobRoleId', { type: 'integer' }, 'סינון לפי תחום תפקיד'),
        boolQuery('isOpen', 'true = תהליכים פתוחים בלבד, false = סגורים בלבד'),
        query('userId', { type: 'integer' }, 'סינון לפי תלמיד (מנהלים בלבד)'),
        query('institutionId', { type: 'integer' }, 'סינון לפי מוסד (מנהל ראשי)'),
        query('sortBy', { type: 'string', enum: ['submittedOn', 'companyName', 'updatedAt', 'interestLevel'], default: 'submittedOn' }, 'שדה המיון'),
        query('order', { type: 'string', enum: ['asc', 'desc'], default: 'desc' }, 'כיוון המיון'),
        ...pageQueries,
      ],
      responses: { 200: { description: 'רשימת מועמדויות', content: json(pageOf('ApplicationSummary')) }, ...errors(400, 401, 403) },
    },
    post: {
      tags: ['מועמדויות'],
      summary: 'הוספת מועמדות',
      description:
        'תלמיד מוסיף לעצמו. מנהל חייב לשלוח userId של תלמיד במוסד שלו — והתלמיד יקבל התראה.\n\nהתשובה כוללת suggestedAction — צעד הבא מוצע לפי הסטטוס.' +
        roles('כל משתמש מחובר'),
      security: bearer,
      requestBody: {
        required: true,
        content: json(ref('CreateApplicationRequest'), {
          companyName: 'חברה א׳',
          jobTitle: 'מפתח React מתחיל',
          submittedOn: '2026-10-01',
          statusId: 1,
          jobRoleId: 1,
          interestLevel: 'HIGH',
          jobUrl: 'https://example.com/jobs/1',
          contactName: 'משה לוי',
        }),
      },
      responses: {
        201: {
          description: 'המועמדות נוספה',
          content: json(
            { type: 'object', properties: { application: ref('ApplicationDetail'), suggestedAction: ref('Suggestion') } },
            { application: exApplicationDetail, suggestedAction: { title: 'לבצע מעקב אחרי קורות החיים', dueOn: '2026-10-26' } },
          ),
        },
        ...errors(400, 401, 403, 404),
      },
    },
  },

  '/api/applications/{id}': {
    get: {
      tags: ['מועמדויות'],
      summary: 'פרטי מועמדות כולל פעולות',
      description: 'מועמדות של משתמש אחר מחזירה 404.' + roles('בעל המועמדות, מנהל המוסד, מנהל ראשי'),
      security: bearer,
      parameters: [pathId('מזהה המועמדות')],
      responses: {
        200: { description: 'פרטי המועמדות', content: json({ type: 'object', properties: { application: ref('ApplicationDetail') } }) },
        ...errors(400, 401, 404),
      },
    },
    patch: {
      tags: ['מועמדויות'],
      summary: 'עריכת מועמדות ושינוי סטטוס',
      description:
        'עדכון חלקי. אם הסטטוס השתנה — מוחזר suggestedAction, ואם מנהל ביצע את השינוי — התלמיד מקבל התראה.' +
        roles('בעל המועמדות, מנהל המוסד, מנהל ראשי'),
      security: bearer,
      parameters: [pathId('מזהה המועמדות')],
      requestBody: { required: true, content: json(ref('UpdateApplicationRequest'), { statusId: 3, interviewAt: '2026-10-21T10:00:00+03:00' }) },
      responses: {
        200: {
          description: 'המועמדות עודכנה',
          content: json(
            {
              type: 'object',
              properties: { application: ref('ApplicationDetail'), statusChanged: { type: 'boolean' }, suggestedAction: ref('Suggestion') },
            },
            { application: exApplicationDetail, statusChanged: true, suggestedAction: { title: 'להתכונן לראיון', dueOn: '2026-10-20' } },
          ),
        },
        ...errors(400, 401, 404),
      },
    },
    delete: {
      tags: ['מועמדויות'],
      summary: 'מחיקת מועמדות',
      description: 'מוחק גם את הפעולות וההתראות של המועמדות.' + roles('בעל המועמדות, מנהל המוסד, מנהל ראשי'),
      security: bearer,
      parameters: [pathId('מזהה המועמדות')],
      responses: { 204: { description: 'נמחקה' }, ...errors(400, 401, 404) },
    },
  },

  '/api/applications/{id}/actions': {
    get: {
      tags: ['פעולות'],
      summary: 'פעולות של מועמדות',
      description: 'פעולות פתוחות קודם, לפי תאריך יעד.' + roles('בעל המועמדות, מנהל המוסד, מנהל ראשי'),
      security: bearer,
      parameters: [pathId('מזהה המועמדות'), query('status', { type: 'string', enum: ['OPEN', 'DONE'] }, 'סינון לפי מצב')],
      responses: {
        200: { description: 'רשימת פעולות', content: json({ type: 'object', properties: { items: { type: 'array', items: ref('Action') } } }) },
        ...errors(400, 401, 404),
      },
    },
    post: {
      tags: ['פעולות'],
      summary: 'הוספת פעולה למועמדות',
      description: 'כאן שולחים גם את הצעד המוצע אחרי שהמשתמש אישר אותו. אם מנהל הוסיף — התלמיד מקבל התראה.' + roles('בעל המועמדות, מנהל המוסד, מנהל ראשי'),
      security: bearer,
      parameters: [pathId('מזהה המועמדות')],
      requestBody: { required: true, content: json(ref('CreateActionRequest')) },
      responses: {
        201: { description: 'הפעולה נוספה', content: json({ type: 'object', properties: { action: ref('Action') } }, { action: exAction }) },
        ...errors(400, 401, 404),
      },
    },
  },

  '/api/actions/{id}': {
    patch: {
      tags: ['פעולות'],
      summary: 'עריכת פעולה או סימון כבוצעה',
      description: 'שליחת { "status": "DONE" } מסמנת כבוצעה ושומרת completedAt. { "status": "OPEN" } פותחת מחדש.' + roles('בעל המועמדות, מנהל המוסד, מנהל ראשי'),
      security: bearer,
      parameters: [pathId('מזהה הפעולה')],
      requestBody: { required: true, content: json(ref('UpdateActionRequest'), { status: 'DONE' }) },
      responses: {
        200: { description: 'הפעולה עודכנה', content: json({ type: 'object', properties: { action: ref('Action') } }) },
        ...errors(400, 401, 404),
      },
    },
    delete: {
      tags: ['פעולות'],
      summary: 'מחיקת פעולה',
      description: roles('בעל המועמדות, מנהל המוסד, מנהל ראשי'),
      security: bearer,
      parameters: [pathId('מזהה הפעולה')],
      responses: { 204: { description: 'נמחקה' }, ...errors(400, 401, 404) },
    },
  },

  '/api/dashboard': {
    get: {
      tags: ['מסך הבית'],
      summary: 'נתוני מסך הבית',
      description: 'פעולות באיחור / להיום / בקרוב, ראיונות קרובים ומועמדויות שצריך לקבוע להן צעד הבא.' + roles('כל משתמש מחובר. userId — למנהלים בלבד'),
      security: bearer,
      parameters: [query('userId', { type: 'integer' }, 'מנהלים: להציג את מסך הבית של תלמיד מסוים')],
      responses: { 200: { description: 'נתוני מסך הבית', content: json(ref('Dashboard')) }, ...errors(400, 401, 403, 404) },
    },
  },

  '/api/notifications': {
    get: {
      tags: ['התראות'],
      summary: 'ההתראות שלי',
      description: 'מהחדשה לישנה.' + roles('כל משתמש מחובר — רק ההתראות שלו'),
      security: bearer,
      parameters: [boolQuery('unreadOnly', 'true = רק התראות שלא נקראו'), ...pageQueries],
      responses: {
        200: {
          description: 'רשימת התראות',
          content: json({ allOf: [pageOf('Notification'), { type: 'object', properties: { unreadCount: { type: 'integer' } } }] }),
        },
        ...errors(400, 401),
      },
    },
  },

  '/api/notifications/unread-count': {
    get: {
      tags: ['התראות'],
      summary: 'מספר ההתראות שלא נקראו',
      description: roles('כל משתמש מחובר'),
      security: bearer,
      responses: {
        200: { description: 'מספר', content: json({ type: 'object', properties: { count: { type: 'integer' } } }, { count: 2 }) },
        ...errors(401),
      },
    },
  },

  '/api/notifications/{id}/read': {
    patch: {
      tags: ['התראות'],
      summary: 'סימון התראה כנקראה',
      description: roles('מקבל ההתראה בלבד'),
      security: bearer,
      parameters: [pathId('מזהה ההתראה')],
      responses: {
        200: { description: 'סומנה', content: json({ type: 'object', properties: { notification: ref('Notification') } }) },
        ...errors(400, 401, 404),
      },
    },
  },

  '/api/notifications/read-all': {
    patch: {
      tags: ['התראות'],
      summary: 'סימון כל ההתראות כנקראו',
      description: roles('כל משתמש מחובר'),
      security: bearer,
      responses: {
        200: { description: 'כמה התראות עודכנו', content: json({ type: 'object', properties: { updated: { type: 'integer' } } }, { updated: 2 }) },
        ...errors(401),
      },
    },
  },
};

const errorExample = (code: string, message: string) => ({ error: { code, message } });

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'הצעד הבא — API',
    version: '1.0.0',
    description:
      'שרת למערכת מעקב מועמדויות לעבודה.\n\n' +
      '**איך בודקים נתיבים מוגנים:**\n' +
      '1. פותחים את `POST /api/auth/login`, לוחצים **Try it out**, בוחרים דוגמה ולוחצים **Execute**.\n' +
      '2. מעתיקים את הערך של `token` מהתשובה (בלי המירכאות).\n' +
      '3. לוחצים על הכפתור **Authorize** למעלה, מדביקים את ה־Token ולוחצים **Authorize**.\n' +
      '4. מעכשיו כל קריאה תישלח עם `Authorization: Bearer <token>`.\n\n' +
      'בלי Token מוחזר **401**. עם Token של תפקיד שאינו מורשה מוחזר **403**.',
  },
  servers: [{ url: '/', description: 'השרת הנוכחי' }],
  tags: [
    { name: 'כללי' },
    { name: 'התחברות' },
    { name: 'מוסדות' },
    { name: 'משתמשים' },
    { name: 'תחומי תפקיד' },
    { name: 'סטטוסים' },
    { name: 'מועמדויות' },
    { name: 'פעולות' },
    { name: 'מסך הבית' },
    { name: 'התראות' },
  ],
  security: bearer,
  paths,
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'ה־Token שמתקבל מ־POST /api/auth/login' },
    },
    responses: {
      BadRequest: {
        description: 'ולידציה נכשלה',
        content: json(ref('Error'), {
          error: { code: 'VALIDATION_ERROR', message: 'הנתונים שנשלחו אינם תקינים', details: [{ field: 'companyName', message: 'שדה חובה' }] },
        }),
      },
      Unauthorized: {
        description: 'אין Token, Token לא תקין או שפג תוקפו (קודים: UNAUTHORIZED, INVALID_TOKEN, TOKEN_EXPIRED, INVALID_CREDENTIALS)',
        content: json(ref('Error'), errorExample('UNAUTHORIZED', 'נדרשת התחברות. יש לשלוח Authorization: Bearer <token>')),
      },
      Forbidden: {
        description: 'אין הרשאה לפעולה',
        content: json(ref('Error'), errorExample('FORBIDDEN', 'אין לך הרשאה לבצע פעולה זו')),
      },
      NotFound: {
        description: 'לא נמצא, או שייך למשתמש / מוסד אחר',
        content: json(ref('Error'), errorExample('NOT_FOUND', 'הפריט המבוקש לא נמצא')),
      },
      Conflict: {
        description: 'כפילות או מצב שאינו מאפשר את הפעולה',
        content: json(ref('Error'), errorExample('EMAIL_TAKEN', 'כתובת הדוא״ל כבר רשומה במערכת')),
      },
    },
    schemas,
  },
} as const;
