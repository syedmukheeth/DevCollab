const projectService = require('../services/projectService');

const createProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const ownerId = req.userId;
    const project = await projectService.createProject({ name, description, ownerId });
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
};

const listProjects = async (req, res, next) => {
  try {
    const ownerId = req.userId;
    const projects = await projectService.listProjectsForOwner(ownerId);
    res.json(projects);
  } catch (err) {
    next(err);
  }
};

const getProjectFiles = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const ownerId = req.userId;
    const files = await projectService.getProjectFilesForOwner(projectId, ownerId);
    res.json(files);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createProject,
  listProjects,
  getProjectFiles
};

