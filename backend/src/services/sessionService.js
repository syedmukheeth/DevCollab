const { prisma } = require('../config/db');
const ApiError = require('../utils/ApiError');

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

  return session;
};

const getSessionByLink = async (shareLink) => {
  const session = await prisma.session.findUnique({ where: { shareLink } });
  if (!session) throw new ApiError(404, 'Session not found');
  if (session.status !== 'ACTIVE') throw new ApiError(403, 'Session ended');
  if (session.expiresAt && session.expiresAt < new Date()) {
    throw new ApiError(403, 'Session expired');
  }
  return session;
};

const joinSession = async ({ shareLink, userId }) => {
  const session = await getSessionByLink(shareLink);

  // See if user already joined
  let sessionUser = await prisma.sessionUser.findUnique({
    where: { sessionId_userId: { sessionId: session.id, userId } }
  });

  if (!sessionUser) {
    // If not joined, assign default VIEWER role. In real app, creator could change roles later.
    const defaultRole = session.interviewMode ? 'VIEWER' : 'EDITOR';
    sessionUser = await prisma.sessionUser.create({
      data: {
        sessionId: session.id,
        userId,
        role: defaultRole
      }
    });
  }

  return { session, sessionUser };
};

const getSessionUsers = async (sessionId) => {
  return await prisma.sessionUser.findMany({
    where: { sessionId },
    include: { user: true }
  });
};

const updateRole = async ({ sessionId, targetUserId, newRole, requesterId }) => {
  const requester = await prisma.sessionUser.findUnique({
    where: { sessionId_userId: { sessionId, userId: requesterId } },
    include: { session: true }
  });

  if (!requester || (requester.role !== 'EDITOR' && requester.role !== 'INTERVIEWER')) {
    throw new ApiError(403, 'Permission denied');
  }

  // Creator bypass
  if (requester.session.createdBy === targetUserId) {
    throw new ApiError(403, 'Cannot change creator role');
  }

  return await prisma.sessionUser.update({
    where: { sessionId_userId: { sessionId, userId: targetUserId } },
    data: { role: newRole }
  });
};

const endSession = async (sessionId, requesterId) => {
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) throw new ApiError(404, 'Session not found');
  if (session.createdBy !== requesterId) throw new ApiError(403, 'Only creator can end session');

  return await prisma.session.update({
    where: { id: sessionId },
    data: { status: 'ENDED' }
  });
};

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
