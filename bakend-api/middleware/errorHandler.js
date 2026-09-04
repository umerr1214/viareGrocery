const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);
  // Node hides the real reason for network failures (e.g. "fetch failed") in err.cause.
  // Surface it so issues like ECONNRESET / TLS / DNS are visible instead of opaque.
  if (err && err.cause) {
    console.error('↳ Cause:', err.cause.code || '', err.cause.message || err.cause);
  }

  // Default error
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details = null;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    details = err.message;
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Resource Not Found';
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message = 'File too large';
  } else if (err.code === 'LIMIT_FILE_COUNT') {
    statusCode = 413;
    message = 'Too many files';
  } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = 'Unexpected file field';
  }

  // In development, include stack trace
  if (process.env.NODE_ENV === 'development') {
    details = err.stack;
  }

  res.status(statusCode).json({
    error: message,
    details,
    timestamp: new Date().toISOString(),
    path: req.path
  });
};

module.exports = errorHandler; 