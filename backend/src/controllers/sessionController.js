const sessionService = require('../services/sessionService');

const createSession = async (req, res, next) => {
  try {
    const { projectId, interviewMode, expiresAt } = req.body;
    const session = await sessionService.createSession({
      projectId,
      creatorId: req.userId,
      interviewMode,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    });
    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
};

const joinSession = async (req, res, next) => {
  try {
    const { shareLink } = req.body; // or params
    const result = await sessionService.joinSession({
      shareLink,
      userId: req.userId
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const getSessionUsers = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const users = await sessionService.getSessionUsers(sessionId);
    res.json(users);
  } catch (err) {
    next(err);
  }
};

const updateRole = async (req, res, next) => {
  try {
    const { sessionId, userId } = req.params;
    const { role } = req.body; // VIEWER | EDITOR | INTERVIEWER
    const sessionUser = await sessionService.updateRole({
      sessionId,
      targetUserId: userId,
      newRole: role,
      requesterId: req.userId
    });
    res.json(sessionUser);
  } catch (err) {
    next(err);
  }
};

const endSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await sessionService.endSession(sessionId, req.userId);
    res.json(session);
  } catch (err) {
    next(err);
  }
};

const getReplay = async (req, res, next) => {
  try {
    const { room } = req.params;
    const updates = await sessionService.getSessionUpdates(room);
    // Return updates as base64 or array of chunks
    res.json(updates.map(u => ({
      createdAt: u.createdAt,
      update: u.update.toString('base64')
    })));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createSession,
  joinSession,
  getSessionUsers,
  updateRole,
  endSession,
  getReplay
};
