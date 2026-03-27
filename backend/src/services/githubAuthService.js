const axios = require('axios');
const { prisma } = require('../config/db');
const ApiError = require('../utils/ApiError');

const getGitHubAuthUrl = (userId) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = process.env.GITHUB_CALLBACK_URL;
  const scope = 'repo user';
  const state = userId; // Secure it in real app with a signed token
  return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
};

const handleGitHubCallback = async (code, userId) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  const response = await axios.post('https://github.com/login/oauth/access_token', {
    client_id: clientId,
    client_secret: clientSecret,
    code
  }, {
    headers: { Accept: 'application/json' }
  });

  const { access_token, refresh_token, expires_in } = response.data;
  if (!access_token) throw new ApiError(400, 'GitHub OAuth failed');

  // Fetch user info
  const userResponse = await axios.get('https://github.com/user', {
    headers: { Authorization: `token ${access_token}` }
  });

  const { login, avatar_url, email: githubEmail, name: githubName } = userResponse.data;

  // Sync to core User model
  await prisma.user.update({
    where: { id: userId },
    data: {
      username: login,
      avatarUrl: avatar_url,
      email: githubEmail || undefined,
      name: githubName || undefined
    }
  });

  return await prisma.userGitHub.upsert({
    where: { userId },
    update: {
      accessToken: access_token,
      refreshToken: refresh_token,
      username: login,
      avatarUrl: avatar_url,
      expiresAt: expires_in ? new Date(Date.now() + expires_in * 1000) : null
    },
    create: {
      userId,
      accessToken: access_token,
      refreshToken: refresh_token,
      username: login,
      avatarUrl: avatar_url,
      expiresAt: expires_in ? new Date(Date.now() + expires_in * 1000) : null
    }
  });
};

const getGitHubUser = async (userId) => {
  return await prisma.userGitHub.findUnique({ where: { userId } });
};

module.exports = {
  getGitHubAuthUrl,
  handleGitHubCallback,
  getGitHubUser
};
