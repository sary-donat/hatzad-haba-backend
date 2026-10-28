import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { HttpError } from '../utils/httpError';

interface ErrorBody {
  error: {
    code: string;
    message: string;
    details?: { field: string; message: string }[];
  };
}

function send(res: Response, status: number, body: ErrorBody['error']): void {
  res.status(status).json({ error: body } satisfies ErrorBody);
}

/** מטפל מרכזי בשגיאות — כל שגיאה מוחזרת ללקוח במבנה אחיד */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof HttpError) {
    send(res, err.status, { code: err.code, message: err.message, details: err.details });
    return;
  }

  if (err instanceof ZodError) {
    send(res, 400, {
      code: 'VALIDATION_ERROR',
      message: 'הנתונים שנשלחו אינם תקינים',
      details: err.issues.map((issue) => ({
        field: issue.path.join('.') || '(root)',
        message: issue.message,
      })),
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      send(res, 409, { code: 'CONFLICT', message: 'קיים כבר פריט עם ערך זהה' });
      return;
    }
    if (err.code === 'P2025') {
      send(res, 404, { code: 'NOT_FOUND', message: 'הפריט המבוקש לא נמצא' });
      return;
    }
  }

  // שגיאות של קריאת גוף הבקשה (JSON לא תקין או גדול מדי)
  if (typeof err === 'object' && err !== null && 'type' in err) {
    const type = (err as { type?: string }).type;
    if (type === 'entity.parse.failed') {
      send(res, 400, { code: 'INVALID_JSON', message: 'גוף הבקשה אינו JSON תקין' });
      return;
    }
    if (type === 'entity.too.large') {
      send(res, 413, { code: 'PAYLOAD_TOO_LARGE', message: 'גוף הבקשה גדול מדי' });
      return;
    }
  }

  console.error('Unhandled error:', err);
  send(res, 500, { code: 'INTERNAL_ERROR', message: 'אירעה שגיאה בשרת. נסו שוב מאוחר יותר' });
}

export function notFoundHandler(_req: Request, res: Response): void {
  send(res, 404, { code: 'ROUTE_NOT_FOUND', message: 'הכתובת המבוקשת אינה קיימת' });
}
