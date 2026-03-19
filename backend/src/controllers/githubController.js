const githubService = require('../services/githubService');

const initProjectRepo = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const repoInfo = await githubService.createRepoIfNeeded({ projectId, ownerId: req.userId });
    res.json(repoInfo);
  } catch (err) {
    next(err);
  }
};

const commitAndPush = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { branch, message } = req.body || {};

    const result = await githubService.commitProjectToBranch({
      projectId,
      ownerId: req.userId,
      branch,
      message
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  initProjectRepo,
  commitAndPush
};

