const crypto = require('crypto');
const ApiError = require('./ApiError');

const b64url = (buf) =>
  Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

const b64urlJson = (obj) => b64url(JSON.stringify(obj));

const sign = (data, secret) =>
  b64url(crypto.createHmac('sha256', secret).update(data).digest());

const issueAuthToken = ({ userId, secret, ttlSeconds = 60 * 60 }) => {
  if (!secret) throw new ApiError(500, 'SESSION_SECRET is not configured');
  const payload = {
    uid: String(userId),
    exp: Math.floor(Date.now() / 1000) + ttlSeconds
  };
  const payloadB64 = b64urlJson(payload);
  const sig = sign(payloadB64, secret);
  return `${payloadB64}.${sig}`;
};

const verifyAuthToken = ({ token, secret }) => {
  if (!token) return { ok: false, reason: 'missing' };
  if (!secret) return { ok: false, reason: 'server_misconfigured' };
  const parts = String(token).split('.');
  if (parts.length !== 2) return { ok: false, reason: 'malformed' };
  const [payloadB64, sig] = parts;
  const expected = sign(payloadB64, secret);
  const sigOk = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  if (!sigOk) return { ok: false, reason: 'bad_signature' };
  const payloadJson = Buffer.from(payloadB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
  let payload;
  try {
    payload = JSON.parse(payloadJson);
  } catch {
    return { ok: false, reason: 'bad_payload' };
  }
  if (!payload?.uid || !payload?.exp) return { ok: false, reason: 'bad_payload' };
  if (Math.floor(Date.now() / 1000) > payload.exp) return { ok: false, reason: 'expired' };
  return { ok: true, userId: payload.uid };
};

module.exports = { issueAuthToken, verifyAuthToken };

