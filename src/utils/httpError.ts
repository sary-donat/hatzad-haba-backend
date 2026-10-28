export interface ErrorDetail {
  field: string;
  message: string;
}

/** שגיאה שמוחזרת ללקוח עם קוד HTTP מתאים */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: ErrorDetail[],
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const badRequest = (message: string, code = 'BAD_REQUEST', details?: ErrorDetail[]) =>
  new HttpError(400, code, message, details);

export const unauthorized = (message = 'נדרשת התחברות', code = 'UNAUTHORIZED') =>
  new HttpError(401, code, message);

export const forbidden = (message = 'אין לך הרשאה לבצע פעולה זו', code = 'FORBIDDEN') =>
  new HttpError(403, code, message);

export const notFound = (message = 'הפריט המבוקש לא נמצא', code = 'NOT_FOUND') =>
  new HttpError(404, code, message);

export const conflict = (message: string, code = 'CONFLICT') => new HttpError(409, code, message);

/** שגיאת ולידציה על שדה אחד */
export const fieldError = (field: string, message: string) =>
  badRequest('הנתונים שנשלחו אינם תקינים', 'VALIDATION_ERROR', [{ field, message }]);
