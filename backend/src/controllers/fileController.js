const fileService = require('../services/fileService');

const createFile = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { name, content } = req.body;
    const ownerId = req.userId;
    const file = await fileService.createFile({ projectId, ownerId, name, content });
    res.status(201).json(file);
  } catch (err) {
    next(err);
  }
};

const getFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const ownerId = req.userId;
    const file = await fileService.getFileByIdForOwner(fileId, ownerId);
    res.json(file);
  } catch (err) {
    next(err);
  }
};

const updateFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const { name, content } = req.body;
    const ownerId = req.userId;
    const file = await fileService.updateFile(fileId, ownerId, { name, content });
    res.json(file);
  } catch (err) {
    next(err);
  }
};

const deleteFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const ownerId = req.userId;
    await fileService.deleteFile(fileId, ownerId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createFile,
  getFile,
  updateFile,
  deleteFile
};

