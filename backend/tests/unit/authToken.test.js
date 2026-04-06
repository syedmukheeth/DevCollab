const { issueAuthToken, verifyAuthToken } = require('../../src/utils/authToken');

describe('authToken (RS256)', () => {
  let jose;

  beforeAll(async () => {
    // Dynamic import jose to generate test keys
    jose = await import('jose');
    const { generateKeyPair, exportPKCS8, exportSPKI } = jose;
    
    // Generate a fresh pair for tests
    const { privateKey, publicKey } = await generateKeyPair('RS256', { extractable: true });
    const privPem = await exportPKCS8(privateKey);
    const pubPem = await exportSPKI(publicKey);
    
    // Inject into environment
    process.env.JWT_PRIVATE_KEY_B64 = Buffer.from(privPem).toString('base64');
    process.env.JWT_PUBLIC_KEY_B64 = Buffer.from(pubPem).toString('base64');
  });

  describe('issueAuthToken', () => {
    it('should return a signed JWS string', async () => {
      const token = await issueAuthToken({ userId: 'user-1' });
      expect(typeof token).toBe('string');
      // JWS has 3 parts separated by dots
      expect(token.split('.')).toHaveLength(3);
    });

    it('should encode the user ID into the token payload', async () => {
      const token = await issueAuthToken({ userId: 'user-42' });
      const result = await verifyAuthToken({ token });
      expect(result.ok).toBe(true);
      expect(result.userId).toBe('user-42');
    });

    it('should respect custom TTL', async () => {
      const token = await issueAuthToken({ userId: 'u1', ttlSeconds: 10 });
      const result = await verifyAuthToken({ token });
      expect(result.ok).toBe(true);
    });
  });

  describe('verifyAuthToken', () => {
    it('should return ok:true for a valid token', async () => {
      const token = await issueAuthToken({ userId: 'user-1' });
      const result = await verifyAuthToken({ token });
      expect(result).toEqual({ ok: true, userId: 'user-1' });
    });

    it('should reject missing token', async () => {
      const result = await verifyAuthToken({ token: null });
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('missing');
    });

    it('should reject malformed token', async () => {
      const result = await verifyAuthToken({ token: 'not.a.valid.jwt' });
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('invalid');
    });

    it('should reject expired tokens', async () => {
      // Issue token with 0 TTL
      const token = await issueAuthToken({ userId: 'u1', ttlSeconds: 0 });
      // Small delay to ensure expiration
      await new Promise(r => setTimeout(r, 100));
      const result = await verifyAuthToken({ token });
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('expired');
    });

    it('should reject token signed with different keys', async () => {
      const { generateKeyPair, exportPKCS8 } = jose;
      const { privateKey: otherPriv } = await generateKeyPair('RS256', { extractable: true });
      const otherPrivPem = await exportPKCS8(otherPriv);
      const otherPrivB64 = Buffer.from(otherPrivPem).toString('base64');
      
      // Temporarily swap private key to sign a "rogue" token
      const originalPriv = process.env.JWT_PRIVATE_KEY_B64;
      process.env.JWT_PRIVATE_KEY_B64 = otherPrivB64;
      const rogueToken = await issueAuthToken({ userId: 'hacker' });
      process.env.JWT_PRIVATE_KEY_B64 = originalPriv;

      const result = await verifyAuthToken({ token: rogueToken });
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('invalid');
    });
  });
});
