const projectService = require('../services/projectService');

const createProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const project = await projectService.createProject({ name, description });
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
};

const getProjectFiles = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const files = await projectService.getProjectFiles(projectId);
    res.json(files);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createProject,
  getProjectFiles
};

