const express = require('express');
const historyController = require('../controllers/historyController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * PRODUCTION-GRADE HISTORY ROUTES
 * Provides access to version checkpoints and time-travel snapshots.
 * Uses auth middleware to protect project data.
 */

router.get('/:room', requireAuth, historyController.getHistory);
router.get('/:room/:versionHash', requireAuth, historyController.getVersion);

module.exports = router;
