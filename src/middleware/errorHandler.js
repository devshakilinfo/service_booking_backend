const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';

  if (err.code === '23505') {
    statusCode = 400;
    message = 'Duplicate field value entered (e.g. Email already exists)';
  }

  if (err.code === '23503') {
    statusCode = 404;
    message = 'Referenced resource (user or service) does not exist';
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = errorHandler;
