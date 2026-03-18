const Project = require('../models/Project');
const File = require('../models/File');
const ApiError = require('../utils/ApiError');

const createProject = async ({ name, description }) => {
  if (!name) {
    throw new ApiError(400, 'Project name is required');
  }
  const project = await Project.create({ name, description });
  return project;
};

const getProjectById = async (projectId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }
  return project;
};

const getProjectFiles = async (projectId) => {
  await getProjectById(projectId);
  const files = await File.find({ projectId }).sort({ createdAt: 1 });
  return files;
};

module.exports = {
  createProject,
  getProjectById,
  getProjectFiles
};

