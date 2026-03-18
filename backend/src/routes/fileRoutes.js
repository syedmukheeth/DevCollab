const express = require('express');
const fileController = require('../controllers/fileController');

const router = express.Router();

router.post('/projects/:projectId/files', fileController.createFile);
router.get('/files/:fileId', fileController.getFile);
router.put('/files/:fileId', fileController.updateFile);
router.delete('/files/:fileId', fileController.deleteFile);

module.exports = router;

