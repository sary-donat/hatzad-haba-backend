import type { Request, Response } from 'express';
import { currentUser } from '../auth/authUser';
import * as actionService from '../services/action.service';
import { createActionSchema, listActionsQuery, updateActionSchema } from '../validation/action.schemas';
import { idParamSchema } from '../validation/common.schemas';

export async function listForApplication(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const { status } = listActionsQuery.parse(req.query);
  res.json(await actionService.listForApplication(currentUser(req), id, status));
}

export async function create(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  res.status(201).json(await actionService.create(currentUser(req), id, createActionSchema.parse(req.body)));
}

export async function update(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  res.json(await actionService.update(currentUser(req), id, updateActionSchema.parse(req.body)));
}

export async function remove(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  await actionService.remove(currentUser(req), id);
  res.status(204).end();
}
