import { AppError } from '../utils/AppError.js';

export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    });
    if (error) {
      const err = new AppError('Validation error', 422);
      err.isJoi = true;
      err.details = error.details;
      return next(err);
    }
    req[source] = value;
    next();
  };
};

export const validateQuery = (schema) => validate(schema, 'query');
export const validateParams = (schema) => validate(schema, 'params');
