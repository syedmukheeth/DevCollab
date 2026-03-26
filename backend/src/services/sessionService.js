const { prisma } = require('../config/db');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * Creates a new collaborative session for a project.
 * @param {Object} params
 * @param {string} params.projectId - The ID of the project.
 * @param {string} params.creatorId - The ID of the user creating the session.
 * @param {boolean} [params.interviewMode=false] - Whether this is an interview session.
 * @param {Date} [params.expiresAt=null] - Optional expiration date.
 * @returns {Promise<Object>} Created session record.
 */
const createSession = async ({ projectId, creatorId, interviewMode = false, expiresAt = null }) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new ApiError(404, 'Project not found');

  const session = await prisma.session.create({
    data: {
      projectId,
      createdBy: creatorId,
      interviewMode,
      expiresAt,
    }
  });

  // Creator automatically gets EDITOR (or INTERVIEWER if in interview mode)
  const role = interviewMode ? 'INTERVIEWER' : 'EDITOR';
  await prisma.sessionUser.create({
    data: {
      sessionId: session.id,
      userId: creatorId,
      role
    }
  });

  logger.info(`Session created: ${session.id} for project ${projectId} (Interview: ${interviewMode})`);
  return session;
};

/**
 * Retrieves an active session by its share link.
 * @param {string} shareLink - The unique share link for the session.
 * @returns {Promise<Object>} Session record.
 */
const getSessionByLink = async (shareLink) => {
  const session = await prisma.session.findUnique({ where: { shareLink } });
  if (!session) throw new ApiError(404, 'Session not found');
  if (session.status !== 'ACTIVE') throw new ApiError(403, 'Session ended');
  if (session.expiresAt && session.expiresAt < new Date()) {
    throw new ApiError(403, 'Session expired');
  }
  return session;
};

/**
 * Joins a user to a session, assigning a default role if they haven't joined before.
 * @param {Object} params
 * @param {string} params.shareLink - The share link.
 * @param {string} params.userId - The ID of the user joining.
 * @returns {Promise<Object>} Session and sessionUser records.
 */
const joinSession = async ({ shareLink, userId }) => {
  const session = await getSessionByLink(shareLink);

  // See if user already joined
  let sessionUser = await prisma.sessionUser.findUnique({
    where: { sessionId_userId: { sessionId: session.id, userId } }
  });

  if (!sessionUser) {
    const defaultRole = session.interviewMode ? 'VIEWER' : 'EDITOR';
    sessionUser = await prisma.sessionUser.create({
      data: {
        sessionId: session.id,
        userId,
        role: defaultRole
      }
    });
    logger.info(`User ${userId} joined session ${session.id} as ${defaultRole}`);
  }

  return { session, sessionUser };
};

/**
 * Retrieves all users currently in a session.
 * @param {string} sessionId - Session ID.
 * @returns {Promise<Array>} List of session users with user details.
 */
const getSessionUsers = async (sessionId) => {
  return await prisma.sessionUser.findMany({
    where: { sessionId },
    include: { user: true }
  });
};

/**
 * Updates a user's role within a session.
 * @param {Object} params
 * @param {string} params.sessionId - Session ID.
 * @param {string} params.targetUserId - ID of the user whose role is being changed.
 * @param {string} params.newRole - The new role (VIEWER, EDITOR, INTERVIEWER).
 * @param {string} params.requesterId - ID of the user requesting the change.
 * @returns {Promise<Object>} Updated sessionUser record.
 */
const updateRole = async ({ sessionId, targetUserId, newRole, requesterId }) => {
  const requester = await prisma.sessionUser.findUnique({
    where: { sessionId_userId: { sessionId, userId: requesterId } },
    include: { session: true }
  });

  if (!requester || (requester.role !== 'EDITOR' && requester.role !== 'INTERVIEWER')) {
    throw new ApiError(403, 'Permission denied');
  }

  if (requester.session.createdBy === targetUserId) {
    throw new ApiError(403, 'Cannot change creator role');
  }

  const updated = await prisma.sessionUser.update({
    where: { sessionId_userId: { sessionId, userId: targetUserId } },
    data: { role: newRole }
  });
  logger.info(`Role updated in session ${sessionId}: User ${targetUserId} -> ${newRole}`);
  return updated;
};

/**
 * Ends a session, preventing further access.
 * @param {string} sessionId - Session ID.
 * @param {string} requesterId - ID of the user requesting to end the session.
 * @returns {Promise<Object>} Updated session record.
 */
const endSession = async (sessionId, requesterId) => {
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) throw new ApiError(404, 'Session not found');
  if (session.createdBy !== requesterId) throw new ApiError(403, 'Only creator can end session');

  const ended = await prisma.session.update({
    where: { id: sessionId },
    data: { status: 'ENDED' }
  });
  logger.info(`Session ended: ${sessionId} by ${requesterId}`);
  return ended;
};

/**
 * Retrieves all Yjs updates for a specific room (room persistence).
 * @param {string} room - The unique room identifier.
 * @returns {Promise<Array>} List of Yjs updates.
 */
const getSessionUpdates = async (room) => {
  return await prisma.yjsUpdate.findMany({
    where: { room },
    orderBy: { createdAt: 'asc' }
  });
};

module.exports = {
  createSession,
  getSessionByLink,
  joinSession,
  getSessionUsers,
  updateRole,
  endSession,
  getSessionUpdates
};
