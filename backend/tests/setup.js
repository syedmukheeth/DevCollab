const fs = require('fs');
const path = require('path');

// GLOBAL JEST SETUP FOR SYNC_MESH FORGE
// Reads pre-generated RS256 keys from tests/test_keys.json synchronously
const setup = () => {
  const keysPath = path.join(__dirname, 'test_keys.json');
  if (fs.existsSync(keysPath)) {
    const keys = JSON.parse(fs.readFileSync(keysPath, 'utf8'));
    process.env.JWT_PRIVATE_KEY_B64 = keys.priv;
    process.env.JWT_PUBLIC_KEY_B64 = keys.pub;
    process.env.NODE_ENV = 'test';
    process.env.SESSION_SECRET = 'test-secret-at-least-32-chars-long!!';
  } else {
    console.warn('Warning: tests/test_keys.json not found. Auth tests may fail.');
  }
};

setup();
