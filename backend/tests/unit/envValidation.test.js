const { parseEnv } = require('../../src/config/env');

describe('env validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      DATABASE_URL: 'file:./test.db',
      SESSION_SECRET: 'test-secret-32chars-long-enough!!',
      PORT: '4000'
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should parse valid environment variables', () => {
    const env = parseEnv();
    expect(env.PORT).toBe(4000);
    expect(env.DATABASE_URL).toBe('file:./test.db');
    expect(env.SESSION_SECRET).toBeDefined();
  });

  it('should default PORT to 4000', () => {
    delete process.env.PORT;
    const env = parseEnv();
    expect(env.PORT).toBe(4000);
  });

  it('should throw on missing DATABASE_URL', () => {
    delete process.env.DATABASE_URL;
    expect(() => parseEnv()).toThrow('Invalid environment');
  });

  it('should throw on missing SESSION_SECRET', () => {
    delete process.env.SESSION_SECRET;
    expect(() => parseEnv()).toThrow('Invalid environment');
  });

  it('should parse CLIENT_ORIGIN as array when comma-separated', () => {
    process.env.CLIENT_ORIGIN = 'http://localhost:5173,http://localhost:5174';
    const env = parseEnv();
    expect(Array.isArray(env.CLIENT_ORIGIN)).toBe(true);
    expect(env.CLIENT_ORIGIN).toHaveLength(2);
  });

  it('should default CLIENT_ORIGIN to wildcard when not set', () => {
    delete process.env.CLIENT_ORIGIN;
    const env = parseEnv();
    expect(env.CLIENT_ORIGIN).toBe('*');
  });

  it('should parse github config', () => {
    process.env.GITHUB_TOKEN = 'ghp_test';
    process.env.GITHUB_OWNER = 'testowner';
    const env = parseEnv();
    expect(env.github.token).toBe('ghp_test');
    expect(env.github.owner).toBe('testowner');
    expect(env.github.autoInit).toBe(true); // default
  });
});
