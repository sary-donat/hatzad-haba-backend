import type { Request, Response } from 'express';
import { prisma } from '../db/prisma';

export async function health(_req: Request, res: Response) {
  const startedAt = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'ok', uptimeSeconds: Math.round(process.uptime()), responseMs: Date.now() - startedAt, time: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'error', database: 'unavailable', time: new Date().toISOString() });
  }
}
