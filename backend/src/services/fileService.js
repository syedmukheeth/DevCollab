const { prisma } = require('../config/db');
const ApiError = require('../utils/ApiError');
const { getProjectByIdForOwner } = require('./projectService');

const createFile = async ({ projectId, ownerId, name, content = '' }) => {
  if (!name) {
    throw new ApiError(400, 'File name is required');
  }
  await getProjectByIdForOwner(projectId, ownerId);
  const file = await prisma.file.create({
    data: { name, content, projectId }
  });
  return file;
};

const getFileByIdForOwner = async (fileId, ownerId) => {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) {
    throw new ApiError(404, 'File not found');
  }
  await getProjectByIdForOwner(file.projectId, ownerId);
  return file;
};

const updateFile = async (fileId, ownerId, { name, content }) => {
  const file = await getFileByIdForOwner(fileId, ownerId);
  const updatedData = {};
  if (typeof name !== 'undefined') updatedData.name = name;
  if (typeof content !== 'undefined') updatedData.content = content;
  
  const updatedFile = await prisma.file.update({
    where: { id: fileId },
    data: updatedData
  });
  return updatedFile;
};

const deleteFile = async (fileId, ownerId) => {
  const file = await getFileByIdForOwner(fileId, ownerId);
  await prisma.file.delete({ where: { id: fileId } });
};

module.exports = {
  createFile,
  getFileByIdForOwner,
  updateFile,
  deleteFile
};
