const express = require('express');
const githubController = require('../controllers/githubController');

const router = express.Router();

router.post('/projects/:projectId/github/init', githubController.initProjectRepo);
router.post('/projects/:projectId/github/commit', githubController.commitAndPush);

module.exports = router;

