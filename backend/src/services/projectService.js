const Project = require('../models/Project');
const File = require('../models/File');
const ApiError = require('../utils/ApiError');

const createProject = async ({ name, description, ownerId }) => {
  if (!name) {
    throw new ApiError(400, 'Project name is required');
  }
  const project = await Project.create({ name, description, ownerId });
  return project;
};

const getProjectById = async (projectId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }
  return project;
};

const listProjectsForOwner = async (ownerId) => {
  if (!ownerId) throw new ApiError(401, 'Not authenticated');
  return await Project.find({ ownerId }).sort({ createdAt: -1 });
};

const getProjectByIdForOwner = async (projectId, ownerId) => {
  const project = await Project.findOne({ _id: projectId, ownerId });
  if (!project) throw new ApiError(404, 'Project not found');
  return project;
};

const getProjectFiles = async (projectId) => {
  await getProjectById(projectId);
  const files = await File.find({ projectId }).sort({ createdAt: 1 });
  return files;
};

const getProjectFilesForOwner = async (projectId, ownerId) => {
  await getProjectByIdForOwner(projectId, ownerId);
  const files = await File.find({ projectId }).sort({ createdAt: 1 });
  return files;
};

module.exports = {
  createProject,
  getProjectById,
  getProjectFiles,
  listProjectsForOwner,
  getProjectByIdForOwner,
  getProjectFilesForOwner
};

