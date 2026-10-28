import 'dotenv/config';
import { defineConfig } from 'vitest/config';

// הבדיקות רצות מול מסד PostgreSQL אמיתי ונפרד (TEST_DATABASE_URL).
// כל הנתונים בו נמחקים לפני כל בדיקה — לעולם אל תפנו אותו למסד הנתונים האמיתי.
const testDatabaseUrl = process.env.TEST_DATABASE_URL ?? 'postgresql://app:app@localhost:5432/hatzad_test';

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: ['tests/globalSetup.ts'],
    setupFiles: ['tests/setup.ts'],
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 60000,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: testDatabaseUrl,
      JWT_SECRET: 'test-secret-that-is-long-enough-for-hs256-signing',
      JWT_EXPIRES_IN: '1h',
      BCRYPT_ROUNDS: '4',
      CORS_ORIGINS: 'http://localhost:5173',
      APP_TIMEZONE: 'Asia/Jerusalem',
    },
  },
});
