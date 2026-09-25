import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import AppError from '../errors/AppError.js';

export const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

export const validateBody = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const fields = Object.fromEntries(
      result.error.issues.map((issue) => [
        issue.path.join('.') || 'form',
        issue.message,
      ]),
    );

    return next(
      new AppError('Please check your details and try again.', {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        details: { fields },
      }),
    );
  }

  req.body = result.data;
  next();
};

export const validateParams = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.params);

  if (!result.success) {
    const fields = Object.fromEntries(
      result.error.issues.map((issue) => [issue.path.join('.'), issue.message]),
    );

    return next(
      new AppError('That address is not valid.', {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        details: { fields },
      }),
    );
  }

  req.params = result.data;
  next();
};

export const notFoundMiddleware = (req, res, next) => {
  next(
    new AppError(`Route ${req.method} ${req.originalUrl} was not found.`, {
      statusCode: 404,
      code: 'NOT_FOUND',
    }),
  );
};

export const errorMiddleware = (error, req, res, next) => {
  if (res.headersSent) return next(error);

  const requestId = req.requestId || randomUUID();
  const isZodError = error instanceof z.ZodError;
  const statusCode = isZodError ? 400 : error.statusCode || 500;
  const code = isZodError ? 'VALIDATION_ERROR' : error.code || 'INTERNAL_ERROR';
  const message = isZodError
    ? 'Please check your details and try again.'
    : error.isOperational
      ? error.message
      : 'Something went wrong. Please try again.';
  const fields = isZodError
    ? Object.fromEntries(
        error.issues.map((issue) => [
          issue.path.join('.') || 'form',
          issue.message,
        ]),
      )
    : error.details?.fields;

  if (statusCode >= 500) {
    if (error.isOperational) {
      console.warn(`[${requestId}] ${code}: ${error.message}`);
    } else {
      console.error(`[${requestId}] ${error.stack || error.message}`);
    }
  }

  const response = {
    error: {
      code,
      message,
      requestId,
    },
  };

  if (fields) response.error.fields = fields;
  res.status(statusCode).json(response);
};