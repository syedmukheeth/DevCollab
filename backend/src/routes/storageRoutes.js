const express = require('express');
const { requireAuth } = require('../middleware/auth');
const storageService = require('../services/storageService');
const { getProjectByIdForOwner } = require('../services/projectService');
const ApiError = require('../utils/ApiError');

const router = express.Router();

// Get list of project files
router.get('/:projectId/files', requireAuth, async (req, res, next) => {
  try {
    const { projectId } = req.params;
    await getProjectByIdForOwner(projectId, req.userId);
    const files = await storageService.listProjectFiles(projectId);
    res.json(files);
  } catch (err) {
    next(err);
  }
});

// Upload file to project
router.post('/:projectId/upload', requireAuth, async (req, res, next) => {
  try {
    const { projectId } = req.params;
    await getProjectByIdForOwner(projectId, req.userId);
    
    // Multer middleware execution
    storageService.upload.single('file')(req, res, (err) => {
      if (err) {
        return next(new ApiError(400, `Upload error: ${err.message}`));
      }
      if (!req.file) {
        return next(new ApiError(400, 'No file uploaded'));
      }
      res.status(201).json({
        message: 'File uploaded successfully',
        file: {
          key: req.file.key,
          name: req.file.originalname,
          size: req.file.size,
          url: storageService.getSignedUrl(req.file.key)
        }
      });
    });
  } catch (err) {
    next(err);
  }
});

// Delete file from project
router.delete('/:projectId/files/:key(*)', requireAuth, async (req, res, next) => {
  try {
    const { projectId, key } = req.params;
    await getProjectByIdForOwner(projectId, req.userId);
    
    // Verify key belongs to project
    if (!key.startsWith(`projects/${projectId}/`)) {
      throw new ApiError(403, 'Unauthorized access to this file key');
    }
    
    await storageService.deleteFile(key);
    res.json({ message: 'File deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
