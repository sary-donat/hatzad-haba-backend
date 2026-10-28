import { describe, expect, it } from 'vitest';
import { api } from './helpers';

describe('בריאות השרת ושגיאות כלליות', () => {
  it('GET /api/health מחזיר ok כולל מסד הנתונים', async () => {
    const res = await api().get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', database: 'ok' });
  });

  it('נתיב שאינו קיים (ציבורי) מחזיר 404 במבנה אחיד', async () => {
    const res = await api().get('/no-such-route');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
  });

  it('JSON לא תקין מחזיר 400', async () => {
    const res = await api().post('/api/auth/login').set('Content-Type', 'application/json').send('{"email": ');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  it('CORS מאפשר את הכתובת שהוגדרה בלבד', async () => {
    const allowed = await api().get('/api/health').set('Origin', 'http://localhost:5173');
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    const other = await api().get('/api/health').set('Origin', 'http://evil.example.com');
    expect(other.headers['access-control-allow-origin']).toBeUndefined();
  });
});
