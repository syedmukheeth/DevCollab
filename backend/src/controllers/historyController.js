const historyService = require('../services/historyService');
const ApiError = require('../utils/ApiError');

/**
 * PRODUCTION-GRADE HISTORY CONTROLLER
 * Manages access to content-addressed version checkpoints.
 */

const getHistory = async (req, res, next) => {
  try {
    const { room } = req.params;
    if (!room) throw new ApiError(400, 'Room ID is required');

    // In a prod system, we'd verify project permissions here
    const checkpoints = await historyService.listCheckpoints(room);
    
    return res.json({ 
      room,
      totalVersions: checkpoints.length,
      versions: checkpoints 
    });
  } catch (err) {
    next(err);
  }
};

const getVersion = async (req, res, next) => {
  try {
    const { room, versionHash } = req.params;
    if (!room || !versionHash) throw new ApiError(400, 'Room and Version Hash are required');

    const key = `checkpoints/${room}/${versionHash}.json`;
    const chunks = await historyService.getVersionData(key);
    
    // Return base64 encoded chunks for the client-side Yjs instance to apply
    const b64Chunks = chunks.map(chunk => Buffer.from(chunk).toString('base64'));
    
    return res.json({ 
      room,
      versionHash,
      chunks: b64Chunks 
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getHistory,
  getVersion
};
