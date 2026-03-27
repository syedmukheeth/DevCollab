const express = require('express');
const { prisma } = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const { requireProjectAccess } = require('../middleware/rbac');
const ApiError = require('../utils/ApiError');

const router = express.Router();

// Get all users with access to a project
router.get('/:projectId/access', requireAuth, requireProjectAccess('ADMIN', 'EDITOR'), async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const access = await prisma.projectAccess.findMany({
      where: { projectId },
      include: { user: { select: { id: true, username: true, email: true, avatarUrl: true } } }
    });
    res.json(access);
  } catch (err) {
    next(err);
  }
});

// Invite a user to a project
router.post('/:projectId/access', requireAuth, requireProjectAccess('ADMIN'), async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { userEmail, username, role } = req.body;

    if (!role || !['VIEWER', 'EDITOR', 'ADMIN'].includes(role)) {
      throw new ApiError(400, 'Valid role is required');
    }

    const targetUser = await prisma.user.findFirst({
      where: { OR: [{ email: userEmail }, { username }] }
    });

    if (!targetUser) throw new ApiError(404, 'User not found');

    const access = await prisma.projectAccess.upsert({
      where: { projectId_userId: { projectId, userId: targetUser.id } },
      update: { role },
      create: { projectId, userId: targetUser.id, role }
    });

    res.json(access);
  } catch (err) {
    next(err);
  }
});

// Remove access
router.delete('/:projectId/access/:userId', requireAuth, requireProjectAccess('ADMIN'), async (req, res, next) => {
  try {
    const { projectId, userId } = req.params;
    await prisma.projectAccess.delete({
      where: { projectId_userId: { projectId, userId } }
    });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
