import type { Request, Response } from 'express';
import { currentUser } from '../auth/authUser';
import * as statusService from '../services/status.service';
import { idParamSchema } from '../validation/common.schemas';
import { listCatalogQuery } from '../validation/jobRole.schemas';
import { createStatusSchema, updateStatusSchema } from '../validation/status.schemas';

export async function list(req: Request, res: Response) {
  res.json(await statusService.list(currentUser(req), listCatalogQuery.parse(req.query)));
}

export async function create(req: Request, res: Response) {
  res.status(201).json(await statusService.create(currentUser(req), createStatusSchema.parse(req.body)));
}

export async function update(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  res.json(await statusService.update(currentUser(req), id, updateStatusSchema.parse(req.body)));
}
