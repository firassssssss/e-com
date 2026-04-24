import { Service, Container } from 'typedi';
import { IRequestScopedLogger } from '../../core/services/ILogger.js';
import { RequestScopedLogger } from './RequestScopedLogger.js';

@Service()
export class LoggerFactory {
  createRequestLogger(requestId: string): IRequestScopedLogger {
    const logger = new RequestScopedLogger();
    logger.setRequestId(requestId);
    return logger;
  }

  static getRequestLogger(): IRequestScopedLogger {
    try {
      return Container.get('IRequestLogger') as IRequestScopedLogger;
    } catch (error) {
      throw new Error('No request-scoped logger available. Make sure requestContextMiddleware is properly configured.');
    }
  }
}
