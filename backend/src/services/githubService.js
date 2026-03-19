const { Octokit } = require('@octokit/rest');
const Y = require('yjs');
const Project = require('../models/Project');
const File = require('../models/File');
const YjsSnapshot = require('../models/YjsSnapshot');
const ApiError = require('../utils/ApiError');

const getEnv = (name) => {
  const v = process.env[name];
  if (!v) return undefined;
  return v;
};

const normalizeBool = (v, fallback) => {
  if (typeof v === 'undefined') return fallback;
  return String(v).toLowerCase() === 'true';
};

const getOctokit = () => {
  const token = getEnv('GITHUB_TOKEN');
  if (!token) throw new ApiError(500, 'GITHUB_TOKEN is not configured');
  return new Octokit({ auth: token });
};

const getCurrentFileContentFromYjs = async (fileId) => {
  const room = `file:${fileId}`;
  const snap = await YjsSnapshot.findOne({ room });
  if (snap?.state?.length) {
    const doc = new Y.Doc();
    Y.applyUpdate(doc, new Uint8Array(snap.state));
    const ytext = doc.getText('monaco');
    return ytext.toString();
  }

  // Fallback: Phase 1/2 compatibility if a snapshot doesn't exist yet.
  const file = await File.findById(fileId);
  return file?.content || '';
};

const getOrResolveOwner = async (octokit, project) => {
  if (project?.github?.owner) return project.github.owner;
  const ownerEnv = getEnv('GITHUB_OWNER');
  if (ownerEnv) return ownerEnv;
  const authUser = await octokit.users.getAuthenticated();
  return authUser.data.login;
};

const createRepoIfNeeded = async ({ projectId, ownerId }) => {
  const octokit = getOctokit();
  const project = await Project.findOne({ _id: projectId, ownerId });
  if (!project) throw new ApiError(404, 'Project not found');

  const owner = await getOrResolveOwner(octokit, project);
  const authUser = await octokit.users.getAuthenticated();
  const authLogin = authUser.data.login;
  const repoPrefix = getEnv('GITHUB_REPO_PREFIX') || 'devcollab-';
  const defaultBranch = getEnv('GITHUB_DEFAULT_BRANCH') || project.github?.defaultBranch || 'main';
  const baseDir = getEnv('GITHUB_BASE_DIR') || 'devcollab';
  const autoInit = normalizeBool(getEnv('GITHUB_AUTO_INIT'), true);
  const privateRepo = normalizeBool(getEnv('GITHUB_PRIVATE'), false);

  const repoName = project.github?.repo || `${repoPrefix}${project._id}`;

  if (!project.github?.repo) {
    if (owner === authLogin) {
      await octokit.repos.createForAuthenticatedUser({
        name: repoName,
        private: privateRepo,
        auto_init: autoInit,
        description: project.description || undefined
      });
    } else {
      await octokit.repos.createInOrg({
        org: owner,
        name: repoName,
        private: privateRepo,
        auto_init: autoInit,
        description: project.description || undefined
      });
    }

    project.github = {
      owner,
      repo: repoName,
      defaultBranch,
      createdAt: new Date()
    };
    await project.save();
  } else if (!project.github.defaultBranch) {
    project.github.defaultBranch = defaultBranch;
    await project.save();
  }

  return {
    owner: project.github.owner || owner,
    repo: project.github.repo,
    defaultBranch: project.github.defaultBranch || defaultBranch,
    baseDir
  };
};

const ensureBranchExists = async ({ octokit, owner, repo, defaultBranch, branch }) => {
  if (!branch || branch === defaultBranch) return;

  try {
    await octokit.git.getRef({ owner, repo, ref: `heads/${branch}` });
    return;
  } catch (err) {
    // Continue to create if ref doesn't exist.
  }

  const defaultRef = await octokit.git.getRef({ owner, repo, ref: `heads/${defaultBranch}` });
  const sha = defaultRef.data.object.sha;

  await octokit.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branch}`,
    sha
  });
};

const commitProjectToBranch = async ({ projectId, ownerId, branch, message }) => {
  const octokit = getOctokit();
  const project = await Project.findOne({ _id: projectId, ownerId });
  if (!project) throw new ApiError(404, 'Project not found');

  const { owner, repo, defaultBranch, baseDir } = await createRepoIfNeeded({ projectId, ownerId });

  // If branch is not provided, fall back to default.
  const targetBranch = branch || defaultBranch;
  await ensureBranchExists({
    octokit,
    owner,
    repo,
    defaultBranch,
    branch: targetBranch
  });

  // Latest commit + base tree for tree creation.
  const branchRef = await octokit.git.getRef({ owner, repo, ref: `heads/${targetBranch}` });
  const latestCommitSha = branchRef.data.object.sha;
  const latestCommit = await octokit.git.getCommit({
    owner,
    repo,
    commit_sha: latestCommitSha
  });

  const baseTreeSha = latestCommit.data.tree.sha;
  const existingTree = await octokit.git.getTree({
    owner,
    repo,
    tree_sha: baseTreeSha,
    recursive: true
  });

  const projectFiles = await File.find({ projectId }).sort({ createdAt: 1 });
  const currentPaths = [];
  const treeEntries = [];

  // Add/update all project files in the base directory.
  for (const f of projectFiles) {
    const content = await getCurrentFileContentFromYjs(f._id);
    const path = `${baseDir}/${f.name}`;
    const blob = await octokit.git.createBlob({
      owner,
      repo,
      content,
      encoding: 'utf-8'
    });

    currentPaths.push(path);
    treeEntries.push({
      path,
      mode: '100644',
      type: 'blob',
      sha: blob.data.sha
    });
  }

  // Optionally delete files that exist under baseDir but no longer exist in the project.
  // We only operate inside baseDir to avoid deleting unrelated repository files.
  const existingUnderBaseDir = (existingTree.data.tree || [])
    .filter((t) => t.type === 'blob' && typeof t.path === 'string' && t.path.startsWith(`${baseDir}/`))
    .map((t) => t.path);

  for (const existingPath of existingUnderBaseDir) {
    if (!currentPaths.includes(existingPath)) {
      treeEntries.push({
        path: existingPath,
        mode: '100644',
        type: 'blob',
        sha: null
      });
    }
  }

  const tree = await octokit.git.createTree({
    owner,
    repo,
    base_tree: baseTreeSha,
    tree: treeEntries
  });

  const commit = await octokit.git.createCommit({
    owner,
    repo,
    message: message || `Update from DevCollab (${new Date().toISOString()})`,
    tree: tree.data.sha,
    parents: [latestCommitSha]
  });

  await octokit.git.updateRef({
    owner,
    repo,
    ref: `heads/${targetBranch}`,
    sha: commit.data.sha
  });

  return {
    owner,
    repo,
    branch: targetBranch,
    commitSha: commit.data.sha
  };
};

module.exports = {
  createRepoIfNeeded,
  commitProjectToBranch
};

