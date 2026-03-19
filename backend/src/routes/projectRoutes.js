const express = require('express');
const projectController = require('../controllers/projectController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, projectController.listProjects);
router.post('/', requireAuth, projectController.createProject);
router.get('/:projectId/files', requireAuth, projectController.getProjectFiles);

module.exports = router;

