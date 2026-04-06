const { prisma } = require('../config/db');
const ApiError = require('../utils/ApiError');

/**
 * PRODUCTION-GRADE RBAC & ACCESS CONTROL
 * Implements strict project-level access checks.
 */

const ROLES = {
  OWNER: 'OWNER',
  EDITOR: 'EDITOR',
  VIEWER: 'VIEWER',
  INTERVIEWER: 'INTERVIEWER'
};

const ROLE_HIERARCHY = {
  [ROLES.OWNER]: [ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER, ROLES.INTERVIEWER],
  [ROLES.EDITOR]: [ROLES.EDITOR, ROLES.VIEWER],
  [ROLES.VIEWER]: [ROLES.VIEWER],
  [ROLES.INTERVIEWER]: [ROLES.INTERVIEWER, ROLES.VIEWER] // Can see everything viewer can, plus run code
};

/**
 * Middleware to check if user has a minimum required role for a project.
 * @param {string} minRole - One of ROLES
 */
const requireProjectRole = (minRole) => async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.userId;

    if (!projectId || !userId) {
      return next(new ApiError(400, 'Project identity or user identity missing'));
    }

    // 1. Check if user is the direct owner of the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true }
    });

    if (!project) return next(new ApiError(404, 'Project not found'));

    if (project.ownerId === userId) {
      req.projectRole = ROLES.OWNER;
      return next();
    }

    // 2. Check ProjectAccess table for shared permissions
    const access = await prisma.projectAccess.findUnique({
      where: {
        projectId_userId: { projectId, userId }
      }
    });

    if (!access) {
      return next(new ApiError(403, 'Forbidden: You do not have access to this project'));
    }

    const userRole = access.role;
    const allowedRoles = ROLE_HIERARCHY[userRole] || [];

    if (!allowedRoles.includes(minRole)) {
      return next(new ApiError(403, `Forbidden: Minimum role ${minRole} required`));
    }

    req.projectRole = userRole;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Simulates Database-Level RLS (Row Level Security)
 * This ensures that even if logic bugs occur, queries always include the userId filter.
 * In a real Postgres prod environment, this would use SET LOCAL app.current_user_id.
 */
const enforceRLS = (userId) => {
  return {
    project: {
      findMany: (args = {}) => prisma.project.findMany({
        ...args,
        where: {
          ...args.where,
          OR: [
            { ownerId: userId },
            { access: { some: { userId } } }
          ]
        }
      })
    }
  };
};

module.exports = {
  ROLES,
  requireProjectRole,
  enforceRLS
};
