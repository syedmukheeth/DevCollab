const crypto = require('crypto');
const User = require('../models/User');
const { issueAuthToken } = require('../utils/authToken');

const ensureAnonymous = async (req, res, next) => {
  try {
    // Token-based auth: create a lightweight anonymous user once and reuse via localStorage on client.

    const name = `User-${crypto.randomBytes(3).toString('hex')}`;
    const user = await User.create({ name });
    const token = issueAuthToken({
      userId: user._id.toString(),
      secret: process.env.SESSION_SECRET,
      ttlSeconds: 60 * 60 * 24 * 7
    });
    return res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
};

const me = async (req, res, next) => {
  try {
    // With token auth, client can call /me and we validate token via middleware when needed.
    return res.json({ user: null });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = { ensureAnonymous, me, logout };

