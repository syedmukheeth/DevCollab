const express = require('express');
const githubController = require('../controllers/githubController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/projects/:projectId/github/init', requireAuth, githubController.initProjectRepo);
router.post('/projects/:projectId/github/commit', requireAuth, githubController.commitAndPush);
router.post('/projects/:projectId/github/create-pr', requireAuth, githubController.createPR);
router.get('/projects/:projectId/github/diff', requireAuth, githubController.getFileDiff);
router.get('/github/user', requireAuth, githubController.getUserStatus);
router.get('/github/auth', requireAuth, githubController.getAuthUrl);
router.get('/github/callback', githubController.callback);

module.exports = router;

