# מתחילים כאן — העלאת השרת לאינטרנט

המדריך מיועד למי שמעולם לא העלו שרת לאינטרנט. עוברים על השלבים לפי הסדר.

בסוף התהליך יהיו לכם:
- הקוד שמור ב־**GitHub**.
- מסד נתונים **PostgreSQL** חינמי בענן.
- שרת פעיל ב־**Render**, עם כתובת כמו `https://hatzad-haba-api.onrender.com`.

> **הערה חשובה:** שמות הכפתורים והמסכים כתובים לפי מה שהיה מוכר לי בזמן הכתיבה, ולא יכולתי לבדוק את האתרים בזמן אמת. אתרים משנים את הממשק מדי פעם. אם כפתור נקרא קצת אחרת, חפשו כפתור עם משמעות דומה. הערכים שצריך להזין (פקודות, שמות משתנים) הם מדויקים ואינם משתנים.

> **על מסלולים חינמיים:** המסלולים החינמיים כוללים מגבלות, ותנאיהם עשויים להשתנות. לפני שמתחילים, כדאי לבדוק בעמוד המחירים של כל שירות מה כלול כרגע.

### מה צריך לפני שמתחילים

- כתובת דוא״ל.
- הקובץ `backend-project.zip`.
- כ־45 דקות.
- מקום בטוח לשמירת סיסמאות, למשל מנהל סיסמאות או פתק פרטי. **לא** קובץ שעולה ל־GitHub.

---

## חלק א — GitHub

GitHub שומר את הקוד, ו־Render ייקח את הקוד משם.

### 1. פתיחת חשבון
1. נכנסים ל־https://github.com
2. לוחצים **Sign up**.
3. מזינים דוא״ל, סיסמה ושם משתמש, ומאשרים את הדוא״ל לפי ההוראות שנשלחות.

### 2. יצירת Repository (מאגר)
1. אחרי ההתחברות לוחצים על **+** בפינה העליונה, ובוחרים **New repository**.
2. **Repository name:** `hatzad-haba-backend`
3. בוחרים **Private** (רק אתם רואים) או **Public** (כולם רואים). לפרויקט גמר שמגישים לבודק, בדרך כלל עדיף Public, או Private עם הוספת הבודק כשותף.
4. **אל** תסמנו "Add a README file" — כבר יש README בפרויקט.
5. לוחצים **Create repository**.

### 3. חילוץ קובץ ה־ZIP
- **Windows:** קליק ימני על `backend-project.zip`, אחר כך **Extract All...** (חלץ הכל), ולבסוף **Extract**.
- **Mac:** לחיצה כפולה על הקובץ.

נוצרת תיקייה בשם `backend-project`. בתוכה אמורים להיות: `src`, `prisma`, `tests`, `docs`, `package.json`, `render.yaml` ועוד.

> **ב־Mac:** הקבצים שמתחילים בנקודה (`.gitignore`, `.env.example`, `.node-version`) מוסתרים. כדי לראות אותם, לוחצים בתוך התיקייה `Cmd + Shift + .` (נקודה).

### 4. העלאת הקבצים דרך הדפדפן
1. בעמוד ה־Repository הריק לוחצים על הקישור **uploading an existing file**. אם הוא לא מופיע: **Add file**, ואז **Upload files**.
2. פותחים את התיקייה `backend-project`, מסמנים **את כל מה שבתוכה** (`Ctrl+A` או `Cmd+A`), וגוררים לחלון הדפדפן.

   ⚠️ גוררים את **התוכן** של התיקייה, לא את התיקייה עצמה. אחרת הקבצים יהיו בתוך תיקייה נוספת, ו־Render לא ימצא את `package.json`.
3. מחכים שכל הקבצים יופיעו ברשימה (בערך 80 קבצים).
4. למטה, בשדה **Commit changes**, כותבים: `העלאה ראשונה`
5. לוחצים **Commit changes**.

> מומלץ לגרור בדפדפן Chrome או Edge, שם גרירה של תיקיות עובדת. אם התיקיות לא עולות, מעלים כל תיקייה בנפרד ושומרים על המבנה שלה.

### 5. בדיקה שהקבצים ב־GitHub
בעמוד הראשי של ה־Repository צריכים להופיע ישירות (לא בתוך תיקייה נוספת):

- `src/`, `prisma/`, `tests/`, `docs/`, `scripts/`
- `package.json`, `package-lock.json`, `render.yaml`, `tsconfig.json`
- `.gitignore`, `.env.example`, `.node-version`

נכנסים לתיקייה `prisma`, ובודקים שיש בה `migrations` ובתוכה תיקייה עם קובץ `migration.sql`.

✅ **אסור** שיופיעו `node_modules` או קובץ בשם `.env` (בלי `.example`).

---

## חלק ב — מסד נתונים PostgreSQL חינמי

ההמלצה שלי היא **Neon**: מסלול חינמי, בלי כרטיס אשראי, וכתובת חיבור אחת שעובדת ישירות עם Prisma.

### 1. פתיחת חשבון
1. נכנסים ל־https://neon.com (בעבר neon.tech).
2. לוחצים **Sign up**. הכי פשוט: **Continue with GitHub**.

### 2. יצירת Database
1. אחרי ההרשמה נפתח מסך יצירת פרויקט. אם הוא לא נפתח: **New Project**.
2. **Project name:** `hatzad-haba`
3. **Postgres version:** משאירים את ברירת המחדל.
4. **Region:** בוחרים **AWS Europe Central (Frankfurt)**. זה קרוב לשרת שניצור ב־Render, ולכן מהיר יותר.
5. לוחצים **Create project**.

### 3. קבלת Connection String (כתובת החיבור)
1. בלוח הבקרה של הפרויקט לוחצים **Connect**.
2. אם יש מתג **Connection pooling**, מכבים אותו. כך מקבלים כתובת ישירה, שמתאימה גם ל־Migrations.
3. מעתיקים את הכתובת. היא נראית בערך כך:
   ```
   postgresql://neondb_owner:AbC123xyz@ep-cool-name-123456.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
   ודאו שבסוף הכתובת מופיע `?sslmode=require`.

### 4. שמירה בטוחה
- הכתובת כוללת סיסמה. מי שמחזיק בה יכול לקרוא ולמחוק את כל הנתונים.
- שומרים אותה במנהל סיסמאות או בפתק פרטי.
- **לעולם** לא מכניסים אותה לקובץ שעולה ל־GitHub. היא תוזן רק ב־Render, במשתני הסביבה.

### 5. חיבור השרת למסד הנתונים
החיבור מתבצע בחלק ג: מדביקים את הכתובת במשתנה `DATABASE_URL` ב־Render. אין צורך ליצור טבלאות ידנית, כי השרת יוצר אותן בעצמו בזמן ה־Build באמצעות Prisma Migrations.

### חלופות למסד הנתונים

| ספק | מה לשים לב |
|---|---|
| **Supabase** | בפרויקט לוחצים **Connect**, ומעתיקים את כתובת **Session pooler** (פורט 5432). במקום `[YOUR-PASSWORD]` מכניסים את סיסמת מסד הנתונים שבחרתם. מוסיפים בסוף `?sslmode=require` |
| **Render PostgreSQL** | נוח כי הכול באותו מקום, אבל במסלול החינמי מסד הנתונים עשוי להימחק אחרי תקופה קצרה (בזמן הכתיבה: 30 יום). בדקו את התנאים לפני שבוחרים |

השרת לא תלוי בספק מסוים. כל PostgreSQL עם כתובת `postgresql://...` יעבוד.

---

## חלק ג — Render

### 1. פתיחת חשבון
1. נכנסים ל־https://render.com
2. לוחצים **Get Started** או **Sign Up**, ובוחרים **GitHub**.

### 2. חיבור GitHub
בפעם הראשונה Render מבקש הרשאה לגשת ל־Repositories. אפשר לבחור **Only select repositories** ולסמן רק את `hatzad-haba-backend`. אחר כך לוחצים **Install** או **Authorize**.

### 3. הכנת ערכים לפני יצירת השרת

| ערך | מה מזינים |
|---|---|
| `DATABASE_URL` | הכתובת מ־Neon (חלק ב) |
| `CORS_ORIGINS` | בינתיים: `http://localhost:5173`. אחרי שתעלו את אתר ה־React, מוסיפים את הכתובת שלו (ראו "עדכון CORS" בהמשך) |
| `SUPER_ADMIN_EMAIL` | הדוא״ל של המנהל הראשי, למשל הדוא״ל שלכם |
| `SUPER_ADMIN_PASSWORD` | סיסמה חזקה: **לפחות 12 תווים**, כולל אות וספרה. שומרים אותה! |

### 4. יצירת Web Service

יש שתי דרכים. מספיק לבחור אחת מהן.

#### דרך 1 (מומלצת) — Blueprint, לפי הקובץ `render.yaml`
1. בלוח הבקרה לוחצים **New +** ובוחרים **Blueprint**.
2. בוחרים את ה־Repository `hatzad-haba-backend` ולוחצים **Connect**.
3. Render קורא את `render.yaml` ומציג שירות בשם `hatzad-haba-api`.
4. **Blueprint Name:** `hatzad-haba`
5. ממלאים את הערכים שמתבקשים: `DATABASE_URL`, `CORS_ORIGINS`, `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`.

   `JWT_SECRET` נוצר אוטומטית כמחרוזת אקראית, ואין צורך להזין אותו.
6. לוחצים **Apply** (או **Deploy Blueprint**).

#### דרך 2 — יצירה ידנית
1. לוחצים **New +** ובוחרים **Web Service**.
2. בוחרים את ה־Repository `hatzad-haba-backend` ולוחצים **Connect**.
3. ממלאים:

   | שדה | ערך |
   |---|---|
   | **Name** | `hatzad-haba-api` |
   | **Region** | `Frankfurt (EU Central)` |
   | **Branch** | `main` |
   | **Root Directory** | משאירים ריק |
   | **Runtime / Language** | `Node` |
   | **Build Command** | `npm run render:build` |
   | **Start Command** | `npm start` |
   | **Instance Type** | `Free` |

4. ב־**Environment Variables** לוחצים **Add Environment Variable** לכל שורה:

   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `NODE_VERSION` | `22` |
   | `DATABASE_URL` | הכתובת מ־Neon |
   | `JWT_SECRET` | מחרוזת אקראית של 40 תווים לפחות (או לוחצים **Generate**, אם הכפתור קיים) |
   | `JWT_EXPIRES_IN` | `8h` |
   | `CORS_ORIGINS` | `http://localhost:5173` |
   | `SUPER_ADMIN_EMAIL` | הדוא״ל שלכם |
   | `SUPER_ADMIN_PASSWORD` | הסיסמה החזקה |
   | `APP_TIMEZONE` | `Asia/Jerusalem` |

5. ב־**Advanced** מגדירים **Health Check Path**: `/api/health`
6. לוחצים **Create Web Service** (או **Deploy Web Service**).

### 5. Build ו־Start — מה קורה בפועל
הפקודה `npm run render:build` מבצעת לפי הסדר:
1. `npm ci --include=dev` — התקנת הספריות.
2. `prisma generate` ו־`tsc` — הכנת Prisma והידור הקוד.
3. `prisma migrate deploy` — **יצירת הטבלאות במסד הנתונים** (Prisma Migrations).
4. Seed — יצירת 8 הסטטוסים הבסיסיים והמנהל הראשי.

הפקודה `npm start` מפעילה את השרת על הפורט ש־Render מספק.

### 6. Prisma Migrations
ה־Migrations רצות **אוטומטית** בכל Deploy, בשלב 3 שלמעלה, ולכן אין צורך להפעיל אותן ידנית. הפקודה בטוחה להרצה חוזרת, ומחילה רק Migrations חדשות.

### 7. Deploy
- ה־Deploy הראשון מתחיל מיד אחרי היצירה, ונמשך כמה דקות.
- בלשונית **Logs** אפשר לעקוב. בסוף צריכות להופיע השורות:
  ```
  [seed] סטטוסים בסיסיים: 8
  [seed] נוצר מנהל ראשי: ...
  השרת פועל על פורט 10000
  ```
- כשמופיע **Live** בירוק, השרת עלה.
- בכל העלאה של קוד חדש ל־GitHub מתבצע Deploy אוטומטי. אפשר גם להפעיל ידנית: **Manual Deploy**, ואז **Deploy latest commit**.

### 8. בדיקה שהשרת פעיל
בראש עמוד השירות מופיעה הכתובת, למשל `https://hatzad-haba-api.onrender.com`. פותחים בדפדפן:
```
https://hatzad-haba-api.onrender.com/api/health
```
צריך להופיע: `{"status":"ok","database":"ok",...}`

> **במסלול החינמי:** אחרי כרבע שעה בלי פניות, השרת "נרדם". הפנייה הבאה עלולה לקחת עד כדקה. זה תקין. כדאי לפתוח את `/api/health` כמה דקות לפני הצגת הפרויקט.

### נתוני הדגמה בענן (לא חובה)
כדי שלבודק יהיו חשבונות מוכנים עם מועמדויות לדוגמה:
1. ב־Render נכנסים ל־**Environment** ומוסיפים:
   - `SEED_DEMO_DATA` = `true`
   - `DEMO_PASSWORD` = סיסמה שתבחרו (לפחות 10 תווים, אות וספרה). זו תהיה הסיסמה של כל חשבונות ההדגמה.
2. לוחצים **Save Changes**. אם לא מתבצע Deploy אוטומטי, מפעילים **Manual Deploy**.
3. נוצרים החשבונות `ronit@example.com` ו־`yossi@example.com` (מנהלי מוסד), וכן `dana@example.com`, `yael@example.com` ו־`michal@example.com` (תלמידות), כולם עם הסיסמה שבחרתם.

הנתונים נוצרים פעם אחת בלבד. Deploy נוסף לא יוצר אותם שוב.

### עדכון CORS אחרי העלאת אתר ה־React
כשאתר ה־React יעלה (למשל ל־Netlify או Vercel), מעדכנים ב־Render את `CORS_ORIGINS` כך שיכלול את הכתובת שלו. אפשר כמה כתובות, מופרדות בפסיק:
```
https://my-app.netlify.app,http://localhost:5173
```
בלי `/` בסוף הכתובת. אחר כך **Save Changes**.

---

## חלק ד — בדיקה מלאה מתוך Swagger

### 1. פתיחת `/api/health`
`https://<הכתובת-שלכם>.onrender.com/api/health` צריך להחזיר `"status":"ok"`.

### 2. פתיחת `/api-docs`
`https://<הכתובת-שלכם>.onrender.com/api-docs` אמור להציג רשימת נתיבים מחולקת לקבוצות, ולמעלה כפתור **Authorize**.

### 3. התחברות מתוך Swagger
1. פותחים את **POST /api/auth/login** ולוחצים **Try it out**.
2. בגוף הבקשה כותבים את פרטי המנהל הראשי:
   ```json
   { "email": "הדוא״ל-שהגדרתם", "password": "הסיסמה-שהגדרתם" }
   ```
3. לוחצים **Execute**.

### 4. קבלת JWT
בתשובה (קוד 200) מופיע `"token": "eyJhbGciOi..."`. מעתיקים את הערך **בלי המירכאות**.

### 5. שימוש ב־Authorize
1. לוחצים על **Authorize** בראש העמוד.
2. מדביקים את ה־Token (בלי המילה Bearer, Swagger מוסיף אותה לבד).
3. לוחצים **Authorize** ואחר כך **Close**.

### 6. קריאה ל־Endpoint מוגן
- **GET /api/auth/me** ← **Try it out** ← **Execute**. אמורים לקבל 200 עם הפרטים שלכם.
- **בדיקת 401:** לוחצים **Authorize** ← **Logout**, ומריצים שוב את `/api/auth/me`. אמורים לקבל 401. אחר כך מתחברים שוב.

### 7. הוספת רשומה
מבצעים לפי הסדר (כמנהל ראשי):
1. **POST /api/institutions**, עם הגוף:
   ```json
   { "name": "מכללת הניסוי" }
   ```
   רושמים את ה־`id` שחזר (למשל 1).
2. **POST /api/users**, ליצירת מנהלת מוסד:
   ```json
   { "fullName": "מנהלת ניסוי", "email": "admin@test.com", "password": "Admin12345", "role": "INSTITUTION_ADMIN", "institutionId": 1 }
   ```
3. **POST /api/auth/register**, להרשמת תלמידה:
   ```json
   { "fullName": "תלמידת ניסוי", "email": "student@test.com", "password": "Student12345", "institutionId": 1 }
   ```
   רושמים את ה־`id` של התלמידה מתוך התשובה.
4. **PATCH /api/users/{id}/approve**, עם ה־`id` של התלמידה, לאישור שלה.
5. מתחברים כתלמידה (`student@test.com`), מעתיקים את ה־Token החדש ומדביקים ב־**Authorize**.
6. **GET /api/statuses**: רושמים את ה־`id` של "נשלחו קורות חיים" (בדרך כלל 1).
7. **POST /api/applications**, להוספת מועמדות:
   ```json
   { "companyName": "חברת ניסוי", "jobTitle": "מפתחת React", "submittedOn": "2026-10-01", "statusId": 1, "interestLevel": "HIGH" }
   ```
   מתקבל 201, ובתשובה גם `suggestedAction`, כלומר הצעה לצעד הבא.
8. **בדיקת 403:** כתלמידה, מריצים **GET /api/institutions**. אמורים לקבל 403, כי רק מנהל ראשי רשאי.

### 8. שליפת הרשומה ממסד הנתונים
- **דרך ה־API:** מריצים **GET /api/applications/{id}** עם ה־`id` שחזר בשלב 7. הנתונים מגיעים ממסד הנתונים.
- **ישירות במסד הנתונים:** ב־Neon נכנסים ל־**SQL Editor**, כותבים `SELECT * FROM applications;` ולוחצים **Run**. המועמדות מופיעה. אפשר גם לפתוח **Tables** ולבחור בטבלה `applications`.
- **בדיקה שהנתונים נשמרים לאורך זמן:** ב־Render מפעילים **Manual Deploy**, ואחרי שהשרת עולה שוב, מריצים שוב את `GET /api/applications/{id}`. הנתונים עדיין שם.

---

## חלק ה — פתרון תקלות

| תקלה | מה רואים | פתרון |
|---|---|---|
| **Build Failed** — לא נמצא `package.json` | `Could not read package.json` | הקבצים הועלו בתוך תיקייה נוספת ב־GitHub. מעלים מחדש את **התוכן** של `backend-project`, או מגדירים ב־Render ‏**Root Directory** = `backend-project` |
| **Build Failed** — שגיאה בהתקנה | `npm ERR!` / `npm ci` נכשל | ודאו ש־`package-lock.json` הועלה ל־GitHub. ודאו ש־`NODE_VERSION` = `22` |
| **DATABASE_URL שגוי** | `P1001: Can't reach database server` או `P1000: Authentication failed` | העתיקו שוב את הכתובת מ־Neon, בלי רווחים ובלי מירכאות, עם `?sslmode=require` בסוף. בדקו שהפרויקט ב־Neon פעיל |
| **שגיאת הגדרות** | `שגיאה בהגדרות הסביבה... DATABASE_URL חסר` | המשתנה לא הוגדר ב־Render. **Environment**, ואז **Add Environment Variable** |
| **בעיית Prisma / Migrations** | `P3009` / `migrate found failed migrations` | Migration קודמת נכשלה באמצע. הפתרון הפשוט במסד חדש וריק: ב־Neon מוחקים את ה־Database ויוצרים חדש (או יוצרים Branch חדש), מעדכנים את `DATABASE_URL` ומפעילים Deploy מחדש |
| **Prisma עם Pooler** | Migration נתקעת או `prepared statement already exists` | משתמשים בכתובת **ישירה** (ב־Neon: מכבים את Connection pooling; ב־Supabase: Session pooler, לא Transaction) |
| **JWT_SECRET חסר או קצר** | `JWT_SECRET חייב להכיל לפחות 32 תווים` | מגדירים `JWT_SECRET` עם 32 תווים לפחות |
| **סיסמת מנהל ראשי קצרה** | `ב־Production הסיסמה של המנהל הראשי צריכה להכיל לפחות 12 תווים` | מאריכים את `SUPER_ADMIN_PASSWORD` ומפעילים Deploy מחדש |
| **שגיאת נתוני הדגמה** | `ב־Production יש להגדיר DEMO_PASSWORD` | הגדרתם `SEED_DEMO_DATA=true` בלי `DEMO_PASSWORD`. מוסיפים אותו, או משנים ל־`false` |
| **שגיאת CORS** | בדפדפן של אתר ה־React: `blocked by CORS policy` | מוסיפים את כתובת האתר המדויקת ל־`CORS_ORIGINS` (עם `https://`, בלי `/` בסוף), ושומרים |
| **401 Unauthorized** | `UNAUTHORIZED` / `INVALID_TOKEN` / `TOKEN_EXPIRED` | לא נשלח Token, הוא הועתק לא נכון או שפג תוקפו (8 שעות). מתחברים מחדש ולוחצים שוב **Authorize** |
| **403 Forbidden** | `FORBIDDEN` | התפקיד אינו מורשה לפעולה, למשל תלמיד שמנסה ליצור מוסד. מתחברים עם משתמש מתאים |
| **403 בהתחברות** | `ACCOUNT_PENDING` | התלמיד עדיין לא אושר. מנהל המוסד מאשר ב־`PATCH /api/users/{id}/approve` |
| **Swagger לא נפתח** | עמוד ריק או 404 | פותחים בדיוק `/api-docs` (באותיות קטנות). מחכים כדקה אם השרת "ישן". בודקים ב־**Logs** שהשרת עלה |
| **השרת לא עולה** | ב־Logs: `Port scan timeout` או קריסה | ודאו ש־**Start Command** = `npm start`, ושה־Build הצליח. אין להגדיר `PORT` ידנית. בודקים ב־Logs את השגיאה הראשונה שמופיעה |
| **התחברות כמנהל ראשי נכשלת** | `INVALID_CREDENTIALS` | המנהל נוצר רק בפעם הראשונה. אם שיניתם את הסיסמה במשתני הסביבה אחר כך, היא לא מתעדכנת. השתמשו בסיסמה המקורית |
| **השרת איטי מאוד בפנייה הראשונה** | המתנה של כדקה | זה המסלול החינמי: השרת "התעורר". זה תקין |

---

## הרצה מקומית (לא חובה)

אם תרצו להריץ את השרת גם במחשב:
1. מתקינים Node.js 22 מ־https://nodejs.org (גרסת LTS).
2. בתיקיית הפרויקט מעתיקים את `.env.example` לקובץ חדש בשם `.env`, וממלאים בו את `DATABASE_URL` (אפשר כתובת של מסד Neon נוסף) ואת `JWT_SECRET`.
3. בטרמינל, בתוך תיקיית הפרויקט:
   ```
   npm install
   npm run db:migrate
   npm run db:seed
   npm run dev
   ```
4. פותחים http://localhost:3000/api-docs

פרטים נוספים בקובץ `README.md`.
