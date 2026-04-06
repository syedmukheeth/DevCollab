const ApiError = require('./ApiError');

// Lazy-loaded jose components for CJS compatibility
let jose = null;
const getJose = async () => {
  if (jose) return jose;
  // Dynamic import for ESM-only jose package
  jose = await import('jose');
  return jose;
};

/**
 * PRODUCTION-GRADE AUTHENTICATION SERVICE
 * Uses RS256 (Asymmetric) JWTs.
 * 
 * Benefits:
 * 1. Any service can verify the token with ONLY the public key.
 * 2. Compromising a verifying service doesn't allow issuing new tokens.
 */

let privateKey = null;
let publicKey = null;

const getKeys = async () => {
  if (privateKey && publicKey) return { privateKey, publicKey };

  const privB64 = process.env.JWT_PRIVATE_KEY_B64;
  const pubB64 = process.env.JWT_PUBLIC_KEY_B64;

  if (!privB64 || !pubB64) {
    if (process.env.NODE_ENV === 'production') {
      throw new ApiError(500, 'JWT_PRIVATE_KEY_B64 or JWT_PUBLIC_KEY_B64 is missing in production');
    }
    // For local dev, we could auto-generate but jose doesn't have a simple synchronous keygen.
    // We'll throw and tell the user to check .env.example
    throw new ApiError(500, 'Auth Keys missing. See .env.example for required JWT_PRIVATE_KEY_B64 and JWT_PUBLIC_KEY_B64');
  }

  try {
    const privPem = Buffer.from(privB64, 'base64').toString('utf8');
    const pubPem = Buffer.from(pubB64, 'base64').toString('utf8');
    
    const { importPKCS8, importSPKI } = await getJose();
    privateKey = await importPKCS8(privPem, 'RS256');
    publicKey = await importSPKI(pubPem, 'RS256');
    
    return { privateKey, publicKey };
  } catch (err) {
    throw new ApiError(500, `Failed to import RS256 keys: ${err.message}`);
  }
};

/**
 * Issues a short-lived access token (15 mins)
 */
const issueAuthToken = async ({ userId, ttlSeconds = 15 * 60 }) => {
  const { privateKey } = await getKeys();
  const { SignJWT } = await getJose();
  
  return await new SignJWT({ uid: String(userId) })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(privateKey);
};

/**
 * Issues a long-lived refresh token
 */
const issueRefreshToken = async ({ userId, ttlSeconds = 7 * 24 * 60 * 60 }) => {
  const { privateKey } = await getKeys();
  const { SignJWT } = await getJose();
  
  return await new SignJWT({ uid: String(userId), type: 'refresh' })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(privateKey);
};

/**
 * Verifies an access token
 */
const verifyAuthToken = async ({ token }) => {
  if (!token) return { ok: false, reason: 'missing' };
  
  try {
    const { publicKey } = await getKeys();
    const { jwtVerify } = await getJose();
    const { payload } = await jwtVerify(token, publicKey, {
      algorithms: ['RS256']
    });
    
    return { ok: true, userId: payload.uid };
  } catch (err) {
    return { ok: false, reason: err.code === 'ERR_JWT_EXPIRED' ? 'expired' : 'invalid' };
  }
};

module.exports = { 
  issueAuthToken, 
  issueRefreshToken,
  verifyAuthToken 
};
