const express = require('express');
const fileController = require('../controllers/fileController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/projects/:projectId/files', requireAuth, fileController.createFile);
router.get('/files/:fileId', requireAuth, fileController.getFile);
router.put('/files/:fileId', requireAuth, fileController.updateFile);
router.delete('/files/:fileId', requireAuth, fileController.deleteFile);

module.exports = router;

