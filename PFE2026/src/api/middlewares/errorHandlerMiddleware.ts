import { Request, Response, NextFunction, Application } from 'express';
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { randomUUID } from "crypto";
import { HttpError } from 'routing-controllers';
import { NotFoundError } from '../../core/errors/NotFoundError.js';
import { ValidationError } from 'class-validator';

export function initSentry(app: Application): void {
  if (!process.env.SENTRY_DSN) {
    console.warn("[Sentry] SENTRY_DSN not set — error tracking disabled");
    return;
  }
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV ?? "production",
    integrations: [
      Sentry.httpIntegration(),
      Sentry.expressIntegration({ app }),
      nodeProfilingIntegration(),
    ],
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers["authorization"];
        delete event.request.headers["cookie"];
      }
      return event;
    },
  });
}

export function errorHandlerMiddleware(error: any, req: Request, res: Response, next: NextFunction) {
  console.error('Error caught by middleware:');
  console.error('Name:', error.name);
  console.error('Message:', error.message);
  if (error.errors) console.error('Validation Errors:', error.errors);
  if (error.stack) console.error('Stack:', error.stack);

  if (res.headersSent) return next(error);

  if (error instanceof NotFoundError || error.name === 'NotFoundError') {
    res.status(404).json({ status: 404, name: 'NotFoundError', message: error.message || 'Resource not found.' });
    return;
  }

  if (error instanceof HttpError && error.httpCode === 400 && Array.isArray((error as any).errors)) {
    const validationErrors = (error as any).errors as ValidationError[];
    if (validationErrors.every(err => err instanceof ValidationError)) {
      res.status(400).json({
        status: 400,
        name: 'ValidationError',
        message: error.message || 'Input validation failed.',
        errors: validationErrors.map((err: ValidationError) => ({
          property: err.property,
          constraints: err.constraints,
          contexts: err.contexts,
        })),
      });
      return;
    }
  }

  if (error instanceof HttpError) {
    res.status(error.httpCode || 500).json({
      status: error.httpCode || 500,
      name: error.name || 'HttpError',
      message: error.message || 'An error occurred.',
    });
    return;
  }

  // 500 — generate error ID and report to Sentry
  const errorId = randomUUID();

  if (process.env.SENTRY_DSN) {
    Sentry.withScope((scope) => {
      scope.setTag("error_id", errorId);
      scope.setTag("path", req.path);
      scope.setTag("method", req.method);
      const userId = (req as any).userId as string | undefined;
      if (userId) scope.setUser({ id: userId });
      Sentry.captureException(error);
    });
  }

  res.status(500).json({
    status: 500,
    name: error.name || 'InternalServerError',
    message: `Something went wrong. If this persists, reference error ID: ${errorId}`,
    errorId,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
}