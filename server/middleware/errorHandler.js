import { AppError } from '../utils/AppError.js';

export const errorHandler = (err, req, res, next) => {
  if (!err) return next();

  console.error('Error:', {
    message: err.message || 'Unknown error',
    status: err.status || 500,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id || null,
  });

  if (err.isJoi) {
    return res.status(422).json({
      success: false,
      message: 'Validation error',
      code: 422,
      errors: err.details.map(d => ({
        field: d.path.join('.'),
        message: d.message,
      })),
    });
  }

  const statusCode = err.status || 500;
  const message = statusCode === 500
    ? 'Internal server error'
    : (err.message || 'Unknown error');

  const body = {
    success: false,
    message,
    code: statusCode,
  };

  if (err.details && process.env.NODE_ENV === 'development') {
    body.details = err.details;
  }

  res.status(statusCode).json(body);
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    code: 404,
  });
};
