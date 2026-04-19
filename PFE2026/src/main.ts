import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { useExpressServer } from 'routing-controllers';
import { useContainer } from 'routing-controllers';
import { setupOpenAPIDocs } from './config/openapi.js';
import { authorizationChecker, currentUserChecker } from './api/middlewares/authenticationCheckers.js';
import { errorHandlerMiddleware } from './api/middlewares/errorHandlerMiddleware.js';
import { serviceAuthMiddleware } from './api/middlewares/serviceAuthMiddleware.js';
import { requestContextMiddleware } from './api/middlewares/requestContextMiddleware.js';
import { auth } from './lib/auth.js';
import { toNodeHandler } from 'better-auth/node';
import { ExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { eventsQueue } from './infrastructure/queue/eventsQueue.js';
import Container from './config/Containers/AppContainers.js';
import controllers from './api/controllers/index.js';

const app: Application = express();


// 1. CORS — must be absolute first
app.use(cors({
  origin: "http://localhost:3001",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// 2. Helmet
app.use((req, res, next) => {
  if (req.path.startsWith('/docs') || req.path.startsWith('/api/auth/reference')) {
    return helmet({ contentSecurityPolicy: false })(req, res, next);
  }
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "http://localhost:3000", "http://localhost:3001"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  })(req, res, next);
});

// 3. Better Auth
app.use('/api/auth', (req, res) => toNodeHandler(auth)(req, res));

// 4. Request context + logging
app.use(requestContextMiddleware);
app.use(morgan('combined'));

const port: number = parseInt(process.env.PORT || '3000');

useContainer(Container);

import { EventRegistry } from './infrastructure/events/EventRegistry.js';
Container.get(EventRegistry).initialize();

// 5. Routing controllers
useExpressServer(app, {
  routePrefix: '/api',
  controllers,
  validation: true,
  classTransformer: true,
  defaultErrorHandler: false,
  authorizationChecker,
  currentUserChecker,
});

// BullMQ Dashboard — only if Redis is available
if (eventsQueue) {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');
  createBullBoard({ queues: [new BullMQAdapter(eventsQueue)], serverAdapter });
  app.use('/admin/queues', serverAdapter.getRouter());
}

// 7. OpenAPI docs
try {
  setupOpenAPIDocs(app);
} catch (err) {
  console.warn('⚠️  OpenAPI doc generation failed (non-fatal):', (err as Error).message);
}


// -- RAG auto-sync on product mutations -----------------------
const RAG_SERVICE_URL = process.env.RAG_URL || 'http://localhost:8001';
app.use('/api/products', (req: Request, _res: Response, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    _res.on('finish', () => {
      if (_res.statusCode < 400) {
        import('axios').then(({ default: ax }) => {
          ax.post(`${RAG_SERVICE_URL}/sync`, {}, {
            timeout: 120_000,
            headers: { Authorization: `Bearer ${process.env.RASA_SERVICE_TOKEN ?? ''}` },
          })
            .then(() => console.log('[RAG] Auto-sync triggered'))
            .catch((e: Error) => console.warn('[RAG] Auto-sync failed:', e.message));
        });
      }
    });
  }
  next();
});
// 8. Error handler — must be last
app.use(errorHandlerMiddleware);

app.get('/', (req: Request, res: Response) => {
  res.send(`Hello from ${process.env.APP_NAME} v${process.env.APP_VERSION}! API docs at /docs`);
});

export { app };

if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(port, () => {
    console.log(`✅ Server is running on http://localhost:${port}`);
    console.log(`✅ API documentation available at http://localhost:${port}/docs`);
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Error: Port ${port} is already in use.`);
      process.exit(1);
    } else {
      console.error(`An error occurred while starting the server:`, error);
      process.exit(1);
    }
  });
}







