import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import * as actions from '../controllers/action.controller';
import * as applications from '../controllers/application.controller';
import * as auth from '../controllers/auth.controller';
import * as dashboard from '../controllers/dashboard.controller';
import { health } from '../controllers/health.controller';
import * as institutions from '../controllers/institution.controller';
import * as jobRoles from '../controllers/jobRole.controller';
import * as notifications from '../controllers/notification.controller';
import * as statuses from '../controllers/status.controller';
import * as users from '../controllers/user.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';

const SUPER = 'SUPER_ADMIN' as const;
const ADMINS = ['SUPER_ADMIN', 'INSTITUTION_ADMIN'] as const;

// הגבלת ניסיונות התחברות והרשמה — הגנה בסיסית מפני ניחוש סיסמאות
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => env.isTest,
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'יותר מדי ניסיונות. נסו שוב בעוד כמה דקות' } },
});

export const apiRouter = Router();

// ציבורי
apiRouter.get('/health', health);
apiRouter.post('/auth/register', authLimiter, auth.register);
apiRouter.post('/auth/login', authLimiter, auth.login);
apiRouter.get('/institutions/public', institutions.listPublic);
apiRouter.get('/institutions/:id/job-roles', jobRoles.listPublicForInstitution);

// מכאן והלאה — נדרש Token
apiRouter.use(authenticate);

apiRouter.get('/auth/me', auth.me);
apiRouter.put('/auth/me/job-roles', auth.updateMyJobRoles);

apiRouter.get('/institutions', requireRole(SUPER), institutions.list);
apiRouter.post('/institutions', requireRole(SUPER), institutions.create);
apiRouter.patch('/institutions/:id', requireRole(SUPER), institutions.update);

apiRouter.get('/users', requireRole(...ADMINS), users.list);
apiRouter.post('/users', requireRole(SUPER), users.create);
apiRouter.get('/users/:id', requireRole(...ADMINS), users.getById);
apiRouter.patch('/users/:id', requireRole(...ADMINS), users.update);
apiRouter.patch('/users/:id/approve', requireRole(...ADMINS), users.approve);
apiRouter.patch('/users/:id/reject', requireRole(...ADMINS), users.reject);

apiRouter.get('/job-roles', jobRoles.list);
apiRouter.post('/job-roles', requireRole(...ADMINS), jobRoles.create);
apiRouter.patch('/job-roles/:id', requireRole(...ADMINS), jobRoles.update);

apiRouter.get('/statuses', statuses.list);
apiRouter.post('/statuses', requireRole(...ADMINS), statuses.create);
apiRouter.patch('/statuses/:id', requireRole(...ADMINS), statuses.update);

apiRouter.get('/applications', applications.list);
apiRouter.post('/applications', applications.create);
apiRouter.get('/applications/:id', applications.getById);
apiRouter.patch('/applications/:id', applications.update);
apiRouter.delete('/applications/:id', applications.remove);

apiRouter.get('/applications/:id/actions', actions.listForApplication);
apiRouter.post('/applications/:id/actions', actions.create);
apiRouter.patch('/actions/:id', actions.update);
apiRouter.delete('/actions/:id', actions.remove);

apiRouter.get('/dashboard', dashboard.get);

apiRouter.get('/notifications', notifications.list);
apiRouter.get('/notifications/unread-count', notifications.unreadCount);
apiRouter.patch('/notifications/read-all', notifications.markAllRead);
apiRouter.patch('/notifications/:id/read', notifications.markRead);
