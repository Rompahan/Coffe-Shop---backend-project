const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || 500;
  
  const response = {
    message: err.message
  };
  
  if (err.name === 'CastError') {
    response.message = 'Invalid ID format';
  }
  
  if (err.name === 'ValidationError') {
    response.message = Object.values(err.errors)
      .map(val => val.message)
      .join(', ');
  }
  
  if (err.code === 11000) {
    response.message = 'Duplicate field value entered';
  }
  
  if (err.name === 'JsonWebTokenError') {
    response.message = 'Invalid token';
  }
  
  if (err.name === 'TokenExpiredError') {
    response.message = 'Token expired';
  }
  
  res.status(statusCode).json(response);
};

module.exports = { notFound, errorHandler };