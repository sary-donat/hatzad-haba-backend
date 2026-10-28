import type { Request, Response } from 'express';
import { currentUser } from '../auth/authUser';
import * as userService from '../services/user.service';
import { idParamSchema } from '../validation/common.schemas';
import { createUserSchema, listUsersQuery, updateUserSchema } from '../validation/user.schemas';

export async function list(req: Request, res: Response) {
  res.json(await userService.list(currentUser(req), listUsersQuery.parse(req.query)));
}

export async function getById(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  res.json(await userService.getById(currentUser(req), id));
}

export async function create(req: Request, res: Response) {
  res.status(201).json(await userService.create(currentUser(req), createUserSchema.parse(req.body)));
}

export async function update(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  res.json(await userService.update(currentUser(req), id, updateUserSchema.parse(req.body)));
}

export async function approve(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  res.json(await userService.setApproval(currentUser(req), id, 'APPROVED'));
}

export async function reject(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  res.json(await userService.setApproval(currentUser(req), id, 'REJECTED'));
}
