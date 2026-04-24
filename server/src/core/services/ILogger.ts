export interface ILogger {
  info(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  error(message: string, error?: Error, meta?: Record<string, any>): void;
  debug(message: string, meta?: Record<string, any>): void;
}

export interface IRequestScopedLogger extends ILogger {
  setRequestId(requestId: string): void;
  getRequestId(): string | undefined;
}
