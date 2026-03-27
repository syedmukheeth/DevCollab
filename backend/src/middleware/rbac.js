const { prisma } = require('../config/db');
const ApiError = require('../utils/ApiError');

/**
 * Role-Based Access Control (RBAC) middleware.
 * Checks if the authenticated user has the required role in the given session.
 *
 * Usage: router.post('/endpoint', requireAuth, requireRole('EDITOR'), handler)
 *
 * @param {...string} allowedRoles - Roles that are permitted (e.g., 'EDITOR', 'INTERVIEWER')
 * @returns {Function} Express middleware
 */
const requireRole = (...allowedRoles) => async (req, res, next) => {
  try {
    const sessionId = req.params.sessionId || req.body.sessionId;
    const userId = req.userId;

    if (!sessionId) {
      return next(new ApiError(400, 'Session ID is required for role-based access'));
    }
    if (!userId) {
      return next(new ApiError(401, 'Authentication required'));
    }

    const sessionUser = await prisma.sessionUser.findUnique({
      where: { sessionId_userId: { sessionId, userId } }
    });

    if (!sessionUser) {
      return next(new ApiError(403, 'You are not a member of this session'));
    }

    if (!allowedRoles.includes(sessionUser.role)) {
      return next(new ApiError(403, `Insufficient permissions. Required: ${allowedRoles.join(' or ')}. Your role: ${sessionUser.role}`));
    }

    req.sessionUser = sessionUser;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Checks if the authenticated user is the owner of a project.
 * @returns {Function} Express middleware
 */
const requireProjectOwner = async (req, res, next) => {
  try {
    const projectId = req.params.id || req.params.projectId;
    const userId = req.userId;

    if (!projectId || !userId) {
      return next(new ApiError(400, 'Project ID and authentication are required'));
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return next(new ApiError(404, 'Project not found'));
    }

    if (project.ownerId && project.ownerId !== userId) {
      return next(new ApiError(403, 'Only the project owner can perform this action'));
    }

    req.project = project;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Checks if the authenticated user has access to the project with specific roles.
 * @param {...string} allowedRoles - 'VIEWER', 'EDITOR', 'ADMIN'
 */
const requireProjectAccess = (...allowedRoles) => async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.body.projectId || req.params.id;
    const userId = req.userId;

    if (!projectId || !userId) {
      return next(new ApiError(400, 'Project ID and authentication are required'));
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return next(new ApiError(404, 'Project not found'));

    // Owner always has access as ADMIN
    if (project.ownerId === userId) {
      req.project = project;
      req.projectRole = 'ADMIN';
      return next();
    }

    const access = await prisma.projectAccess.findUnique({
      where: { projectId_userId: { projectId, userId } }
    });

    if (!access) {
      return next(new ApiError(403, 'You do not have access to this project'));
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(access.role)) {
      return next(new ApiError(403, `Insufficient permissions. Required: ${allowedRoles.join(' or ')}`));
    }

    req.project = project;
    req.projectRole = access.role;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { requireRole, requireProjectOwner, requireProjectAccess };
