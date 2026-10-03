export class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.status = statusCode;
    // Several route handlers already branch on `statusCode` while others read `status`.
    // Setting both keeps a single error type usable from either style of catch block.
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export const isAppError = (err) => err instanceof AppError;