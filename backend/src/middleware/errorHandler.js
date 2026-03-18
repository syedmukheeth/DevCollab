const ApiError = require('../utils/ApiError');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  // eslint-disable-next-line no-console
  console.error(err);
  return res.status(500).json({ message: 'Internal server error' });
};

const notFound = (req, res) => {
  res.status(404).json({ message: 'Route not found' });
};

module.exports = { errorHandler, notFound };

