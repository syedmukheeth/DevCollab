const { prisma } = require('../config/db');
const ApiError = require('../utils/ApiError');
const { getProjectByIdForOwner } = require('./projectService');
const { cache } = require('../utils/redisClient');

const createFile = async ({ projectId, ownerId, name, content = '' }) => {
  if (!name) {
    throw new ApiError(400, 'File name is required');
  }
  await getProjectByIdForOwner(projectId, ownerId);
  const file = await prisma.file.create({
    data: { name, content, projectId }
  });
  // Invalidate project files cache
  await cache.del(`project:${projectId}:files`);
  return file;
};

const getProjectFilesWithCache = async (projectId) => {
  const cacheKey = `project:${projectId}:files`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const files = await prisma.file.findMany({
    where: { projectId },
    orderBy: { name: 'asc' }
  });
  await cache.set(cacheKey, files, 600); // 10 min cache for file lists
  return files;
};

const getFileByIdForOwner = async (fileId, ownerId) => {
  const cacheKey = `file:${fileId}`;
  const cachedFile = await cache.get(cacheKey);
  if (cachedFile) return cachedFile;

  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) {
    throw new ApiError(404, 'File not found');
  }
  await getProjectByIdForOwner(file.projectId, ownerId);
  
  await cache.set(cacheKey, file, 3600); // Cache for 1 hour
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

  // Invalidate caches
  await cache.del(`file:${fileId}`);
  await cache.del(`project:${file.projectId}:files`);
  
  return updatedFile;
};

const deleteFile = async (fileId, ownerId) => {
  const file = await getFileByIdForOwner(fileId, ownerId);
  await prisma.file.delete({ where: { id: fileId } });
  
  // Invalidate caches
  await cache.del(`file:${fileId}`);
  await cache.del(`project:${file.projectId}:files`);
};

module.exports = {
  createFile,
  getProjectFilesWithCache,
  getFileByIdForOwner,
  updateFile,
  deleteFile
};
