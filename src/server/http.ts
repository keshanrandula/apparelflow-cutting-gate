import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Insufficient permissions for this action') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ValidationError extends AppError {
  public readonly errors?: Record<string, string[]>;

  constructor(message: string = 'Invalid request payload', errors?: Record<string, string[]>) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Requested resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class InvalidTransitionError extends AppError {
  constructor(message: string = 'Invalid status transition') {
    super(message, 409, 'INVALID_TRANSITION');
  }
}

export class BusinessRuleError extends AppError {
  constructor(message: string = 'Business validation failed') {
    super(message, 422, 'UNPROCESSABLE_ENTITY');
  }
}

export function handleError(error: unknown): NextResponse {
  // 1. Domain Typed Errors
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          ...(error instanceof ValidationError && error.errors ? { details: error.errors } : {}),
        },
      },
      { status: error.statusCode }
    );
  }

  // 2. Zod Schema Validation Errors
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const path = issue.path.join('.') || 'root';
      if (!fieldErrors[path]) {
        fieldErrors[path] = [];
      }
      fieldErrors[path].push(issue.message);
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Schema validation failed',
          details: fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  // 3. Fallback for unhandled internal / database errors
  console.error('[Unhandled Internal Error]:', error);

  const fallbackMessage =
    error instanceof Error ? error.message : 'An unexpected error occurred. Please try again later.';

  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: fallbackMessage,
      },
    },
    { status: 500 }
  );
}
