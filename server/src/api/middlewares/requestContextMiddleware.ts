import { Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import { v4 as uuid } from 'uuid';
import { LoggerFactory } from '../../adapters/services/LoggerFactory.js';

// Extend Express Request interface to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

export function requestContextMiddleware(req: Request, res: Response, next: NextFunction) {
  // Generate unique request ID
  req.requestId = uuid();
  
  // Create a new logger instance for this request
  const loggerFactory = Container.get(LoggerFactory);
  const logger = loggerFactory.createRequestLogger(req.requestId);
  
  // Register the logger in the container for this request
  Container.set('IRequestLogger', logger);
  
  // Add cleanup after response
  res.on('finish', () => {
    Container.remove('IRequestLogger');
  });
  
  next();
}
