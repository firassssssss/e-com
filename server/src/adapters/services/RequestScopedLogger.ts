import { Service } from 'typedi';
import { IRequestScopedLogger } from '../../core/services/ILogger.js';

@Service()
export class RequestScopedLogger implements IRequestScopedLogger {
  private requestId?: string;

  setRequestId(requestId: string): void {
    this.requestId = requestId;
  }

  getRequestId(): string | undefined {
    return this.requestId;
  }

  private formatMessage(level: string, message: string, meta?: Record<string, any>): string {
    const timestamp = new Date().toISOString();
    const reqId = this.requestId ? ` [${this.requestId}]` : '';
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}${reqId}: ${message}${metaStr}`;
  }

  info(message: string, meta?: Record<string, any>): void {
    console.log(this.formatMessage('info', message, meta));
  }

  warn(message: string, meta?: Record<string, any>): void {
    console.warn(this.formatMessage('warn', message, meta));
  }

  error(message: string, error?: Error, meta?: Record<string, any>): void {
    const errorMeta = error ? { ...meta, error: error.message, stack: error.stack } : meta;
    console.error(this.formatMessage('error', message, errorMeta));
  }

  debug(message: string, meta?: Record<string, any>): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('debug', message, meta));
    }
  }
}
