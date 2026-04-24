import { Response } from 'express';
import { Result, getHttpStatusFromErrorCode } from '../../core/common/Result.js';

/**
 * Base controller class with unified response handling
 */
export abstract class BaseController {
  /**
   * Handles Result type and sends appropriate HTTP response
   */
  protected handleResult<T>(result: Result<T>, res: Response): Response {
    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.data,
      });
    } else {
      const statusCode = getHttpStatusFromErrorCode(result.code);
      return res.status(statusCode).json({
        success: false,
        error: result.error,
        code: result.code,
      });
    }
  }

  /**
   * Handles Result type and returns JSON object (for routing-controllers)
   */
  protected handleResultAsJson<T>(result: Result<T>, res?: Response): any {
    if (result.success) {
      return res? res.status(200).json({
        success: true,
        data: result.data,
      }) : {
        success: true,
        data: result.data,
      };
    } else {
      return res? res.status(getHttpStatusFromErrorCode(result.code)).json({
        success: false,
        error: result.error,
        code: result.code,
        statusCode: getHttpStatusFromErrorCode(result.code),
      }) : {
        success: false,
        error: result.error,
        code: result.code,
        statusCode: getHttpStatusFromErrorCode(result.code),
      };
    }
  }

  /**
   * Creates a success response
   */
  protected success<T>(data: T): any {
    return {
      success: true,
      data,
    };
  }

  /**
   * Creates an error response with HTTP status code
   */
  protected error(message: string, statusCode: number = 500): any {
    return {
      success: false,
      error: message,
      statusCode,
    };
  }
}
