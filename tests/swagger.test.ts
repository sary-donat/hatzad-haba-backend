import { readFileSync } from 'node:fs';
import path from 'node:path';
import SwaggerParser from '@apidevtools/swagger-parser';
import { beforeAll, describe, expect, it } from 'vitest';
import { openApiDocument } from '../src/docs/openapi';
import { apiRouter } from '../src/routes';
import { api, bearer, createFixture, type Fixture } from './helpers';

const clone = () => JSON.parse(JSON.stringify(openApiDocument));

/** כל הנתיבים שמוגדרים ב־Express, בפורמט "get /api/applications/{id}" */
function expressRoutes(): string[] {
  const routes: string[] = [];
  for (const layer of apiRouter.stack as { route?: { path: string; methods: Record<string, boolean> } }[]) {
    if (!layer.route) continue;
    const url = `/api${layer.route.path.replace(/:(\w+)/g, '{$1}')}`;
    for (const method of Object.keys(layer.route.methods)) {
      routes.push(`${method} ${url}`);
    }
  }
  return routes.sort();
}

function documentedRoutes(): string[] {
  const routes: string[] = [];
  for (const [url, item] of Object.entries(openApiDocument.paths)) {
    for (const method of Object.keys(item)) {
      routes.push(`${method} ${url}`);
    }
  }
  return routes.sort();
}

describe('Swagger / OpenAPI', () => {
  let f: Fixture;
  beforeAll(async () => {
    f = await createFixture();
  });

  it('המסמך תקין לפי תקן OpenAPI 3', async () => {
    await expect(SwaggerParser.validate(clone())).resolves.toBeTruthy();
  });

  it('כל נתיב ב־Express מתועד, וכל נתיב מתועד קיים בשרת', () => {
    expect(documentedRoutes()).toEqual(expressRoutes());
    expect(documentedRoutes()).toHaveLength(36);
  });

  it('לכל פעולה יש תיאור, הרשאה ותשובות שגיאה מתאימות', () => {
    for (const [url, item] of Object.entries(openApiDocument.paths)) {
      for (const [method, op] of Object.entries(item) as [string, Record<string, unknown>][]) {
        const name = `${method} ${url}`;
        expect(op.summary, name).toBeTruthy();
        expect(String(op.description), name).toContain('הרשאה');
        const responses = op.responses as Record<string, unknown>;
        const isPublic = Array.isArray(op.security) && op.security.length === 0;
        if (!isPublic) {
          expect(responses['401'], `${name} חסר 401`).toBeDefined();
        }
      }
    }
  });

  it('מוגדר Security Scheme מסוג HTTP Bearer JWT', () => {
    expect(openApiDocument.components.securitySchemes.bearerAuth).toMatchObject({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' });
  });

  it('Swagger UI זמין ב־/api-docs', async () => {
    const res = await api().get('/api-docs/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('swagger-ui');
    const init = await api().get('/api-docs/swagger-ui-init.js');
    expect(init.status).toBe(200);
    expect(init.text).toContain('bearerAuth');
  });

  it('GET /openapi.json מחזיר את המסמך', async () => {
    const res = await api().get('/openapi.json');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(clone());
  });

  it('הקובץ openapi.json בפרויקט מעודכן (npm run openapi:export)', () => {
    const file = JSON.parse(readFileSync(path.join(__dirname, '..', 'openapi.json'), 'utf8'));
    expect(file).toEqual(clone());
  });

  it('כל נתיב מתועד מגיב בשרת (לא ROUTE_NOT_FOUND)', async () => {
    for (const route of documentedRoutes()) {
      const [method, url] = route.split(' ') as [string, string];
      const realUrl = url.replace(/\{\w+\}/g, '1');
      const req = (api() as unknown as Record<string, (u: string) => import('supertest').Test>)[method]!(realUrl);
      const res = await req.set(bearer(f.superAdmin.token)).send({});
      expect(res.body?.error?.code, route).not.toBe('ROUTE_NOT_FOUND');
    }
  });
});
