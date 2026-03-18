const fileService = require('../services/fileService');

const createFile = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { name, content } = req.body;
    const file = await fileService.createFile({ projectId, name, content });
    res.status(201).json(file);
  } catch (err) {
    next(err);
  }
};

const getFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const file = await fileService.getFileById(fileId);
    res.json(file);
  } catch (err) {
    next(err);
  }
};

const updateFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const { name, content } = req.body;
    const file = await fileService.updateFile(fileId, { name, content });
    res.json(file);
  } catch (err) {
    next(err);
  }
};

const deleteFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    await fileService.deleteFile(fileId);
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

