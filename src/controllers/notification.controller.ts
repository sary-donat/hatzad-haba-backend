import type { Request, Response } from 'express';
import { currentUser } from '../auth/authUser';
import * as notificationService from '../services/notification.service';
import { idParamSchema } from '../validation/common.schemas';
import { listNotificationsQuery } from '../validation/notification.schemas';

export async function list(req: Request, res: Response) {
  res.json(await notificationService.list(currentUser(req), listNotificationsQuery.parse(req.query)));
}

export async function unreadCount(req: Request, res: Response) {
  res.json({ count: await notificationService.unreadCountFor(currentUser(req).id) });
}

export async function markRead(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  res.json(await notificationService.markRead(currentUser(req), id));
}

export async function markAllRead(req: Request, res: Response) {
  res.json(await notificationService.markAllRead(currentUser(req)));
}
