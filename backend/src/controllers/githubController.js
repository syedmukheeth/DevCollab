const githubAuthService = require('../services/githubAuthService');
const githubService = require('../services/githubService');

const getAuthUrl = async (req, res, next) => {
  try {
    const url = githubAuthService.getGitHubAuthUrl(req.userId);
    res.json({ url });
  } catch (err) {
    next(err);
  }
};

const callback = async (req, res, next) => {
  try {
    const { code, state } = req.query;
    // state is the userId
    if (!state) throw new ApiError(401, 'No user state provided');
    await githubAuthService.handleGitHubCallback(code, state);
    res.send('<html><body><script>window.opener.postMessage("github-connected", "*"); window.close();</script></body></html>');
  } catch (err) {
    next(err);
  }
};

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

const createPR = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { head, base, title, body } = req.body || {};
    const pr = await githubService.createPullRequest({
      projectId,
      ownerId: req.userId,
      head,
      base,
      title,
      body
    });
    res.json(pr);
  } catch (err) {
    next(err);
  }
};

const getFileDiff = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { path } = req.query; // file name/path
    const originalContent = await githubService.getGithubFileContent({
      projectId,
      ownerId: req.userId,
      path
    });
    res.json({ originalContent });
  } catch (err) {
    next(err);
  }
};

const getUserStatus = async (req, res, next) => {
  try {
    const githubUser = await githubAuthService.getGitHubUser(req.userId);
    res.json(githubUser || { connected: false });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  initProjectRepo,
  commitAndPush,
  getAuthUrl,
  callback,
  getUserStatus,
  createPR,
  getFileDiff
};

