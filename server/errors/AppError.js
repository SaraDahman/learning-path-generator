export default class AppError extends Error {
  constructor(
    message,
    {
      statusCode = 500,
      code = 'INTERNAL_ERROR',
      details,
      isOperational = true,
    } = {},
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace?.(this, AppError);
  }
}