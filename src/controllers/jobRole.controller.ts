import type { Request, Response } from 'express';
import { currentUser } from '../auth/authUser';
import * as jobRoleService from '../services/jobRole.service';
import { idParamSchema } from '../validation/common.schemas';
import { createJobRoleSchema, listCatalogQuery, updateJobRoleSchema } from '../validation/jobRole.schemas';

export async function list(req: Request, res: Response) {
  res.json(await jobRoleService.list(currentUser(req), listCatalogQuery.parse(req.query)));
}

export async function create(req: Request, res: Response) {
  res.status(201).json(await jobRoleService.create(currentUser(req), createJobRoleSchema.parse(req.body)));
}

export async function update(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  res.json(await jobRoleService.update(currentUser(req), id, updateJobRoleSchema.parse(req.body)));
}

export async function listPublicForInstitution(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  res.json(await jobRoleService.listPublicForInstitution(id));
}
