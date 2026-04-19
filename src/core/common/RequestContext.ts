import { Container } from 'typedi';
import { IRequestScopedLogger } from '../services/ILogger.js';

export class RequestContext {
  static getLogger(): IRequestScopedLogger {
    try {
      return Container.get('IRequestLogger') as IRequestScopedLogger;
    } catch (error) {
      throw new Error('No request-scoped logger available. Make sure requestContextMiddleware is properly configured.');
    }
  }

  static getRequestId(): string {
    const logger = this.getLogger();
    const requestId = logger.getRequestId();
    if (!requestId) {
      throw new Error('No request ID available in logger.');
    }
    return requestId;
  }
}
