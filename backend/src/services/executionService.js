const Docker = require('dockerode');
const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const ApiError = require('../utils/ApiError');

const docker = new Docker(); // connects to /var/run/docker.sock by default or DOCKER_HOST

const RUNTIMES = {
  python: {
    image: 'python:3.10-slim',
    ext: '.py',
    cmd: (file) => ['python', file]
  },
  javascript: {
    image: 'node:20-alpine',
    ext: '.js',
    cmd: (file) => ['node', file]
  },
  typescript: {
    image: 'node:20-alpine',
    ext: '.ts',
    cmd: (file) => ['npx', 'ts-node', file]
  },
  go: {
    image: 'golang:1.21-alpine',
    ext: '.go',
    cmd: (file) => ['go', 'run', file]
  },
  java: {
    image: 'openjdk:21-slim',
    ext: '.java',
    cmd: (file) => ['java', file]
  }
};

const runCode = async ({ code, language, onData, onDone, timeoutMs = 10000 }) => {
  const runtime = RUNTIMES[language.toLowerCase()];
  if (!runtime) {
    onDone(null, new ApiError(400, `Unsupported language: ${language}`));
    return;
  }

  // Ensure image exists locally (in production, you'd pull these beforehand)
  try {
    await docker.pull(runtime.image);
  } catch (err) {
    // Ignore pull errors (might be offline, or already there)
  }

  const runId = crypto.randomBytes(8).toString('hex');
  const tempDir = path.join(os.tmpdir(), `devcollab-run-${runId}`);
  let container;

  try {
    await fs.mkdir(tempDir, { recursive: true });
    const filename = `main${runtime.ext}`;
    const filePath = path.join(tempDir, filename);
    await fs.writeFile(filePath, code, 'utf-8');

    // Create a container mapping the temp file
    // In production (Docker-in-Docker or kubernetes) mounting volumes might differ
    container = await docker.createContainer({
      Image: runtime.image,
      Cmd: runtime.cmd(filename),
      Tty: false,
      User: '1000:1000', // avoid root
      HostConfig: {
        Binds: [`${tempDir}:/app:ro`],
        Memory: 256 * 1024 * 1024, // 256MB RAM limit
        MemorySwap: 256 * 1024 * 1024,
        NanoCpus: 1000000000, // 1 CPU limit
        NetworkMode: 'none' // true sandbox: no internet access inside
      },
      WorkingDir: '/app'
    });

    await container.start();

    // Stream logs
    const stream = await container.logs({ follow: true, stdout: true, stderr: true });
    
    stream.on('data', (chunk) => {
      // Docker attaches an 8-byte header to payload streams (tty=false), stripping it here or just parsing.
      // We'll pass raw chunks and let the frontend/wrapper handle decoding (dockerode demux needs extra handling)
      // A simple split:
      const header = chunk.slice(0, 8);
      const isStderr = header[0] === 2;
      const payload = chunk.slice(8).toString('utf-8');
      onData({ isStderr, payload });
    });

    let timeoutReached = false;
    const executionTimeout = setTimeout(async () => {
      timeoutReached = true;
      try { await container.stop(); } catch (e) {}
    }, timeoutMs);

    const result = await container.wait();
    clearTimeout(executionTimeout);

    if (timeoutReached) {
      onData({ isStderr: true, payload: `\n[Execution Timeout: Exceeded ${timeoutMs}ms]\n` });
    }

    onDone(result.StatusCode, null);
  } catch (err) {
    onDone(null, err);
  } finally {
    // Cleanup container and files
    if (container) {
      try {
        await container.remove({ force: true });
      } catch (e) {} // ignore
    }
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (e) {}
  }
};

module.exports = {
  runCode,
  RUNTIMES
};
