const File = require('../models/File');
const ApiError = require('../utils/ApiError');
const { getProjectById } = require('./projectService');

const createFile = async ({ projectId, name, content = '' }) => {
  if (!name) {
    throw new ApiError(400, 'File name is required');
  }
  await getProjectById(projectId);
  const file = await File.create({ name, content, projectId });
  return file;
};

const getFileById = async (fileId) => {
  const file = await File.findById(fileId);
  if (!file) {
    throw new ApiError(404, 'File not found');
  }
  return file;
};

const updateFile = async (fileId, { name, content }) => {
  const file = await getFileById(fileId);
  if (typeof name !== 'undefined') {
    file.name = name;
  }
  if (typeof content !== 'undefined') {
    file.content = content;
  }
  await file.save();
  return file;
};

const deleteFile = async (fileId) => {
  const file = await getFileById(fileId);
  await file.deleteOne();
};

module.exports = {
  createFile,
  getFileById,
  updateFile,
  deleteFile
};

