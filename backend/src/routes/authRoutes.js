const express = require('express');
const authController = require('../controllers/authController');
const { getGitHubAuthUrl, handleGitHubCallback, getGitHubUser } = require('../services/githubAuthService');
const { requireAuth } = require('../middleware/auth');
const { issueAuthToken } = require('../utils/authToken');

const router = express.Router();

router.post('/anonymous', authController.ensureAnonymous);
router.get('/me', authController.me);
router.post('/logout', authController.logout);

// GitHub OAuth — Redirect to GitHub
router.get('/github', requireAuth, (req, res) => {
  const url = getGitHubAuthUrl(req.userId);
  res.json({ url });
});

// GitHub OAuth — Callback (exchanging code for token)
router.get('/github/callback', async (req, res, next) => {
  try {
    const { code, state: userId } = req.query;
    if (!code || !userId) {
      return res.status(400).json({ message: 'Missing code or state' });
    }
    const _githubUser = await handleGitHubCallback(code, userId);
    const token = await issueAuthToken({ userId, ttlSeconds: 60 * 60 * 24 * 7 });
    // Redirect back to frontend with token
    const clientOrigin = process.env.CLIENT_ORIGIN?.split(',')[0] || 'http://localhost:5173';
    res.redirect(`${clientOrigin}?token=${token}&github=connected`);
  } catch (err) {
    next(err);
  }
});

// Get connected GitHub account info
router.get('/github/user', requireAuth, async (req, res, next) => {
  try {
    const user = await getGitHubUser(req.userId);
    res.json({ connected: !!user, user: user || null });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
