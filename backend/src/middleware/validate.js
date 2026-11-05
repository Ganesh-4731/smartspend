import mongoose from 'mongoose';
import { AppError } from '../utils/AppError.js';

// validate(schema, 'body' | 'query') -> stores the parsed (stripped/coerced) data on req.valid
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source] ?? {});
  if (!result.success) return next(result.error); // handled centrally -> 400
  req.valid = { ...(req.valid || {}), [source]: result.data };
  next();
};

export const validateIdParam = (name = 'id') => (req, _res, next) => {
  const v = req.params[name];
  if (typeof v !== 'string' || !/^[a-f\d]{24}$/i.test(v) || !mongoose.isValidObjectId(v)) {
    return next(new AppError(400, `Invalid ${name}`));
  }
  next();
};
