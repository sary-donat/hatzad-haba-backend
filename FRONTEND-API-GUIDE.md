# מדריך API לצד ה־React — „הצעד הבא”

המדריך מסביר איך צד הלקוח מתקשר עם השרת: אילו כתובות קוראים, מה שולחים ומה מקבלים בחזרה.
**אין בו קוד React.** את הקומפוננטות, ה־Hooks, הטפסים, ה־Router, React Query וה־Context כותבים בעצמכם.

התיעוד האינטראקטיבי המלא, שבו אפשר גם לנסות כל קריאה, נמצא ב־Swagger: `<BASE_URL>/api-docs`.

---

## 1. כתובת השרת (Base URL)

| סביבה | Base URL |
|---|---|
| מקומי | `http://localhost:3000` |
| ענן (Render) | `https://<שם-השירות>.onrender.com` |

- כל הנתיבים מתחילים ב־`/api`, למשל `https://hatzad-haba-api.onrender.com/api/applications`.
- **מומלץ:** לשמור את ה־Base URL במשתנה סביבה של Vite (בקובץ `.env` של פרויקט ה־React, במשתנה שמתחיל ב־`VITE_`), ולא לכתוב אותו בקוד. כך מחליפים בקלות בין מקומי לענן.
- כתובת האתר של ה־React חייבת להופיע ב־`CORS_ORIGINS` בשרת (ראו `START-HERE.md`).
- **במסלול החינמי:** הבקשה הראשונה אחרי זמן ללא שימוש עלולה לקחת עד דקה. כדאי להציג מצב טעינה.

---

## 2. התחברות (Authentication)

### איך זה עובד
1. המשתמש מזין דוא״ל וסיסמה, ונשלחת בקשת `POST /api/auth/login`.
2. השרת מחזיר `token` (JWT) ואת פרטי המשתמש `user`.
3. שומרים את ה־Token בצד הלקוח, למשל ב־`localStorage`, כדי שרענון הדף לא ינתק את המשתמש.
4. **בכל** בקשה לנתיב מוגן שולחים את ה־Token בכותרת (Header).
5. בטעינת האפליקציה, אם יש Token שמור, קוראים ל־`GET /api/auth/me`. אם התשובה היא 200, המשתמש מחובר. אם היא 401, מוחקים את ה־Token ומעבירים למסך הכניסה.

### שליחת Bearer Token
כל בקשה מוגנת צריכה לכלול את הכותרת:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
- המילה `Bearer`, רווח אחד, ואחריו ה־Token.
- בבקשות עם גוף (POST / PATCH) מוסיפים גם `Content-Type: application/json`.
- מומלץ לרכז את הוספת הכותרת בפונקציית API משותפת אחת, ולא לכתוב אותה בכל מקום מחדש.

### התנתקות
אין Endpoint להתנתקות. מוחקים את ה־Token מהאחסון, מנקים את פרטי המשתמש ואת המטמון של React Query, ומעבירים למסך הכניסה.

### תוקף ה־Token
ה־Token תקף 8 שעות (או לפי `JWT_EXPIRES_IN`). אחרי שפג התוקף, השרת מחזיר 401 עם הקוד `TOKEN_EXPIRED`, ומעבירים למסך הכניסה.

### תפקידים
השדה `user.role` קובע מה מציגים:

| ערך | תפקיד | מסכים עיקריים |
|---|---|---|
| `STUDENT` | תלמיד | בית, מועמדויות, התראות |
| `INSTITUTION_ADMIN` | מנהל מוסד | בית (כל המוסד), מועמדויות, תלמידים, תחומי תפקיד, סטטוסים |
| `SUPER_ADMIN` | מנהל ראשי | מוסדות, משתמשים, וכל השאר |

> הסתרת כפתורים לפי תפקיד היא רק לנוחות המשתמש. **השרת בודק את כל ההרשאות בעצמו**, ומחזיר 403 או 404 גם אם מישהו עוקף את הממשק.

---

## 3. מבנה שגיאה אחיד

כל שגיאה מהשרת מגיעה באותו מבנה:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "הנתונים שנשלחו אינם תקינים",
    "details": [
      { "field": "companyName", "message": "שדה חובה" },
      { "field": "submittedOn", "message": "תאריך ההגשה אינו יכול להיות בעתיד" }
    ]
  }
}
```
- `message` כתוב בעברית, ואפשר להציג אותו למשתמש כמו שהוא.
- `details` מופיע בשגיאות ולידציה. השדה `field` תואם לשם השדה בטופס, כך שאפשר להציג את השגיאה ליד השדה המתאים.

### קודי HTTP

| קוד | משמעות | מה עושים בצד הלקוח |
|---|---|---|
| 200 | הצלחה | |
| 201 | נוצר | מרעננים את הרשימה |
| 204 | נמחק (אין גוף בתשובה) | מרעננים את הרשימה |
| 400 | ולידציה נכשלה | מציגים את `details` ליד השדות |
| 401 | לא מחובר, Token לא תקין או שפג תוקפו | מוחקים Token ומעבירים לכניסה (חוץ ממסך הכניסה עצמו) |
| 403 | אין הרשאה, או חשבון ממתין או נדחה | מציגים `message` |
| 404 | לא נמצא (או שייך למשתמש אחר) | מציגים "לא נמצא" |
| 409 | כפילות (דוא״ל, שם קיים) | מציגים `message` |
| 429 | יותר מדי ניסיונות התחברות | מציגים `message` |
| 500 | שגיאת שרת | מציגים הודעה כללית |
| 503 | אין חיבור למסד הנתונים (רק ב־health) | |

### קודי שגיאה (`error.code`) חשובים

| קוד | מתי |
|---|---|
| `VALIDATION_ERROR` | שדות לא תקינים |
| `INVALID_CREDENTIALS` | דוא״ל או סיסמה שגויים (401) |
| `ACCOUNT_PENDING` | תלמיד שעדיין לא אושר מנסה להיכנס (403) |
| `ACCOUNT_REJECTED` | ההרשמה נדחתה (403) |
| `UNAUTHORIZED` / `INVALID_TOKEN` / `TOKEN_EXPIRED` / `ACCOUNT_INACTIVE` | בעיית Token, או שהמשתמש הושבת (401) |
| `FORBIDDEN` | התפקיד אינו מורשה (403) |
| `BASE_STATUS_READONLY` | ניסיון לערוך סטטוס בסיסי (403) |
| `EMAIL_TAKEN` | הדוא״ל כבר רשום (409) |
| `NOT_FOUND` | לא נמצא (404) |

---

## 4. מבני הנתונים

### תאריכים
| סוג | פורמט | דוגמה | שדות |
|---|---|---|---|
| תאריך בלבד | `YYYY-MM-DD` | `"2026-10-20"` | `submittedOn`, `dueOn`, `suggestedDueOn`, `today` |
| תאריך ושעה | ISO 8601, עם אזור זמן | שליחה: `"2026-10-21T10:00:00+03:00"`. קבלה: `"2026-10-21T07:00:00.000Z"` | `interviewAt`, `createdAt`, `updatedAt`, `completedAt` |

> שדה `<input type="date">` מחזיר `YYYY-MM-DD`, ואפשר לשלוח אותו כמו שהוא. שדה `datetime-local` מחזיר ערך בלי אזור זמן, ולכן לפני השליחה צריך להמיר אותו ל־ISO מלא (עם `Z` או `+03:00`).

### Institution — מוסד
```json
{ "id": 1, "name": "מכללת אופק", "city": "ירושלים", "contactEmail": "office@ofek.example.com", "createdAt": "...", "updatedAt": "..." }
```
- `city` ו־`contactEmail` יכולים להיות `null`.
- ברשימה הציבורית (`/api/institutions/public`) מוחזרים רק `id`, `name` ו־`city`.
- בתוך משתמש (`user.institution`) מוחזרים רק `id` ו־`name`.

### User — משתמש
```json
{
  "id": 3,
  "fullName": "דנה כהן",
  "email": "dana@example.com",
  "role": "STUDENT",
  "approvalStatus": "APPROVED",
  "isActive": true,
  "institution": { "id": 1, "name": "מכללת אופק" },
  "desiredJobRoles": [ { "id": 1, "name": "תכנות", "isActive": true } ],
  "approvedAt": "2026-10-01T08:00:00.000Z",
  "createdAt": "2026-10-01T07:00:00.000Z"
}
```
- `desiredJobRoles` הם התחומים שהתלמיד מחפש בהם עבודה. אצל מנהלים זה מערך ריק. תחום שהמנהל הפך ללא פעיל מופיע עם `isActive: false`.
- `approvalStatus` מקבל את הערכים `PENDING` (ממתין), `APPROVED` (אושר) או `REJECTED` (נדחה).
- למנהל הראשי `institution` הוא `null`.

### Status — סטטוס
```json
{ "id": 3, "name": "נקבע ראיון", "isBase": true, "institutionId": null, "isFinal": false,
  "suggestedAction": "להתכונן לראיון", "suggestedDays": 1, "sortOrder": 30, "isActive": true }
```
- `isBase: true` מסמן סטטוס בסיסי, שאי אפשר לערוך.
- `isFinal: true` מסמן סטטוס שמסיים את התהליך, כמו "התקבלה הצעה", "נדחתה" או "נסגרה ביוזמת המועמד".

### JobRole — תחום תפקיד
```json
{ "id": 1, "institutionId": 1, "name": "תכנות", "isActive": true, "createdAt": "...", "updatedAt": "..." }
```

### ApplicationSummary — שורה ברשימת המועמדויות
```json
{
  "id": 101,
  "companyName": "חברה א׳",
  "jobTitle": "מפתחת React מתחילה",
  "status": { "id": 3, "name": "נקבע ראיון", "isFinal": false },
  "jobRole": { "id": 1, "name": "תכנות" },
  "interestLevel": "HIGH",
  "submittedOn": "2026-10-01",
  "interviewAt": "2026-10-21T07:00:00.000Z",
  "nextAction": { "id": 12, "title": "להתכונן לראיון", "dueOn": "2026-10-20" },
  "openActionsCount": 2,
  "user": { "id": 3, "fullName": "דנה כהן" },
  "updatedAt": "2026-10-19T08:00:00.000Z"
}
```
- `nextAction` היא הפעולה הפתוחה עם תאריך היעד הקרוב ביותר, או `null` אם אין פעולות פתוחות.
- `interestLevel` מקבל `LOW`, `MEDIUM`, `HIGH` או `null`. בתצוגה: נמוכה, בינונית, גבוהה.

### ApplicationDetail — מועמדות מלאה
כל השדות של השורה ברשימה, ובנוסף: `createdBy`, `jobUrl`, `contactName`, `jobAttractions`, `pointsToClarify`, `notes`, `interviewLocation`, `interviewPreparation`, `interviewQuestions`, `createdAt`, ו־`actions`, שהוא מערך של Action.

### Action — פעולה
```json
{ "id": 12, "applicationId": 101, "title": "להתכונן לראיון", "dueOn": "2026-10-20",
  "status": "OPEN", "notes": null, "completedAt": null, "createdById": 3,
  "createdAt": "...", "updatedAt": "..." }
```
- `status` מקבל `OPEN` (לביצוע) או `DONE` (בוצעה).

### Notification — התראה
```json
{
  "id": 5,
  "type": "STATUS_CHANGED",
  "isRead": false,
  "title": "עדכון במועמדות שלך",
  "message": "רונית מנהלת עדכן/ה את המועמדות שלך לתפקיד \"מפתחת React מתחילה\" בחברה \"חברה א׳\". סטטוס חדש: נקבע ראיון",
  "suggestedAction": "להתכונן לראיון",
  "suggestedDueOn": "2026-10-20",
  "application": { "id": 101, "companyName": "חברה א׳", "jobTitle": "מפתחת React מתחילה" },
  "actor": { "id": 2, "fullName": "רונית מנהלת" },
  "createdAt": "2026-10-19T08:00:00.000Z"
}
```
- `type` מקבל `APPLICATION_CREATED` (מנהל הוסיף מועמדות), `STATUS_CHANGED` (מנהל שינה סטטוס) או `ACTION_ADDED` (מנהל הוסיף פעולה).

### רשימה עם עימוד (Pagination)
הרשימות של מועמדויות, משתמשים והתראות מגיעות במבנה הזה:
```json
{ "items": [ ... ], "page": 1, "pageSize": 20, "total": 57, "totalPages": 3 }
```
שולחים `?page=2&pageSize=20` כדי לעבור לעמוד הבא. הערך המקסימלי של `pageSize` הוא 100.

### Suggestion — הצעת צעד הבא
```json
{ "title": "להתכונן לראיון", "dueOn": "2026-10-20" }
```
או `null`, כשאין הצעה לסטטוס.

---

## 5. Endpoints לפי מסך

### מסך 1 — הרשמה
| פעולה | קריאה |
|---|---|
| טעינת רשימת המוסדות לבחירה | `GET /api/institutions/public?search=<טקסט>`. ציבורי, ומחזיר `{ items: [{ id, name, city }] }`. החיפוש הוא לפי שם או עיר. `city` יכול להיות `null` |
| טעינת התחומים של המוסד שנבחר | `GET /api/institutions/{institutionId}/job-roles`. ציבורי, ומחזיר `{ items: [{ id, name }] }`. טוענים מחדש בכל פעם שהמשתמש מחליף מוסד, ומנקים את התחומים שכבר נבחרו |
| שליחת הטופס | `POST /api/auth/register` |

**שדות חובה בטופס:**

| שדה | כלל |
|---|---|
| `fullName` | 2–100 תווים |
| `email` | דוא״ל תקין |
| `password` | 8–72 תווים, לפחות אות אחת וספרה אחת |
| `institutionId` | מזהה מוסד מהרשימה |

**שדה רשות:**

| שדה | כלל |
|---|---|
| `jobRoleIds` | מערך של מזהים, למשל `[1, 3]` (בחירה מרובה, עד 20). רק תחומים של המוסד שנבחר. אם לא בוחרים, שולחים `[]` או לא שולחים את השדה |

**הצלחה (201):** מוחזרים `message` ו־`user`, **בלי Token**. מציגים הודעה בנוסח: "ההרשמה התקבלה. החשבון ממתין לאישור מנהל המוסד", ומעבירים למסך הכניסה.
**שגיאות:** 400 (שדות), 404 (מוסד לא קיים), 409 `EMAIL_TAKEN`.

### מסך 2 — כניסה
| פעולה | קריאה |
|---|---|
| כניסה | `POST /api/auth/login` עם `{ "email", "password" }` (שניהם חובה) |
| בדיקה בטעינת האפליקציה | `GET /api/auth/me` (Token) |

**הצלחה (200):** `{ "token": "...", "user": { ... } }`

**שגיאות:**
- 401 `INVALID_CREDENTIALS`: "דוא״ל או סיסמה שגויים".
- 403 `ACCOUNT_PENDING`: מציגים "החשבון ממתין לאישור מנהל המוסד".
- 403 `ACCOUNT_REJECTED`: ההרשמה נדחתה.
- 429: יותר מדי ניסיונות.

### מסך 3 — מסך הבית
| פעולה | קריאה |
|---|---|
| כל נתוני המסך | `GET /api/dashboard` |
| מנהל: מסך הבית של תלמיד מסוים | `GET /api/dashboard?userId=<id>` |

**תשובה:**
```json
{
  "today": "2026-10-19",
  "overdue":   [ { ...Action, "application": { "id", "companyName", "jobTitle", "user": { "id", "fullName" } } } ],
  "dueToday":  [ ... ],
  "upcoming":  [ ... ],
  "upcomingInterviews": [ { "id", "companyName", "jobTitle", "user", "interviewAt", "interviewLocation" } ],
  "needsNextStep": [ { "id", "companyName", "jobTitle", "user", "status", "updatedAt" } ],
  "unreadNotifications": 2
}
```
| קבוצה | מה היא מכילה |
|---|---|
| `overdue` | פעולות פתוחות שתאריך היעד שלהן עבר |
| `dueToday` | פעולות פתוחות להיום |
| `upcoming` | פעולות פתוחות ב־7 הימים הבאים |
| `upcomingInterviews` | ראיונות ב־7 הימים הקרובים |
| `needsNextStep` | מועמדויות פתוחות בלי אף פעולה פתוחה ("כדאי לבדוק") |

- כל פריט כולל `application.id`, וממנו בונים קישור למסך פרטי המועמדות.
- **סימון פעולה כבוצעה ישירות ממסך הבית:** `PATCH /api/actions/{id}` עם `{ "status": "DONE" }`. אחר כך מרעננים את `GET /api/dashboard`.

### מסך 4 — התראות
| פעולה | קריאה |
|---|---|
| מספר התראות שלא נקראו (לתג בתפריט) | `GET /api/notifications/unread-count`, שמחזיר `{ "count": 2 }` |
| רשימה | `GET /api/notifications` או `?unreadOnly=true`. מחזיר רשימה עם עימוד ובנוסף `unreadCount` |
| סימון התראה כנקראה | `PATCH /api/notifications/{id}/read` |
| סימון הכול כנקרא | `PATCH /api/notifications/read-all`, שמחזיר `{ "updated": 3 }` |

**הצגת "חלון קופץ" בכניסה:** אחרי התחברות מוצלחת, קוראים ל־`GET /api/notifications?unreadOnly=true`, ואם יש פריטים מציגים אותם.

אם להתראה יש `suggestedAction`, מציגים שני כפתורים:
- **"להוספת הפעולה"**: `POST /api/applications/{application.id}/actions` עם `{ "title": suggestedAction, "dueOn": suggestedDueOn }`, ואחר כך מסמנים את ההתראה כנקראה.
- **"מעבר למועמדות"**: ניווט לפרטי המועמדות `application.id`.

### מסך 5 — רשימת מועמדויות
`GET /api/applications` עם פרמטרים (כולם רשות):

| פרמטר | ערכים | שימוש בממשק |
|---|---|---|
| `search` | טקסט | תיבת חיפוש (חברה או תפקיד) |
| `statusId` | מזהה | בחירה מתוך `GET /api/statuses` |
| `interestLevel` | `LOW` / `MEDIUM` / `HIGH` | בחירה |
| `jobRoleId` | מזהה | בחירה מתוך `GET /api/job-roles` |
| `isOpen` | `true` / `false` | "פתוחות בלבד" / "סגורות בלבד" |
| `userId` | מזהה | מנהלים בלבד: סינון לפי תלמיד, מתוך `GET /api/users?role=STUDENT` |
| `institutionId` | מזהה | מנהל ראשי בלבד |
| `sortBy` | `submittedOn` (ברירת מחדל) / `companyName` / `updatedAt` / `interestLevel` | מיון |
| `order` | `desc` (ברירת מחדל) / `asc` | כיוון המיון |
| `page`, `pageSize` | מספרים | עימוד |

**תשובה:** רשימה עם עימוד של ApplicationSummary.

**טיפ ל־React Query:** כדאי שכל הפרמטרים יהיו חלק מה־Query Key, כך ששינוי בסינון יביא את הנתונים מחדש.

### מסך 6 — פרטי מועמדות
| פעולה | קריאה |
|---|---|
| טעינה | `GET /api/applications/{id}`, שמחזיר `{ "application": ApplicationDetail }`, כולל `actions` |
| הוספת פעולה | `POST /api/applications/{id}/actions` |
| עריכת פעולה | `PATCH /api/actions/{actionId}` עם השדות שהשתנו |
| סימון כבוצעה / פתיחה מחדש | `PATCH /api/actions/{actionId}` עם `{ "status": "DONE" }` או `{ "status": "OPEN" }` |
| מחיקת פעולה | `DELETE /api/actions/{actionId}`, שמחזיר 204 |
| מחיקת מועמדות | `DELETE /api/applications/{id}`, שמחזיר 204. כדאי חלון אישור לפני המחיקה |

**שדות חובה בטופס פעולה:**

| שדה | כלל |
|---|---|
| `title` | חובה, עד 200 תווים |
| `dueOn` | חובה, `YYYY-MM-DD` |
| `notes` | רשות, עד 2000 תווים |

**סדר הפעולות בתשובה:** פתוחות קודם, ובתוך כל קבוצה לפי תאריך יעד.
**404** פירושו שהמועמדות לא קיימת, או שאין למשתמש הרשאה לראות אותה.

### מסך 7 — טופס הוספה ועריכה של מועמדות
**נתונים לרשימות הבחירה:**
- סטטוסים: `GET /api/statuses`. התשובה כוללת את הבסיסיים ואת הסטטוסים של המוסד, כבר ממוינים.
- תחומי תפקיד: `GET /api/job-roles`. רק תחומים פעילים מוחזרים לתלמיד.
- מנהל: רשימת התלמידים לבחירה, `GET /api/users?role=STUDENT&approvalStatus=APPROVED&isActive=true`.

**הוספה:** `POST /api/applications`
**עריכה:** `PATCH /api/applications/{id}`. אפשר לשלוח את כל הטופס או רק את השדות שהשתנו. השרת בודק את הסטטוס ואת תחום התפקיד רק אם הם השתנו, כך שמועמדות ישנה עם סטטוס שהפך ללא פעיל עדיין ניתנת לעריכה.

**השדות בטופס:**

| שדה | חובה | כלל |
|---|---|---|
| `companyName` | ✅ | עד 120 תווים |
| `jobTitle` | ✅ | עד 120 תווים |
| `submittedOn` | ✅ | `YYYY-MM-DD`, לא בעתיד |
| `statusId` | ✅ | מתוך רשימת הסטטוסים |
| `userId` | ✅ **למנהלים בלבד** | התלמיד שעבורו מוסיפים. תלמיד **לא** שולח את השדה |
| `jobRoleId` | | מתוך רשימת תחומי התפקיד, או `null` |
| `jobUrl` | | כתובת שמתחילה ב־`http://` או `https://`, עד 500 תווים |
| `contactName` | | עד 100 תווים |
| `interestLevel` | | `LOW` / `MEDIUM` / `HIGH` / `null` |
| `jobAttractions` | | עד 2000 תווים |
| `pointsToClarify` | | עד 2000 תווים |
| `notes` | | עד 5000 תווים |
| `interviewAt` | | תאריך ושעה ISO, או `null` |
| `interviewLocation` | | עד 300 תווים |
| `interviewPreparation` | | עד 5000 תווים |
| `interviewQuestions` | | עד 5000 תווים |

- שדה רשות ריק (`""`) נשמר כ־`null`.
- ב־PATCH, שליחת `null` מוחקת ערך קיים.

**תשובת הוספה (201):**
```json
{ "application": { ...ApplicationDetail }, "suggestedAction": { "title": "לבצע מעקב אחרי קורות החיים", "dueOn": "2026-10-26" } }
```
**תשובת עריכה (200):**
```json
{ "application": { ... }, "statusChanged": true, "suggestedAction": { "title": "להתכונן לראיון", "dueOn": "2026-10-20" } }
```

**תהליך "הצעת צעד הבא":**
1. אחרי שמירה, אם `suggestedAction` אינו `null`, מציגים חלון: "להוסיף את הפעולה 'להתכונן לראיון' לתאריך 20.10?". כדאי לאפשר למשתמש לשנות את התאריך.
2. אם המשתמש מאשר: `POST /api/applications/{id}/actions` עם `{ "title", "dueOn" }`.
3. אם המשתמש מוותר, לא שולחים כלום. **השרת לא יוצר פעולה לבד.**

**מניעת שליחה כפולה:** כדאי לנטרל את כפתור השמירה בזמן שהבקשה בדרך.
**אחרי שמירה:** מרעננים את רשימת המועמדויות ואת מסך הבית. ב־React Query עושים זאת באמצעות invalidate.

### מסך 8 — ניהול תחומי תפקיד (מנהלים)
| פעולה | קריאה |
|---|---|
| רשימה כולל לא פעילים | `GET /api/job-roles?includeInactive=true`. מנהל ראשי מוסיף `&institutionId=<id>` |
| הוספה | `POST /api/job-roles` עם `{ "name" }` (2–80 תווים). מנהל ראשי מוסיף `institutionId` |
| עריכה / הפיכה ללא פעיל | `PATCH /api/job-roles/{id}` עם `{ "name" }` ו/או `{ "isActive": false }` |

אין מחיקה. במקום למחוק, הופכים את התחום ללא פעיל, כדי לשמור על מועמדויות קיימות.

### מסך 9 — ניהול סטטוסים (מנהלים)
| פעולה | קריאה |
|---|---|
| רשימה | `GET /api/statuses?includeInactive=true` |
| הוספה | `POST /api/statuses` |
| עריכה / הפיכה ללא פעיל | `PATCH /api/statuses/{id}` |

**השדות:**

| שדה | חובה | כלל |
|---|---|---|
| `name` | ✅ | 2–60 תווים, לא כפול לשם קיים (כולל שמות הבסיסיים) |
| `isFinal` | | `true` אם הסטטוס מסיים את התהליך (ברירת מחדל `false`) |
| `suggestedAction` | | הצעד המוצע, עד 200 תווים, או `null` |
| `suggestedDays` | | 0–60. ברירת המחדל היא 3 כשיש `suggestedAction` |
| `sortOrder` | | סדר הצגה. לדוגמה, 35 יציג את הסטטוס בין "נקבע ראיון" (30) ל"תרגיל בית" (40) |
| `isActive` | | בעריכה בלבד |
| `institutionId` | ✅ **למנהל ראשי בלבד** | |

- בסטטוסים שבהם `isBase: true` לא מציגים כפתור עריכה, כי השרת מחזיר 403.

### מסך 10 — ניהול משתמשים (מנהלים)
| פעולה | קריאה |
|---|---|
| רשימה | `GET /api/users`. פרמטרים: `search`, `role`, `institutionId`, `isActive`, `approvalStatus`, `jobRoleId`, `page`, `pageSize` |
| תלמידים שמחפשים בתחום מסוים | `GET /api/users?role=STUDENT&jobRoleId=<id>`. כך המנהל יודע למי להוסיף מועמדות בתחום. כל תלמיד ברשימה כולל `desiredJobRoles` |
| לשונית "ממתינים לאישור" | `GET /api/users?approvalStatus=PENDING` |
| אישור | `PATCH /api/users/{id}/approve` |
| דחייה | `PATCH /api/users/{id}/reject` |
| השבתה / הפעלה | `PATCH /api/users/{id}` עם `{ "isActive": false }` או `{ "isActive": true }` |
| עדכון שם | `PATCH /api/users/{id}` עם `{ "fullName": "..." }` |
| מנהל ראשי: יצירת מנהל מוסד | `POST /api/users` |

- **מנהל מוסד** רואה ברשימה רק את התלמידים של המוסד שלו.
- **409** מוחזר באישור תלמיד שכבר אושר, או בדחייה של תלמיד שאינו ממתין.

**שדות חובה ביצירת מנהל מוסד:**

| שדה | כלל |
|---|---|
| `fullName` | 2–100 תווים |
| `email` | דוא״ל תקין |
| `password` | לפחות 8 תווים, אות וספרה |
| `institutionId` | מזהה המוסד |
| `role` | רשות: `INSTITUTION_ADMIN` (ברירת מחדל) או `STUDENT` |

### מסך 12 — התחומים שלי (תלמיד)
| פעולה | קריאה |
|---|---|
| התחומים שנבחרו כרגע | `GET /api/auth/me`, השדה `user.desiredJobRoles` |
| כל התחומים שאפשר לבחור | `GET /api/job-roles` (התחומים הפעילים של המוסד שלי) |
| שמירה | `PUT /api/auth/me/job-roles` עם `{ "jobRoleIds": [1, 3] }` |

- שולחים את **כל** הרשימה בכל שמירה. היא מחליפה את הקודמת, ו־`[]` מוחק את כולם.
- **תשובה:** `{ "user": { ... } }` עם `desiredJobRoles` מעודכן. כדאי לעדכן גם את פרטי המשתמש ב־Context.
- **שגיאות:** 400 אם נשלח תחום שאינו של המוסד או שאינו פעיל, 403 אם המשתמש אינו תלמיד.
- אפשר לשים את זה כמסך נפרד, או כחלק במסך "הפרופיל שלי".

### מסך 11 — ניהול מוסדות (מנהל ראשי)
| פעולה | קריאה |
|---|---|
| רשימה עם מספר המנהלים והתלמידים | `GET /api/institutions?search=` (חיפוש לפי שם או עיר) |
| הוספה | `POST /api/institutions` |
| עריכה | `PATCH /api/institutions/{id}` — שולחים רק את השדות שהשתנו |

**השדות:**

| שדה | חובה | כלל |
|---|---|---|
| `name` | ✅ בהוספה | 2–100 תווים, לא כפול |
| `city` | | עד 80 תווים |
| `contactEmail` | | כתובת דוא״ל תקינה, עד 255 תווים |

שדה רשות ריק (`""`) או `null` מוחק את הערך.

**תשובה:**
```json
{ "institution": { "id": 1, "name": "מכללת אופק", "city": "ירושלים", "contactEmail": "office@ofek.example.com", "createdAt": "...", "updatedAt": "..." } }
```
ברשימה (`GET /api/institutions`) כל מוסד כולל גם `adminsCount` ו־`studentsCount`.

---

## 6. טבלת הרשאות מקוצרת

| קריאה | תלמיד | מנהל מוסד | מנהל ראשי |
|---|---|---|---|
| `/auth/*`, `/institutions/public`, `/institutions/{id}/job-roles` | ✅ | ✅ | ✅ |
| `PUT /auth/me/job-roles` | ✅ | ❌ 403 | ❌ 403 |
| `/dashboard`, `/notifications/*` | ✅ שלו | ✅ | ✅ |
| `/applications`, `/actions` | ✅ שלו | ✅ במוסד | ✅ הכול |
| `GET /statuses`, `GET /job-roles` | ✅ פעילים | ✅ | ✅ |
| `POST` / `PATCH` של `/statuses` ו־`/job-roles` | ❌ 403 | ✅ במוסד | ✅ |
| `/users` (רשימה, אישור, השבתה) | ❌ 403 | ✅ תלמידי המוסד | ✅ |
| `POST /users`, `/institutions` | ❌ 403 | ❌ 403 | ✅ |

---

## 7. רשימת כל ה־Endpoints

| Method | URL | Token |
|---|---|---|
| GET | `/api/health` | |
| POST | `/api/auth/register` | |
| POST | `/api/auth/login` | |
| GET | `/api/auth/me` | ✅ |
| PUT | `/api/auth/me/job-roles` | ✅ |
| GET | `/api/institutions/public` | |
| GET | `/api/institutions/{id}/job-roles` | |
| GET | `/api/institutions` | ✅ |
| POST | `/api/institutions` | ✅ |
| PATCH | `/api/institutions/{id}` | ✅ |
| GET | `/api/users` | ✅ |
| POST | `/api/users` | ✅ |
| GET | `/api/users/{id}` | ✅ |
| PATCH | `/api/users/{id}` | ✅ |
| PATCH | `/api/users/{id}/approve` | ✅ |
| PATCH | `/api/users/{id}/reject` | ✅ |
| GET | `/api/job-roles` | ✅ |
| POST | `/api/job-roles` | ✅ |
| PATCH | `/api/job-roles/{id}` | ✅ |
| GET | `/api/statuses` | ✅ |
| POST | `/api/statuses` | ✅ |
| PATCH | `/api/statuses/{id}` | ✅ |
| GET | `/api/applications` | ✅ |
| POST | `/api/applications` | ✅ |
| GET | `/api/applications/{id}` | ✅ |
| PATCH | `/api/applications/{id}` | ✅ |
| DELETE | `/api/applications/{id}` | ✅ |
| GET | `/api/applications/{id}/actions` | ✅ |
| POST | `/api/applications/{id}/actions` | ✅ |
| PATCH | `/api/actions/{id}` | ✅ |
| DELETE | `/api/actions/{id}` | ✅ |
| GET | `/api/dashboard` | ✅ |
| GET | `/api/notifications` | ✅ |
| GET | `/api/notifications/unread-count` | ✅ |
| PATCH | `/api/notifications/{id}/read` | ✅ |
| PATCH | `/api/notifications/read-all` | ✅ |

---

## 8. חשבונות הדגמה

בהרצה מקומית (`npm run db:seed`):

| דוא״ל | סיסמה | תפקיד |
|---|---|---|
| ronit@example.com | Admin1234! | מנהלת מוסד — מכללת אופק |
| yossi@example.com | Admin1234! | מנהל מוסד — מרכז הכשרה נתיב |
| dana@example.com | Student1234! | תלמידה — מכללת אופק (עם פעולות באיחור, להיום ובקרוב, והתראה אחת) |
| yael@example.com | Student1234! | תלמידה — מכללת אופק |
| michal@example.com | Student1234! | תלמידה — מרכז הכשרה נתיב |
| noa@example.com | Student1234! | ממתינה לאישור. מתאים לבדיקת `ACCOUNT_PENDING` |

בענן, הסיסמה היא הערך של `DEMO_PASSWORD`, אם הפעלתם נתוני הדגמה (ראו `START-HERE.md`).
