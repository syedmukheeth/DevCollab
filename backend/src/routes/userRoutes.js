const express = require('express');
const { requireAuth } = require('../middleware/auth');
const storageService = require('../services/storageService');
const { prisma } = require('../config/db');
const ApiError = require('../utils/ApiError');

const router = express.Router();

// Get current user profile
router.get('/profile', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, username: true, email: true, avatarUrl: true, bio: true }
    });
    if (user && user.avatarUrl) {
      user.avatarUrl = storageService.getSignedUrl(user.avatarUrl);
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// Update profile (bio/username)
router.patch('/profile', requireAuth, async (req, res, next) => {
  try {
    const { username, bio } = req.body;
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { username, bio },
      select: { id: true, username: true, email: true, avatarUrl: true, bio: true }
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// Upload avatar
router.post('/avatar', requireAuth, async (req, res, next) => {
  try {
    // We'll use a generic folder for avatars
    storageService.upload.single('avatar')(req, res, async (err) => {
      if (err) return next(new ApiError(400, `Upload error: ${err.message}`));
      if (!req.file) return next(new ApiError(400, 'No avatar uploaded'));

      const avatarUrl = storageService.getSignedUrl(req.file.key);
      
      const user = await prisma.user.update({
        where: { id: req.userId },
        data: { avatarUrl: req.file.key }, // Store the key, sign it on retrieval
        select: { id: true, avatarUrl: true }
      });

      res.json({ message: 'Avatar updated', avatarUrl });
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
