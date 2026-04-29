// Centralized error handler - prevents information disclosure
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id || null,
  });

  // Default error response - don't leak internal details
  const statusCode = err.status || 500;
  const message = statusCode === 500 
    ? 'Internal server error' 
    : err.message;

  res.status(statusCode).json({ error: message });
};

// 404 handler for undefined routes
export const notFoundHandler = (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
};
