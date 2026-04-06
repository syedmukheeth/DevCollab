const ApiError = require('../utils/ApiError');
const { verifyAuthToken } = require('../utils/authToken');

/**
 * PRODUCTION-GRADE AUTH MIDDLEWARE
 * Verifies JWT access token via RSA-256 public key.
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next(new ApiError(401, 'Please authenticate (missing/malformed token)'));
    }

    const token = authHeader.split(' ')[1];
    const { ok, userId, reason } = await verifyAuthToken({ token });
    
    if (!ok) {
      const message = reason === 'expired' ? 'Session expired' : 'Forbidden (invalid token)';
      return next(new ApiError(401, message));
    }

    req.userId = userId;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { requireAuth };
