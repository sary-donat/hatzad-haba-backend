import type { Request, Response } from 'express';
import { currentUser } from '../auth/authUser';
import { getDashboard } from '../services/dashboard.service';
import { dashboardQuery } from '../validation/notification.schemas';

export async function get(req: Request, res: Response) {
  const { userId } = dashboardQuery.parse(req.query);
  res.json(await getDashboard(currentUser(req), userId));
}
