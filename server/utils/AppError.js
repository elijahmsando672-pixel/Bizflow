export class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.status = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const isAppError = (err) => err instanceof AppError;
