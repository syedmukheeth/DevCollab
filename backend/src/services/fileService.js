const File = require('../models/File');
const ApiError = require('../utils/ApiError');
const { getProjectByIdForOwner } = require('./projectService');

const createFile = async ({ projectId, ownerId, name, content = '' }) => {
  if (!name) {
    throw new ApiError(400, 'File name is required');
  }
  await getProjectByIdForOwner(projectId, ownerId);
  const file = await File.create({ name, content, projectId });
  return file;
};

const getFileByIdForOwner = async (fileId, ownerId) => {
  const file = await File.findById(fileId);
  if (!file) {
    throw new ApiError(404, 'File not found');
  }
  await getProjectByIdForOwner(file.projectId, ownerId);
  return file;
};

const updateFile = async (fileId, ownerId, { name, content }) => {
  const file = await getFileByIdForOwner(fileId, ownerId);
  if (typeof name !== 'undefined') {
    file.name = name;
  }
  if (typeof content !== 'undefined') {
    file.content = content;
  }
  await file.save();
  return file;
};

const deleteFile = async (fileId, ownerId) => {
  const file = await getFileByIdForOwner(fileId, ownerId);
  await file.deleteOne();
};

module.exports = {
  createFile,
  getFileByIdForOwner,
  updateFile,
  deleteFile
};

