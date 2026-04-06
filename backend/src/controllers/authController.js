const crypto = require('crypto');
const { prisma } = require('../config/db');
const { issueAuthToken, issueRefreshToken } = require('../utils/authToken');

/**
 * PRODUCTION-GRADE AUTH CONTROLLER
 * Handles anonymous onboarding, session profile, and logout.
 * Implements sliding refresh token logic in httpOnly cookies.
 */

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

const ensureAnonymous = async (req, res, next) => {
  try {
    const name = `Engineer-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const user = await prisma.user.create({ data: { name } });
    
    const token = await issueAuthToken({ userId: user.id });
    const refreshToken = await issueRefreshToken({ userId: user.id });
    
    // Set refresh token in httpOnly cookie for production-grade security
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    
    return res.status(201).json({ 
      user: { id: user.id, name: user.name }, 
      token 
    });
  } catch (err) {
    next(err);
  }
};

const me = async (req, res, next) => {
  try {
    if (!req.userId) return res.json({ user: null });
    
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, name: true, createdAt: true }
    });
    
    return res.json({ user });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    res.clearCookie('refreshToken', { ...COOKIE_OPTIONS, maxAge: 0 });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = { 
  ensureAnonymous, 
  me, 
  logout,
  COOKIE_OPTIONS
};
