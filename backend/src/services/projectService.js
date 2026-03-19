const { prisma } = require('../config/db');
const ApiError = require('../utils/ApiError');

const createProject = async ({ name, description, ownerId }) => {
  if (!name) {
    throw new ApiError(400, 'Project name is required');
  }
  const project = await prisma.project.create({
    data: { name, description, ownerId }
  });
  return project;
};

const getProjectById = async (projectId) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }
  return project;
};

const listProjectsForOwner = async (ownerId) => {
  if (!ownerId) throw new ApiError(401, 'Not authenticated');
  return await prisma.project.findMany({
    where: { ownerId },
    orderBy: { createdAt: 'desc' }
  });
};

const getProjectByIdForOwner = async (projectId, ownerId) => {
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId }
  });
  if (!project) throw new ApiError(404, 'Project not found');
  return project;
};

const getProjectFiles = async (projectId) => {
  await getProjectById(projectId);
  return await prisma.file.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' }
  });
};

const getProjectFilesForOwner = async (projectId, ownerId) => {
  await getProjectByIdForOwner(projectId, ownerId);
  return await prisma.file.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' }
  });
};

module.exports = {
  createProject,
  getProjectById,
  getProjectFiles,
  listProjectsForOwner,
  getProjectByIdForOwner,
  getProjectFilesForOwner
};
