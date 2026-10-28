import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { openApiDocument } from './docs/openapi';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiRouter } from './routes';

export function createApp() {
  const app = express();

  // Render ושירותי ענן אחרים מעבירים את הבקשות דרך Proxy
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  // Swagger UI משתמש בסקריפטים פנימיים, ולכן CSP מוגדר רק לשאר הנתיבים
  app.use('/api-docs', helmet({ contentSecurityPolicy: false }));
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  const allowAll = env.corsOrigins.includes('*');
  app.use(
    cors({
      origin: allowAll ? true : env.corsOrigins,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 600,
    }),
  );

  app.use(express.json({ limit: '100kb' }));

  app.get('/', (_req, res) => {
    res.json({ name: 'הצעד הבא — API', docs: '/api-docs', health: '/api/health' });
  });
  app.get('/openapi.json', (_req, res) => {
    res.json(openApiDocument);
  });
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument, {
      customSiteTitle: 'הצעד הבא — API',
      swaggerOptions: { persistAuthorization: true, displayRequestDuration: true },
    }),
  );

  app.use('/api', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
