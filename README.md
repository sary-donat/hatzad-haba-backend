# הצעד הבא — Backend

שרת API למערכת מעקב מועמדויות לעבודה: תלמידים מנהלים את המועמדויות שלהם, ומנהלי מוסדות מלווים אותם.

> **מתחילים מכאן?** את ההוראות המלאות להעלאה לאינטרנט (GitHub, מסד נתונים ו־Render) תמצאו בקובץ [`START-HERE.md`](START-HERE.md).
> את המדריך לחיבור צד ה־React תמצאו בקובץ [`FRONTEND-API-GUIDE.md`](FRONTEND-API-GUIDE.md).

## טכנולוגיות

| תחום | טכנולוגיה |
|---|---|
| סביבת ריצה | Node.js 22 LTS |
| שרת | Express 5 |
| שפה | TypeScript (strict) |
| מסד נתונים | PostgreSQL |
| ORM | Prisma 6 |
| ולידציה | Zod 4 (הודעות שגיאה בעברית) |
| אימות | JWT (HS256) + bcrypt |
| תיעוד | Swagger UI / OpenAPI 3 |
| בדיקות | Vitest + Supertest, מול PostgreSQL אמיתי |

אין שימוש בשירותי AI או במפתחות API בתשלום.

## מבנה התיקיות

```
backend-project/
├── src/
│   ├── server.ts            # הפעלת השרת (PORT)
│   ├── app.ts               # הגדרת Express: CORS, Helmet, Swagger, נתיבים, שגיאות
│   ├── config/env.ts        # קריאה ובדיקה של משתני הסביבה
│   ├── db/                  # חיבור Prisma ו־Seed
│   ├── auth/                # JWT, גיבוב סיסמאות, המשתמש המחובר
│   ├── middleware/          # authenticate (401), requireRole (403), טיפול בשגיאות
│   ├── routes/              # כל הנתיבים וההרשאות לכל נתיב
│   ├── controllers/         # קריאת הבקשה והחזרת התשובה
│   ├── services/            # הלוגיקה העסקית והרשאות ברמת הנתונים
│   ├── validation/          # סכמות Zod
│   ├── docs/openapi.ts      # מסמך Swagger
│   └── utils/               # תאריכים, שגיאות, עימוד
├── prisma/
│   ├── schema.prisma        # סכמת מסד הנתונים
│   └── migrations/          # Migrations (כולל אילוצי CHECK)
├── tests/                   # בדיקות אוטומטיות
├── scripts/export-openapi.ts
├── docs/SPECIFICATION.md    # האפיון שאושר
├── docs/FORM-FIELDS.md      # שדות הקלט בכל מסך
├── openapi.json             # מסמך OpenAPI כקובץ
├── render.yaml              # הגדרת פריסה ל־Render
├── START-HERE.md            # הוראות העלאה לאינטרנט
└── FRONTEND-API-GUIDE.md    # מדריך לצד ה־React
```

## הרצה מקומית

דרישות: Node.js 22 ומעלה, ו־PostgreSQL (מקומי, או מסד חינמי בענן כמו Neon).

```bash
npm install
cp .env.example .env          # ומלאו DATABASE_URL ו־JWT_SECRET
npm run db:migrate            # יוצר את הטבלאות
npm run db:seed               # סטטוסים בסיסיים, מנהל ראשי ונתוני הדגמה
npm run dev                   # http://localhost:3000
```

- Swagger: http://localhost:3000/api-docs
- בדיקת בריאות: http://localhost:3000/api/health

### חשבונות הדגמה (בסביבת פיתוח בלבד)

| תפקיד | דוא״ל | סיסמה |
|---|---|---|
| מנהל ראשי | הערך של `SUPER_ADMIN_EMAIL` | הערך של `SUPER_ADMIN_PASSWORD` |
| מנהלת מוסד — מכללת אופק | ronit@example.com | Admin1234! |
| מנהל מוסד — מרכז הכשרה נתיב | yossi@example.com | Admin1234! |
| תלמידה — מכללת אופק | dana@example.com | Student1234! |
| תלמידה — מכללת אופק | yael@example.com | Student1234! |
| תלמידה — מרכז הכשרה נתיב | michal@example.com | Student1234! |
| תלמידה ממתינה לאישור | noa@example.com | Student1234! |

ב־Production חשבונות ההדגמה **לא** נוצרים, אלא אם הוגדרו `SEED_DEMO_DATA=true` ו־`DEMO_PASSWORD` (ראו בהמשך).

## פקודות

| פקודה | מה היא עושה |
|---|---|
| `npm run dev` | הרצה בפיתוח, עם רענון אוטומטי |
| `npm run build` | Prisma Generate והידור ל־`dist/` |
| `npm start` | הפעלת הגרסה שהודרה |
| `npm run typecheck` | בדיקת טיפוסים של TypeScript |
| `npm test` | הרצת כל הבדיקות האוטומטיות |
| `npm run db:migrate` | יצירה והחלה של Migration בפיתוח |
| `npm run db:deploy` | החלת Migrations ב־Production |
| `npm run db:seed` / `db:seed:prod` | Seed (פיתוח / אחרי Build) |
| `npm run db:studio` | ממשק גרפי לצפייה בנתונים |
| `npm run openapi:export` | עדכון הקובץ `openapi.json` |
| `npm run render:build` | פקודת ה־Build המלאה ל־Render |

## בדיקות

הבדיקות רצות מול **מסד PostgreSQL נפרד**, שכל הנתונים בו נמחקים לפני כל בדיקה. מגדירים אותו ב־`TEST_DATABASE_URL`, ושם מסד הנתונים חייב להכיל את המילה `test`, כהגנה מפני מחיקה בטעות של המסד האמיתי.

```bash
createdb hatzad_test     # פעם אחת
npm test
```

## משתני סביבה

| משתנה | חובה | תיאור |
|---|---|---|
| `DATABASE_URL` | ✅ | כתובת החיבור ל־PostgreSQL |
| `JWT_SECRET` | ✅ | מפתח סודי, לפחות 32 תווים |
| `JWT_EXPIRES_IN` | | תוקף ה־Token (ברירת מחדל `8h`) |
| `CORS_ORIGINS` | | כתובות צד הלקוח, מופרדות בפסיקים, או `*` |
| `PORT` | | ברירת מחדל 3000. ב־Render נקבע אוטומטית |
| `NODE_ENV` | | `production` בענן |
| `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD` | | יצירת המנהל הראשי ב־Seed. ב־Production — סיסמה של 12 תווים לפחות |
| `SEED_DEMO_DATA`, `DEMO_PASSWORD` | | נתוני הדגמה |
| `APP_TIMEZONE` | | ברירת מחדל `Asia/Jerusalem` |
| `BCRYPT_ROUNDS` | | ברירת מחדל 10 |

## אבטחה — סיכום

- הסיסמאות נשמרות כ־Hash של bcrypt, ואינן מוחזרות לעולם בתשובות ה־API.
- JWT בתוקף מוגבל. בכל בקשה המשתמש נטען מחדש ממסד הנתונים, כך שמשתמש שהושבת מאבד גישה מיד.
- המשתמש והתפקיד נקבעים רק לפי ה־Token, ולא לפי נתונים שהלקוח שולח.
- ניסיון גישה לנתונים של משתמש או מוסד אחר מחזיר 404, כדי לא לחשוף שהם קיימים.
- יש הגבלת קצב על נתיבי ההתחברות וההרשמה, וכן Helmet ו־CORS ניתן להגדרה.
- אילוצי תקינות (CHECK, Foreign Keys, אינדקסים ייחודיים) גם במסד הנתונים עצמו.
