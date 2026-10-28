import { afterAll } from 'vitest';
import { prisma } from '../src/db/prisma';

if (!/test/i.test(process.env.DATABASE_URL ?? '')) {
  throw new Error('Refusing to run tests against a non-test database');
}

afterAll(async () => {
  await prisma.$disconnect();
});
