const { requireAuth } = require('../../src/middleware/auth');
const { issueAuthToken } = require('../../src/utils/authToken');

const TEST_SECRET = 'test-secret-for-middleware-tests!';

const mockReq = (authHeader) => ({
  headers: { authorization: authHeader || '' }
});

const mockRes = () => ({});

describe('auth middleware', () => {
  beforeAll(() => {
    process.env.SESSION_SECRET = TEST_SECRET;
  });

  it('should call next() with no error for a valid token', (done) => {
    const token = issueAuthToken({ userId: 'user-99', secret: TEST_SECRET });
    const req = mockReq(`Bearer ${token}`);
    const res = mockRes();
    requireAuth(req, res, (err) => {
      expect(err).toBeUndefined();
      expect(req.userId).toBe('user-99');
      done();
    });
  });

  it('should call next with ApiError for missing token', (done) => {
    const req = mockReq('');
    const res = mockRes();
    requireAuth(req, res, (err) => {
      expect(err).toBeDefined();
      expect(err.statusCode).toBe(401);
      done();
    });
  });

  it('should call next with ApiError for invalid token', (done) => {
    const req = mockReq('Bearer garbage.token');
    const res = mockRes();
    requireAuth(req, res, (err) => {
      expect(err).toBeDefined();
      expect(err.statusCode).toBe(401);
      done();
    });
  });

  it('should call next with ApiError for expired token', (done) => {
    const token = issueAuthToken({ userId: 'u1', secret: TEST_SECRET, ttlSeconds: -10 });
    const req = mockReq(`Bearer ${token}`);
    const res = mockRes();
    requireAuth(req, res, (err) => {
      expect(err).toBeDefined();
      expect(err.statusCode).toBe(401);
      done();
    });
  });
});
