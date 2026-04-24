/**
 * Unified Result type for use cases
 * Provides consistent success/error handling across the application
 */

export type Result<T, E = string> = Success<T> | Failure<E>;

export interface Success<T> {
  success: true;
  data: T;
}

export interface Failure<E = string> {
  success: false;
  error: E;
  code?: ErrorCode;
}

export enum ErrorCode {
  // Validation errors (400)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Authentication/Authorization errors (401/403)
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  
  // Not found errors (404)
  NOT_FOUND = 'NOT_FOUND',
  
  // Conflict errors (409)
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
  
  // Server errors (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
}

/**
 * Helper functions to create Result instances
 */
export class ResultHelper {
  static success<T>(data: T): Success<T> {
    return {
      success: true,
      data,
    };
  }

  static failure<E = string>(error: E, code?: ErrorCode): Failure<E> {
    return {
      success: false,
      error,
      code,
    };
  }

  static validationError(message: string): Failure<string> {
    return this.failure(message, ErrorCode.VALIDATION_ERROR);
  }

  static notFound(message: string): Failure<string> {
    return this.failure(message, ErrorCode.NOT_FOUND);
  }

  static unauthorized(message: string): Failure<string> {
    return this.failure(message, ErrorCode.UNAUTHORIZED);
  }

  static forbidden(message: string): Failure<string> {
    return this.failure(message, ErrorCode.FORBIDDEN);
  }

  static conflict(message: string): Failure<string> {
    return this.failure(message, ErrorCode.CONFLICT);
  }

  static internalError(message: string): Failure<string> {
    return this.failure(message, ErrorCode.INTERNAL_ERROR);
  }
}

/**
 * Maps error codes to HTTP status codes
 */
export function getHttpStatusFromErrorCode(code?: ErrorCode): number {
  switch (code) {
    case ErrorCode.VALIDATION_ERROR:
    case ErrorCode.INVALID_INPUT:
      return 400;
    case ErrorCode.UNAUTHORIZED:
      return 401;
    case ErrorCode.FORBIDDEN:
      return 403;
    case ErrorCode.NOT_FOUND:
      return 404;
    case ErrorCode.ALREADY_EXISTS:
    case ErrorCode.CONFLICT:
      return 409;
    case ErrorCode.INTERNAL_ERROR:
    case ErrorCode.DATABASE_ERROR:
    case ErrorCode.EXTERNAL_SERVICE_ERROR:
    default:
      return 500;
  }
}
