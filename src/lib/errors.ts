import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export class AppError extends Error {
  public statusCode: number;
  public details?: unknown;

  constructor(message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
        details: error.details,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    const firstIssue = error.issues[0];
    const message = firstIssue?.message || 'بيانات غير صحيحة';
    return NextResponse.json(
      {
        success: false,
        message,
        issues: error.issues,
      },
      { status: 400 }
    );
  }

  // Safe technical logging on server
  console.error('Unhandled API Error:', error);

  return NextResponse.json(
    {
      success: false,
      message: 'حدث خطأ في النظام، يرجى المحاولة مرة أخرى لاحقاً',
    },
    { status: 500 }
  );
}
