# תוצאות בדיקות

הבדיקות האלה הורצו בפועל בסביבת הפיתוח, ב־2026-10-19, ושוב ב־2026-10-21 אחרי הוספת עיר ודוא״ל למוסד ותחומים מבוקשים לתלמיד, מול PostgreSQL 16 ועם Node.js 22.

| בדיקה | פקודה | תוצאה |
|---|---|---|
| TypeScript Typecheck | `npm run typecheck` | ✅ ללא שגיאות |
| Build | `npm run build` | ✅ הצליח |
| בדיקות אוטומטיות | `npm test` | ✅ 147 מתוך 147 עברו, ב־11 קבצים |
| תקינות סכמת Prisma | `npx prisma validate` (גם בתוך הבדיקות) | ✅ |
| התאמה בין ה־Migrations לסכמה | `prisma migrate diff` | ✅ אין הבדלים |
| ולידציה של OpenAPI | `@apidevtools/swagger-parser` (בתוך הבדיקות) | ✅ תקין, וכל 36 הנתיבים מתועדים |
| בדיקת אבטחה של הספריות | `npm audit` | ✅ 0 פגיעויות |
| עדכון מסד קיים | `prisma migrate deploy` על מסד Production שכבר היו בו נתונים | ✅ שתי ה־Migrations החדשות (עיר ודוא״ל למוסד, תחומים מבוקשים לתלמיד) הוחלו, והנתונים הקיימים נשמרו |
| הדמיית פריסה ל־Render | `npm run render:build` בעותק נקי, מול מסד ריק, עם `NODE_ENV=production`, ואחר כך `npm start` | ✅ ה־Migrations הוחלו, ה־Seed יצר 8 סטטוסים ומנהל ראשי, ונתוני הדגמה לא נוצרו. `/api/health`, `/api-docs`, התחברות ו־CORS עבדו |

## באגים שהבדיקות מצאו ותוקנו
- תאריך שאינו קיים (למשל `2026-02-30`) גרם לשגיאת 500. עכשיו מוחזרת שגיאה 400 עם ההודעה "תאריך לא קיים", גם בשדות תאריך־ושעה.
- ספרייה פנימית של Prisma CLI (`deepmerge-ts`) הייתה עם פגיעות ידועה. היא עודכנה באמצעות `overrides` ב־`package.json`.

## פירוט כל הבדיקות

```
 ✓ tests/applications.test.ts > הוספת מועמדות — POST /api/applications > תלמיד מוסיף מועמדות לעצמו ומקבל הצעת צעד הבא
 ✓ tests/applications.test.ts > הוספת מועמדות — POST /api/applications > מנהל מוסד מוסיף מועמדות לתלמיד — והתלמיד מקבל התראה
 ✓ tests/applications.test.ts > הוספת מועמדות — POST /api/applications > מנהל חייב לציין userId
 ✓ tests/applications.test.ts > הוספת מועמדות — POST /api/applications > אי אפשר להוסיף מועמדות לתלמיד שממתין לאישור
 ✓ tests/applications.test.ts > הוספת מועמדות — POST /api/applications > שדות חובה חסרים מחזירים 400 עם פירוט
 ✓ tests/applications.test.ts > הוספת מועמדות — POST /api/applications > ולידציה נכשלת על submittedOn
 ✓ tests/applications.test.ts > הוספת מועמדות — POST /api/applications > ולידציה נכשלת על submittedOn
 ✓ tests/applications.test.ts > הוספת מועמדות — POST /api/applications > ולידציה נכשלת על jobUrl
 ✓ tests/applications.test.ts > הוספת מועמדות — POST /api/applications > ולידציה נכשלת על interestLevel
 ✓ tests/applications.test.ts > הוספת מועמדות — POST /api/applications > ולידציה נכשלת על interviewAt
 ✓ tests/applications.test.ts > הוספת מועמדות — POST /api/applications > ולידציה נכשלת על interviewAt
 ✓ tests/applications.test.ts > הוספת מועמדות — POST /api/applications > ולידציה נכשלת על companyName
 ✓ tests/applications.test.ts > הוספת מועמדות — POST /api/applications > תאריך הגשה בעתיד נדחה
 ✓ tests/applications.test.ts > הוספת מועמדות — POST /api/applications > סטטוס של מוסד אחר נדחה
 ✓ tests/applications.test.ts > הוספת מועמדות — POST /api/applications > תחום תפקיד לא פעיל או של מוסד אחר נדחה
 ✓ tests/applications.test.ts > הוספת מועמדות — POST /api/applications > תלמיד במוסד ב יכול לבחור את הסטטוס המותאם של המוסד שלו
 ✓ tests/applications.test.ts > עריכת מועמדות — PATCH /api/applications/:id > שינוי סטטוס על ידי התלמיד מחזיר הצעה ולא יוצר התראה
 ✓ tests/applications.test.ts > עריכת מועמדות — PATCH /api/applications/:id > שינוי סטטוס על ידי מנהל המוסד יוצר התראה לתלמיד עם הצעת צעד
 ✓ tests/applications.test.ts > עריכת מועמדות — PATCH /api/applications/:id > עדכון בלי שינוי סטטוס אינו מחזיר הצעה ואינו יוצר התראה
 ✓ tests/applications.test.ts > עריכת מועמדות — PATCH /api/applications/:id > אפשר למחוק שדה רשות עם null או מחרוזת ריקה
 ✓ tests/applications.test.ts > עריכת מועמדות — PATCH /api/applications/:id > גוף ריק מחזיר 400
 ✓ tests/applications.test.ts > עריכת מועמדות — PATCH /api/applications/:id > מזהה לא מספרי מחזיר 400
 ✓ tests/applications.test.ts > צפייה ומחיקה > GET מחזיר פרטים מלאים כולל פעולות
 ✓ tests/applications.test.ts > צפייה ומחיקה > DELETE מוחק את המועמדות יחד עם הפעולות וההתראות
 ✓ tests/applications.test.ts > חיפוש, סינון ומיון — GET /api/applications > חיפוש לפי שם חברה או תפקיד, ללא תלות באותיות גדולות
 ✓ tests/applications.test.ts > חיפוש, סינון ומיון — GET /api/applications > סינון לפי סטטוס, רמת עניין, תחום תפקיד ופתוח/סגור
 ✓ tests/applications.test.ts > חיפוש, סינון ומיון — GET /api/applications > מיון לפי שם חברה ורמת עניין
 ✓ tests/applications.test.ts > חיפוש, סינון ומיון — GET /api/applications > עימוד (pagination)
 ✓ tests/applications.test.ts > חיפוש, סינון ומיון — GET /api/applications > פרמטרים לא תקינים מחזירים 400
 ✓ tests/applications.test.ts > חיפוש, סינון ומיון — GET /api/applications > הרשימה כוללת את הפעולה הפתוחה הקרובה
 ✓ tests/permissions.test.ts > הרשאות לפי תפקיד (403) > תלמיד אינו רשאי: get /api/institutions
 ✓ tests/permissions.test.ts > הרשאות לפי תפקיד (403) > תלמיד אינו רשאי: post /api/institutions
 ✓ tests/permissions.test.ts > הרשאות לפי תפקיד (403) > תלמיד אינו רשאי: get /api/users
 ✓ tests/permissions.test.ts > הרשאות לפי תפקיד (403) > תלמיד אינו רשאי: post /api/users
 ✓ tests/permissions.test.ts > הרשאות לפי תפקיד (403) > תלמיד אינו רשאי: post /api/job-roles
 ✓ tests/permissions.test.ts > הרשאות לפי תפקיד (403) > תלמיד אינו רשאי: post /api/statuses
 ✓ tests/permissions.test.ts > הרשאות לפי תפקיד (403) > מנהל מוסד אינו רשאי: get /api/institutions
 ✓ tests/permissions.test.ts > הרשאות לפי תפקיד (403) > מנהל מוסד אינו רשאי: post /api/institutions
 ✓ tests/permissions.test.ts > הרשאות לפי תפקיד (403) > מנהל מוסד אינו רשאי: post /api/users
 ✓ tests/permissions.test.ts > הרשאות לפי תפקיד (403) > מנהל ראשי רשאי לצפות במוסדות
 ✓ tests/permissions.test.ts > הרשאות לפי תפקיד (403) > ללא Token כל נתיב פרטי מחזיר 401
 ✓ tests/permissions.test.ts > בידוד מידע בין משתמשים ומוסדות > תלמיד רואה ברשימה רק את המועמדויות שלו
 ✓ tests/permissions.test.ts > בידוד מידע בין משתמשים ומוסדות > תלמיד אינו יכול לצפות, לערוך או למחוק מועמדות של תלמיד אחר (404)
 ✓ tests/permissions.test.ts > בידוד מידע בין משתמשים ומוסדות > תלמיד אינו יכול לגשת לפעולה של מועמדות אחרת
 ✓ tests/permissions.test.ts > בידוד מידע בין משתמשים ומוסדות > תלמיד אינו יכול ליצור מועמדות בשם תלמיד אחר
 ✓ tests/permissions.test.ts > בידוד מידע בין משתמשים ומוסדות > תלמיד אינו יכול לסנן לפי תלמיד אחר
 ✓ tests/permissions.test.ts > בידוד מידע בין משתמשים ומוסדות > מנהל מוסד רואה רק את המועמדויות של המוסד שלו
 ✓ tests/permissions.test.ts > בידוד מידע בין משתמשים ומוסדות > מנהל מוסד אינו יכול לגשת למועמדות במוסד אחר (404)
 ✓ tests/permissions.test.ts > בידוד מידע בין משתמשים ומוסדות > מנהל מוסד אינו יכול ליצור מועמדות לתלמיד ממוסד אחר
 ✓ tests/permissions.test.ts > בידוד מידע בין משתמשים ומוסדות > מנהל מוסד אינו יכול לנהל תלמיד ממוסד אחר
 ✓ tests/permissions.test.ts > בידוד מידע בין משתמשים ומוסדות > מנהל מוסד רואה ברשימת המשתמשים רק תלמידים מהמוסד שלו
 ✓ tests/permissions.test.ts > בידוד מידע בין משתמשים ומוסדות > מנהל ראשי רואה את כל המועמדויות ויכול לסנן לפי מוסד
 ✓ tests/permissions.test.ts > בידוד מידע בין משתמשים ומוסדות > מנהל מוסד אינו רואה את תחומי התפקיד והסטטוסים של מוסד אחר
 ✓ tests/prisma.test.ts > Prisma ומסד הנתונים > סכמת Prisma תקינה
 ✓ tests/prisma.test.ts > Prisma ומסד הנתונים > כל ה־Migrations הוחלו על מסד הנתונים
 ✓ tests/prisma.test.ts > Prisma ומסד הנתונים > כל הטבלאות קיימות
 ✓ tests/prisma.test.ts > Prisma ומסד הנתונים > אילוץ: משתמש שאינו מנהל ראשי חייב מוסד
 ✓ tests/prisma.test.ts > Prisma ומסד הנתונים > אילוץ: מנהל ראשי אחד בלבד
 ✓ tests/prisma.test.ts > Prisma ומסד הנתונים > Foreign Key: אי אפשר ליצור מועמדות למשתמש שאינו קיים
 ✓ tests/prisma.test.ts > Prisma ומסד הנתונים > אילוץ: פעולה שבוצעה חייבת מועד ביצוע
 ✓ tests/prisma.test.ts > Prisma ומסד הנתונים > Seed של הסטטוסים הבסיסיים בטוח להרצה חוזרת
 ✓ tests/auth.test.ts > התחברות — POST /api/auth/login > התחברות תקינה מחזירה Token ופרטי משתמש ללא סיסמה
 ✓ tests/auth.test.ts > התחברות — POST /api/auth/login > סיסמה שגויה מחזירה 401
 ✓ tests/auth.test.ts > התחברות — POST /api/auth/login > דוא״ל שאינו קיים מחזיר 401 עם אותה הודעה
 ✓ tests/auth.test.ts > התחברות — POST /api/auth/login > שדות חסרים מחזירים 400
 ✓ tests/auth.test.ts > התחברות — POST /api/auth/login > תלמיד שממתין לאישור מקבל 403 ACCOUNT_PENDING
 ✓ tests/auth.test.ts > התחברות — POST /api/auth/login > תלמיד שנדחה מקבל 403 ACCOUNT_REJECTED
 ✓ tests/auth.test.ts > התחברות — POST /api/auth/login > משתמש מושבת אינו יכול להתחבר
 ✓ tests/auth.test.ts > Token — GET /api/auth/me > עם Token תקין מחזיר את המשתמש לפי ה־Token
 ✓ tests/auth.test.ts > Token — GET /api/auth/me > ללא Token מחזיר 401
 ✓ tests/auth.test.ts > Token — GET /api/auth/me > כותרת שאינה Bearer מחזירה 401
 ✓ tests/auth.test.ts > Token — GET /api/auth/me > Token לא תקין מחזיר 401
 ✓ tests/auth.test.ts > Token — GET /api/auth/me > Token שנחתם במפתח אחר מחזיר 401
 ✓ tests/auth.test.ts > Token — GET /api/auth/me > Token ללא חתימה (alg none) נדחה
 ✓ tests/auth.test.ts > Token — GET /api/auth/me > Token שפג תוקפו מחזיר 401 TOKEN_EXPIRED
 ✓ tests/auth.test.ts > Token — GET /api/auth/me > Token של משתמש שהושבת מפסיק לעבוד מיד
 ✓ tests/auth.test.ts > Token — GET /api/auth/me > התפקיד נקבע לפי מסד הנתונים ולא לפי מה שכתוב ב־Token
 ✓ tests/auth.test.ts > הרשמה — POST /api/auth/register > יוצרת תלמיד ממתין לאישור, ללא Token
 ✓ tests/auth.test.ts > הרשמה — POST /api/auth/register > אי אפשר להירשם כמנהל — שדה role מהלקוח מתעלם
 ✓ tests/auth.test.ts > הרשמה — POST /api/auth/register > הסיסמה נשמרת כ־Hash
 ✓ tests/auth.test.ts > הרשמה — POST /api/auth/register > דוא״ל קיים מחזיר 409
 ✓ tests/auth.test.ts > הרשמה — POST /api/auth/register > מוסד שאינו קיים מחזיר 404
 ✓ tests/auth.test.ts > הרשמה — POST /api/auth/register > סיסמה חלשה מחזירה 400
 ✓ tests/users-institutions.test.ts > אישור תלמידים > מנהל המוסד רואה את התלמידים שממתינים לאישור
 ✓ tests/users-institutions.test.ts > אישור תלמידים > אישור מאפשר לתלמיד להתחבר
 ✓ tests/users-institutions.test.ts > אישור תלמידים > דחייה חוסמת התחברות, ואפשר לאשר מאוחר יותר
 ✓ tests/users-institutions.test.ts > אישור תלמידים > מנהל ממוסד אחר אינו יכול לאשר
 ✓ tests/users-institutions.test.ts > אישור תלמידים > תלמיד אינו יכול לאשר
 ✓ tests/users-institutions.test.ts > ניהול משתמשים > מנהל מוסד משבית ומפעיל תלמיד
 ✓ tests/users-institutions.test.ts > ניהול משתמשים > מנהל מוסד אינו יכול להשבית מנהל אחר
 ✓ tests/users-institutions.test.ts > ניהול משתמשים > אי אפשר להשבית את עצמך
 ✓ tests/users-institutions.test.ts > ניהול משתמשים > מנהל ראשי יוצר מנהל מוסד שיכול להתחבר מיד
 ✓ tests/users-institutions.test.ts > ניהול משתמשים > אי אפשר ליצור מנהל ראשי נוסף
 ✓ tests/users-institutions.test.ts > ניהול משתמשים > דוא״ל כפול מחזיר 409
 ✓ tests/users-institutions.test.ts > ניהול משתמשים > מנהל ראשי מסנן משתמשים לפי תפקיד ומוסד
 ✓ tests/users-institutions.test.ts > מוסדות > רשימה ציבורית ללא Token, עם חיפוש
 ✓ tests/users-institutions.test.ts > מוסדות > הרשימה הציבורית כוללת עיר, אבל לא את הדוא״ל
 ✓ tests/users-institutions.test.ts > מוסדות > יצירה עם עיר ודוא״ל, ועריכה חלקית
 ✓ tests/users-institutions.test.ts > מוסדות > דוא״ל לא תקין או עיר ארוכה מדי נדחים
 ✓ tests/users-institutions.test.ts > מוסדות > מנהל ראשי יוצר ועורך מוסד, ושם כפול נדחה
 ✓ tests/users-institutions.test.ts > מוסדות > שם קצר מדי נדחה
 ✓ tests/catalog-notifications.test.ts > סטטוסים > תלמיד רואה את 8 הסטטוסים הבסיסיים ואת הסטטוסים של המוסד שלו, לפי הסדר
 ✓ tests/catalog-notifications.test.ts > סטטוסים > מנהל מוסד יוצר סטטוס, עורך אותו והופך ללא פעיל
 ✓ tests/catalog-notifications.test.ts > סטטוסים > אי אפשר לשנות סטטוס בסיסי
 ✓ tests/catalog-notifications.test.ts > סטטוסים > שם סטטוס שקיים כבר (גם בסיסי) נדחה
 ✓ tests/catalog-notifications.test.ts > סטטוסים > מנהל ראשי חייב לציין מוסד ביצירת סטטוס
 ✓ tests/catalog-notifications.test.ts > סטטוסים > מנהל מוסד אינו יכול ליצור סטטוס למוסד אחר
 ✓ tests/catalog-notifications.test.ts > תחומי תפקיד > תלמיד רואה רק תחומים פעילים של המוסד שלו
 ✓ tests/catalog-notifications.test.ts > תחומי תפקיד > מנהל מוסד יוצר ועורך, ושם כפול נדחה
 ✓ tests/catalog-notifications.test.ts > תחומי תפקיד > הפיכת תחום ללא פעיל שומרת אותו במועמדויות קיימות
 ✓ tests/catalog-notifications.test.ts > תחומי תפקיד > מנהל ראשי חייב לציין institutionId ברשימה
 ✓ tests/catalog-notifications.test.ts > התראות > ספירה, סימון אחת כנקראה, וסימון הכול
 ✓ tests/catalog-notifications.test.ts > התראות > אי אפשר לסמן התראה של משתמש אחר
 ✓ tests/desired-job-roles.test.ts > תחומי התפקיד של מוסד — רשימה ציבורית > מחזירה רק תחומים פעילים, בלי Token
 ✓ tests/desired-job-roles.test.ts > תחומי התפקיד של מוסד — רשימה ציבורית > מוסד שאינו קיים מחזיר 404
 ✓ tests/desired-job-roles.test.ts > בחירת תחומים בהרשמה > נשמרים התחומים שנבחרו, וכפילויות מוסרות
 ✓ tests/desired-job-roles.test.ts > בחירת תחומים בהרשמה > אפשר להירשם בלי תחומים
 ✓ tests/desired-job-roles.test.ts > בחירת תחומים בהרשמה > תחום של מוסד אחר או תחום לא פעיל נדחה, והמשתמש לא נוצר
 ✓ tests/desired-job-roles.test.ts > בחירת תחומים בהרשמה > ערך שאינו מערך נדחה
 ✓ tests/desired-job-roles.test.ts > עדכון התחומים שלי — PUT /api/auth/me/job-roles > התלמיד מחליף את רשימת התחומים
 ✓ tests/desired-job-roles.test.ts > עדכון התחומים שלי — PUT /api/auth/me/job-roles > אי אפשר לבחור תחום של מוסד אחר
 ✓ tests/desired-job-roles.test.ts > עדכון התחומים שלי — PUT /api/auth/me/job-roles > מנהלים אינם רשאים, ובלי Token מתקבל 401
 ✓ tests/desired-job-roles.test.ts > עדכון התחומים שלי — PUT /api/auth/me/job-roles > שדה חסר מחזיר 400
 ✓ tests/desired-job-roles.test.ts > המנהל מוצא תלמידים לפי תחום — GET /api/users?jobRoleId= > מחזיר רק את התלמידים שמחפשים בתחום
 ✓ tests/desired-job-roles.test.ts > המנהל מוצא תלמידים לפי תחום — GET /api/users?jobRoleId= > מנהל מוסד לא רואה תלמידים ממוסד אחר גם אם ישלח תחום של אותו מוסד
 ✓ tests/desired-job-roles.test.ts > המנהל מוצא תלמידים לפי תחום — GET /api/users?jobRoleId= > תחום שהפך ללא פעיל עדיין מוצג אצל התלמיד, עם isActive: false
 ✓ tests/actions-dashboard.test.ts > פעולות > הוספה, סימון כבוצעה, פתיחה מחדש ומחיקה
 ✓ tests/actions-dashboard.test.ts > פעולות > סימון פעולה כבוצעה אינו משפיע על פעולות אחרות
 ✓ tests/actions-dashboard.test.ts > פעולות > מנהל שמוסיף פעולה יוצר התראה לתלמיד
 ✓ tests/actions-dashboard.test.ts > פעולות > ולידציה: כותרת ותאריך חובה, סטטוס חוקי
 ✓ tests/actions-dashboard.test.ts > מסך הבית — GET /api/dashboard > מחלק את הפעולות לקבוצות לפי מועד
 ✓ tests/actions-dashboard.test.ts > מסך הבית — GET /api/dashboard > מנהל המוסד רואה את כל המוסד, ויכול לסנן לפי תלמיד
 ✓ tests/actions-dashboard.test.ts > מסך הבית — GET /api/dashboard > תלמיד אינו יכול לבקש מסך בית של תלמיד אחר
 ✓ tests/swagger.test.ts > Swagger / OpenAPI > המסמך תקין לפי תקן OpenAPI 3
 ✓ tests/swagger.test.ts > Swagger / OpenAPI > כל נתיב ב־Express מתועד, וכל נתיב מתועד קיים בשרת
 ✓ tests/swagger.test.ts > Swagger / OpenAPI > לכל פעולה יש תיאור, הרשאה ותשובות שגיאה מתאימות
 ✓ tests/swagger.test.ts > Swagger / OpenAPI > מוגדר Security Scheme מסוג HTTP Bearer JWT
 ✓ tests/swagger.test.ts > Swagger / OpenAPI > Swagger UI זמין ב־/api-docs
 ✓ tests/swagger.test.ts > Swagger / OpenAPI > GET /openapi.json מחזיר את המסמך
 ✓ tests/swagger.test.ts > Swagger / OpenAPI > הקובץ openapi.json בפרויקט מעודכן (npm run openapi:export)
 ✓ tests/swagger.test.ts > Swagger / OpenAPI > כל נתיב מתועד מגיב בשרת (לא ROUTE_NOT_FOUND)
 ✓ tests/health.test.ts > בריאות השרת ושגיאות כלליות > GET /api/health מחזיר ok כולל מסד הנתונים
 ✓ tests/health.test.ts > בריאות השרת ושגיאות כלליות > נתיב שאינו קיים (ציבורי) מחזיר 404 במבנה אחיד
 ✓ tests/health.test.ts > בריאות השרת ושגיאות כלליות > JSON לא תקין מחזיר 400
 ✓ tests/health.test.ts > בריאות השרת ושגיאות כלליות > CORS מאפשר את הכתובת שהוגדרה בלבד
 ✓ tests/dates.test.ts > תאריכים > "היום" מחושב לפי שעון ישראל
 ✓ tests/dates.test.ts > תאריכים > חישוב ימים ופורמט ישראלי
```
