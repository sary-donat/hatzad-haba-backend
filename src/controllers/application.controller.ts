import type { Request, Response } from 'express';
import { currentUser } from '../auth/authUser';
import * as applicationService from '../services/application.service';
import {
  createApplicationSchema,
  listApplicationsQuery,
  updateApplicationSchema,
} from '../validation/application.schemas';
import { idParamSchema } from '../validation/common.schemas';

export async function list(req: Request, res: Response) {
  res.json(await applicationService.list(currentUser(req), listApplicationsQuery.parse(req.query)));
}

export async function getById(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  res.json(await applicationService.getById(currentUser(req), id));
}

export async function create(req: Request, res: Response) {
  res.status(201).json(await applicationService.create(currentUser(req), createApplicationSchema.parse(req.body)));
}

export async function update(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  res.json(await applicationService.update(currentUser(req), id, updateApplicationSchema.parse(req.body)));
}

export async function remove(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  await applicationService.remove(currentUser(req), id);
  res.status(204).end();
}
