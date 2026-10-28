import { execSync } from 'node:child_process';

export default function setup() {
  const url = process.env.TEST_DATABASE_URL ?? 'postgresql://app:app@localhost:5432/hatzad_test';
  if (!/test/i.test(url)) {
    throw new Error('TEST_DATABASE_URL חייב להכיל את המילה test בשם מסד הנתונים, כדי למנוע מחיקת נתונים אמיתיים');
  }
  // מריץ את ה־Migrations על מסד הבדיקות
  execSync('npx prisma migrate deploy', { stdio: 'inherit', env: { ...process.env, DATABASE_URL: url } });
}
