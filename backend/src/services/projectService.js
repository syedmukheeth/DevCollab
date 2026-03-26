const { prisma } = require('../config/db');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * Creates a new project in the database.
 * @param {Object} data - Project data.
 * @param {string} data.name - Name of the project.
 * @param {string} [data.description] - Optional description.
 * @param {string} [data.ownerId] - Optional owner ID.
 * @returns {Promise<Object>} Created project record.
 */
const createProject = async ({ name, description, ownerId }) => {
  if (!name) {
    throw new ApiError(400, 'Project name is required');
  }
  const project = await prisma.project.create({
    data: { name, description, ownerId }
  });
  logger.info(`Project created: ${project.id} by ${ownerId || 'anonymous'}`);
  return project;
};

/**
 * Retrieves a project by ID.
 * @param {string} projectId - Project ID.
 * @returns {Promise<Object>} Project record.
 */
const getProjectById = async (projectId) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }
  return project;
};

/**
 * Lists all projects for a given owner.
 * @param {string} ownerId - Owner ID.
 * @returns {Promise<Array>} List of projects.
 */
const listProjectsForOwner = async (ownerId) => {
  if (!ownerId) throw new ApiError(401, 'Not authenticated');
  return await prisma.project.findMany({
    where: { ownerId },
    orderBy: { createdAt: 'desc' }
  });
};

/**
 * Retrieves a project for a specific owner, ensuring they have access.
 * @param {string} projectId - Project ID.
 * @param {string} ownerId - Owner ID.
 * @returns {Promise<Object>} Project record.
 */
const getProjectByIdForOwner = async (projectId, ownerId) => {
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId }
  });
  if (!project) throw new ApiError(404, 'Project not found');
  return project;
};

/**
 * Retrieves all files associated with a project.
 * @param {string} projectId - Project ID.
 * @returns {Promise<Array>} List of files.
 */
const getProjectFiles = async (projectId) => {
  await getProjectById(projectId);
  return await prisma.file.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' }
  });
};

/**
 * Retrieves project files for a specific owner.
 * @param {string} projectId - Project ID.
 * @param {string} ownerId - Owner ID.
 * @returns {Promise<Array>} List of files.
 */
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
