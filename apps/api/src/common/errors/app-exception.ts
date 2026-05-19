import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Domain exception carrying a stable, machine-readable error code.
 * The global exception filter renders it into the standard error envelope.
 */
export class AppException extends HttpException {
  constructor(
    public readonly code: string,
    message: string,
    status: HttpStatus,
    public readonly details?: unknown,
  ) {
    super({ code, message, details }, status);
  }

  static badRequest(code: string, message: string, details?: unknown): AppException {
    return new AppException(code, message, HttpStatus.BAD_REQUEST, details);
  }

  static unauthorized(code: string, message: string): AppException {
    return new AppException(code, message, HttpStatus.UNAUTHORIZED);
  }

  static forbidden(code: string, message: string): AppException {
    return new AppException(code, message, HttpStatus.FORBIDDEN);
  }

  static notFound(code: string, message: string): AppException {
    return new AppException(code, message, HttpStatus.NOT_FOUND);
  }

  static conflict(code: string, message: string): AppException {
    return new AppException(code, message, HttpStatus.CONFLICT);
  }

  static unprocessable(code: string, message: string, details?: unknown): AppException {
    return new AppException(code, message, HttpStatus.UNPROCESSABLE_ENTITY, details);
  }
}
