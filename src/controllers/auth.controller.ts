import type { Request, Response } from 'express';
import { currentUser } from '../auth/authUser';
import * as authService from '../services/auth.service';
import { loginSchema, registerSchema, updateMyJobRolesSchema } from '../validation/auth.schemas';

export async function register(req: Request, res: Response) {
  res.status(201).json(await authService.register(registerSchema.parse(req.body)));
}

export async function login(req: Request, res: Response) {
  res.json(await authService.login(loginSchema.parse(req.body)));
}

export async function me(req: Request, res: Response) {
  res.json(await authService.getMe(currentUser(req).id));
}

export async function updateMyJobRoles(req: Request, res: Response) {
  res.json(await authService.updateMyJobRoles(currentUser(req), updateMyJobRolesSchema.parse(req.body)));
}
