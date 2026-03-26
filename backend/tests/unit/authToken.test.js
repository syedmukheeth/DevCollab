const { issueAuthToken, verifyAuthToken } = require('../../src/utils/authToken');

const TEST_SECRET = 'test-secret-for-unit-tests-32chars!';

describe('authToken', () => {
  describe('issueAuthToken', () => {
    it('should return a string with two dot-separated parts', () => {
      const token = issueAuthToken({ userId: 'user-1', secret: TEST_SECRET });
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(2);
    });

    it('should throw if secret is missing', () => {
      expect(() => issueAuthToken({ userId: 'user-1', secret: null }))
        .toThrow('SESSION_SECRET is not configured');
    });

    it('should encode the user ID into the token payload', () => {
      const token = issueAuthToken({ userId: 'user-42', secret: TEST_SECRET });
      const result = verifyAuthToken({ token, secret: TEST_SECRET });
      expect(result.ok).toBe(true);
      expect(result.userId).toBe('user-42');
    });

    it('should respect custom TTL', () => {
      const token = issueAuthToken({ userId: 'u1', secret: TEST_SECRET, ttlSeconds: 1 });
      const result = verifyAuthToken({ token, secret: TEST_SECRET });
      expect(result.ok).toBe(true);
    });
  });

  describe('verifyAuthToken', () => {
    it('should return ok:true for a valid token', () => {
      const token = issueAuthToken({ userId: 'user-1', secret: TEST_SECRET });
      const result = verifyAuthToken({ token, secret: TEST_SECRET });
      expect(result).toEqual({ ok: true, userId: 'user-1' });
    });

    it('should reject missing token', () => {
      const result = verifyAuthToken({ token: null, secret: TEST_SECRET });
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('missing');
    });

    it('should reject missing secret', () => {
      const result = verifyAuthToken({ token: 'some.token', secret: null });
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('server_misconfigured');
    });

    it('should reject malformed token (no dot)', () => {
      const result = verifyAuthToken({ token: 'nodot', secret: TEST_SECRET });
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('malformed');
    });

    it('should reject token signed with wrong secret', () => {
      const token = issueAuthToken({ userId: 'u1', secret: TEST_SECRET });
      const result = verifyAuthToken({ token, secret: 'wrong-secret-completely-differ!!' });
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('bad_signature');
    });

    it('should reject expired tokens', () => {
      // Issue token that expired 10 seconds ago
      const token = issueAuthToken({ userId: 'u1', secret: TEST_SECRET, ttlSeconds: -10 });
      const result = verifyAuthToken({ token, secret: TEST_SECRET });
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('expired');
    });

    it('should reject tampered payload', () => {
      const token = issueAuthToken({ userId: 'u1', secret: TEST_SECRET });
      const [, sig] = token.split('.');
      // Replace payload with a different one, keep original signature
      const fakePayload = Buffer.from(JSON.stringify({ uid: 'hacker', exp: 9999999999 }))
        .toString('base64')
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
      const tampered = `${fakePayload}.${sig}`;
      const result = verifyAuthToken({ token: tampered, secret: TEST_SECRET });
      expect(result.ok).toBe(false);
    });
  });
});
