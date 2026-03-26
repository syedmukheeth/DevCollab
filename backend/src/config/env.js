const { z } = require('zod');

const boolFromString = (v, defaultValue) => {
  if (typeof v === 'undefined') return defaultValue;
  return String(v).toLowerCase() === 'true';
};

const envSchema = z.object({
  NODE_ENV: z.string().optional().default('development'),
  PORT: z.coerce.number().int().positive().optional().default(4000),
  DATABASE_URL: z.string().min(1),
  MONGO_URI: z.string().optional(),
  SESSION_SECRET: z.string().min(1),
  CLIENT_ORIGIN: z.string().optional(),
  SOCKET_ORIGIN: z.string().optional(),
  REDIS_URL: z.string().optional(),
  GITHUB_TOKEN: z.string().optional(),
  GITHUB_OWNER: z.string().optional(),
  GITHUB_REPO_PREFIX: z.string().optional(),
  GITHUB_DEFAULT_BRANCH: z.string().optional(),
  GITHUB_BASE_DIR: z.string().optional(),
  GITHUB_AUTO_INIT: z.string().optional(),
  GITHUB_PRIVATE: z.string().optional()
});

const parseEnv = () => {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    const err = new Error(`Invalid environment variables:\n${issues.join('\n')}`);
    err.name = 'EnvValidationError';
    throw err;
  }

  const e = parsed.data;
  return {
    NODE_ENV: e.NODE_ENV,
    PORT: e.PORT,
    DATABASE_URL: e.DATABASE_URL,
    SESSION_SECRET: e.SESSION_SECRET,
    CLIENT_ORIGIN: e.CLIENT_ORIGIN ? e.CLIENT_ORIGIN.split(',') : '*',
    SOCKET_ORIGIN: e.SOCKET_ORIGIN ? e.SOCKET_ORIGIN.split(',') : '*',
    REDIS_URL: e.REDIS_URL,
    github: {
      token: e.GITHUB_TOKEN,
      owner: e.GITHUB_OWNER,
      repoPrefix: e.GITHUB_REPO_PREFIX,
      defaultBranch: e.GITHUB_DEFAULT_BRANCH,
      baseDir: e.GITHUB_BASE_DIR,
      autoInit: boolFromString(e.GITHUB_AUTO_INIT, true),
      privateRepo: boolFromString(e.GITHUB_PRIVATE, false)
    }
  };
};

module.exports = { parseEnv };

