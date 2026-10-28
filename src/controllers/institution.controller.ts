import type { Request, Response } from 'express';
import * as institutionService from '../services/institution.service';
import { idParamSchema } from '../validation/common.schemas';
import {
  createInstitutionSchema,
  institutionSearchQuery,
  updateInstitutionSchema,
} from '../validation/institution.schemas';

export async function listPublic(req: Request, res: Response) {
  const { search } = institutionSearchQuery.parse(req.query);
  res.json(await institutionService.listPublic(search));
}

export async function list(req: Request, res: Response) {
  const { search } = institutionSearchQuery.parse(req.query);
  res.json(await institutionService.listAll(search));
}

export async function create(req: Request, res: Response) {
  res.status(201).json(await institutionService.create(createInstitutionSchema.parse(req.body)));
}

export async function update(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  res.json(await institutionService.update(id, updateInstitutionSchema.parse(req.body)));
}
