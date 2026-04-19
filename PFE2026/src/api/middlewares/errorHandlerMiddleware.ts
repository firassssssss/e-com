import { Request, Response, NextFunction } from 'express';
import { HttpError } from 'routing-controllers';
import { NotFoundError } from '../../core/errors/NotFoundError.js';
import { ValidationError } from 'class-validator'; // For handling class-validator errors

export function errorHandlerMiddleware(error: any, req: Request, res: Response, next: NextFunction) {
  // Log the error for debugging (consider using a more sophisticated logger in production)
  console.error('Error caught by middleware:');
  console.error('Name:', error.name);
  console.error('Message:', error.message);
  if (error.errors) console.error('Validation Errors:', error.errors); // class-validator errors
  if (error.stack) console.error('Stack:', error.stack);

  if (res.headersSent) {
    return next(error);
  }

  // Handle NotFoundError
  if (error instanceof NotFoundError || error.name === 'NotFoundError') {
    res.status(404).json({
      status: 404,
      name: 'NotFoundError',
      message: error.message || 'Resource not found.',
    });
    return;
  }

  // Handle class-validator errors (routing-controllers often wraps these in an HttpError with status 400)
  if (error instanceof HttpError && error.httpCode === 400 && (error as any).errors && Array.isArray((error as any).errors)) {
    const validationErrors = (error as any).errors as ValidationError[];
    // Ensure it's actually an array of ValidationError instances
    if (validationErrors.every(err => err instanceof ValidationError)) {
      res.status(400).json({
        status: 400,
        name: 'ValidationError',
        message: error.message || 'Input validation failed.', // Use error's message if available
        errors: validationErrors.map((err: ValidationError) => ({
          property: err.property,
          constraints: err.constraints,
          // children: err.children, // Optionally include children for nested validation
          contexts: err.contexts,
        })),
      });
      return;
    }
  }
  
  // Handle other HttpError instances from routing-controllers
  if (error instanceof HttpError) {
    res.status(error.httpCode || 500).json({
      status: error.httpCode || 500,
      name: error.name || 'HttpError',
      message: error.message || 'An error occurred.',
    });
    return;
  }

  // Default to 500 Internal Server Error
  res.status(500).json({
    status: 500,
    name: error.name || 'InternalServerError',
    message: error.message || 'An unexpected internal server error occurred.',
    // Optionally include stack in development
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
}
