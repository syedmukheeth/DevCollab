const { Octokit } = require('@octokit/rest');
const Y = require('yjs');
const { prisma } = require('../config/db');
const ApiError = require('../utils/ApiError');
const _logger = require('../utils/logger');

const getEnv = (name) => {
  const v = process.env[name];
  if (!v) return undefined;
  return v;
};

const normalizeBool = (v, fallback) => {
  if (typeof v === 'undefined') return fallback;
  return String(v).toLowerCase() === 'true';
};

const getOctokit = (accessToken) => {
  const token = accessToken || getEnv('GITHUB_TOKEN');
  if (!token) throw new ApiError(500, 'GitHub authentication not configured');
  return new Octokit({ auth: token });
};

// Internal helper to get user's token
/**
 * Retrieves the GitHub access token for a specific user from the database.
 * @param {string} userId - The unique identifier of the user.
 * @returns {Promise<string|null>} The access token or null if not found.
 */
const getUserToken = async (userId) => {
  const github = await prisma.userGitHub.findUnique({ where: { userId } });
  return github?.accessToken || null;
};


const getCurrentFileContentFromYjs = async (fileId) => {
  const room = `file:${fileId}`;
  const snap = await prisma.yjsSnapshot.findUnique({ where: { room } });
  if (snap?.state?.length) {
    const doc = new Y.Doc();
    Y.applyUpdate(doc, new Uint8Array(snap.state));
    const ytext = doc.getText('monaco');
    return ytext.toString();
  }

  const file = await prisma.file.findUnique({ where: { id: fileId } });
  return file?.content || '';
};

const getOrResolveOwner = async (octokit, project) => {
  if (project?.githubOwner) return project.githubOwner;
  const ownerEnv = getEnv('GITHUB_OWNER');
  if (ownerEnv) return ownerEnv;
  const authUser = await octokit.users.getAuthenticated();
  return authUser.data.login;
};

/**
 * Creates a new GitHub repository for a project if it doesn't already exist.
 * @param {Object} params
 * @param {string} params.projectId - The ID of the project.
 * @param {string} params.ownerId - The ID of the user owning the project.
 * @returns {Promise<Object>} Repository details (owner, repo, branch, baseDir).
 */
const createRepoIfNeeded = async ({ projectId, ownerId }) => {
  const accessToken = await getUserToken(ownerId);
  const octokit = getOctokit(accessToken);
  const project = await prisma.project.findFirst({ where: { id: projectId, ownerId } });
  if (!project) throw new ApiError(404, 'Project not found');

  const owner = await getOrResolveOwner(octokit, project);
  const authUser = await octokit.users.getAuthenticated();
  const authLogin = authUser.data.login;
  const repoPrefix = getEnv('GITHUB_REPO_PREFIX') || 'syncmesh-';
  const defaultBranch = getEnv('GITHUB_DEFAULT_BRANCH') || project.githubDefaultBranch || 'main';
  const baseDir = getEnv('GITHUB_BASE_DIR') || 'syncmesh';
  const autoInit = normalizeBool(getEnv('GITHUB_AUTO_INIT'), true);
  const privateRepo = normalizeBool(getEnv('GITHUB_PRIVATE'), false);

  const repoName = project.githubRepo || `${repoPrefix}${project.id}`;

  let updatedGithub = false;
  if (!project.githubRepo) {
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

    await prisma.project.update({
      where: { id: projectId },
      data: {
        githubOwner: owner,
        githubRepo: repoName,
        githubDefaultBranch: defaultBranch,
        githubCreatedAt: new Date()
      }
    });
    updatedGithub = true;
  } else if (!project.githubDefaultBranch || project.githubDefaultBranch !== defaultBranch) {
    await prisma.project.update({
      where: { id: projectId },
      data: { githubDefaultBranch: defaultBranch }
    });
    updatedGithub = true;
  }

  // Refresh project data if updated
  const refreshedProject = updatedGithub ? await prisma.project.findFirst({ where: { id: projectId } }) : project;

  return {
    owner: refreshedProject.githubOwner || owner,
    repo: refreshedProject.githubRepo,
    defaultBranch: refreshedProject.githubDefaultBranch || defaultBranch,
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
  const accessToken = await getUserToken(ownerId);
  const octokit = getOctokit(accessToken);
  const project = await prisma.project.findFirst({ where: { id: projectId, ownerId } });
  if (!project) throw new ApiError(404, 'Project not found');

  const { owner, repo, defaultBranch, baseDir } = await createRepoIfNeeded({ projectId, ownerId });

  const targetBranch = branch || defaultBranch;
  await ensureBranchExists({
    octokit,
    owner,
    repo,
    defaultBranch,
    branch: targetBranch
  });

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

  const projectFiles = await prisma.file.findMany({ where: { projectId }, orderBy: { createdAt: 'asc' } });
  const currentPaths = [];
  const treeEntries = [];

  for (const f of projectFiles) {
    const content = await getCurrentFileContentFromYjs(f.id);
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
    message: message || `Update from SyncMesh (${new Date().toISOString()})`,
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

const createPullRequest = async ({ projectId, ownerId, head, base, title, body }) => {
  const accessToken = await getUserToken(ownerId);
  const octokit = getOctokit(accessToken);
  const project = await prisma.project.findFirst({ where: { id: projectId, ownerId } });
  if (!project || !project.githubRepo) throw new ApiError(400, 'Project repository not linked');

  const { data } = await octokit.pulls.create({
    owner: project.githubOwner,
    repo: project.githubRepo,
    title: title || 'Pull Request from SyncMesh',
    body: body || 'This PR was created from the SyncMesh IDE.',
    head, // branch name
    base: base || project.githubDefaultBranch || 'main'
  });

  return data;
};

const getGithubFileContent = async ({ projectId, ownerId, path }) => {
  const accessToken = await getUserToken(ownerId);
  const octokit = getOctokit(accessToken);
  const project = await prisma.project.findFirst({ where: { id: projectId, ownerId } });
  if (!project || !project.githubRepo) throw new ApiError(400, 'Project repository not linked');

  const { data } = await octokit.repos.getContent({
    owner: project.githubOwner,
    repo: project.githubRepo,
    path: `${getEnv('GITHUB_BASE_DIR') || 'syncmesh'}/${path}`,
    ref: project.githubDefaultBranch || 'main'
  });

  if (Array.isArray(data)) throw new ApiError(400, 'Path is a directory');
  return Buffer.from(data.content, 'base64').toString('utf-8');
};

module.exports = {
  createRepoIfNeeded,
  commitProjectToBranch,
  createPullRequest,
  getGithubFileContent
};
