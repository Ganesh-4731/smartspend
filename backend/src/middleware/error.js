import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';

export const notFound = (req, _res, next) => next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`));

export function errorHandler(err, _req, res, _next) { // eslint-disable-line no-unused-vars
  let status = err.status || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors;

  if (err instanceof ZodError) {
    status = 400;
    message = 'Validation failed';
    errors = err.issues.map((i) => ({ field: i.path.join('.') || '_', message: i.message }));
  } else if (err.type === 'entity.parse.failed') {
    status = 400; message = 'Malformed JSON body';
  } else if (err.type === 'entity.too.large') {
    status = 413; message = 'Request body too large';
  } else if (err.name === 'CastError') {
    status = 400; message = 'Invalid identifier or value';
  } else if (err.name === 'ValidationError' && err.errors) {
    status = 400; message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err.code === 11000) {
    status = 409; message = 'A record with these details already exists';
  }

  if (status >= 500 && !env.isTest) console.error(err);
  const body = { success: false, message: status >= 500 && env.isProd ? 'Internal server error' : message };
  if (errors) body.errors = errors;
  if (!env.isProd && status >= 500) body.stack = err.stack;
  res.status(status).json(body);
}
