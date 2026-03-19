const ApiError = require('../utils/ApiError');
const { verifyAuthToken } = require('../utils/authToken');

const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
  const secret = process.env.SESSION_SECRET;
  const verified = verifyAuthToken({ token, secret });
  if (!verified.ok) return next(new ApiError(401, 'Not authenticated'));
  req.userId = verified.userId;
  return next();
};

module.exports = { requireAuth };

