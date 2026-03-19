const express = require('express');
const githubController = require('../controllers/githubController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/projects/:projectId/github/init', requireAuth, githubController.initProjectRepo);
router.post('/projects/:projectId/github/commit', requireAuth, githubController.commitAndPush);

module.exports = router;

