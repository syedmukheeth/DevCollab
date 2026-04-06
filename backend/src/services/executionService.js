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
  },
  cpp: {
    image: 'gcc:13-bookworm',
    ext: '.cpp',
    cmd: (file) => ['sh', '-c', `g++ -o /tmp/out ${file} && /tmp/out`]
  },
  rust: {
    image: 'rust:1.75-slim',
    ext: '.rs',
    cmd: (file) => ['sh', '-c', `rustc -o /tmp/out ${file} && /tmp/out`]
  },
  ruby: {
    image: 'ruby:3.2-slim',
    ext: '.rb',
    cmd: (file) => ['ruby', file]
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
  } catch (_err) {
    // Ignore pull errors (might be offline, or already there)
  }

  const runId = crypto.randomBytes(8).toString('hex');
  const tempDir = path.join(os.tmpdir(), `syncmesh-forge-run-${runId}`);
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
      User: '1000:1000', // non-root user
      HostConfig: {
        Binds: [`${tempDir}:/app:ro`],
        Memory: 128 * 1024 * 1024, // Reduced to 128MB for better density
        MemorySwap: 128 * 1024 * 1024,
        NanoCpus: 500000000,       // 0.5 CPU limit
        NetworkMode: 'none',       // complete network isolation
        PidsLimit: 32,             // strictly limit processes
        ReadonlyRootfs: true,      // immutable root fs
        CapDrop: ['ALL'],          // drop all capabilities
        SecurityOpt: [
          'no-new-privileges',     // prevent suid/guid escalation
          'seccomp=unconfined'      // In a real prod, we'd pass a custom JSON profile here
        ],
        LogConfig: {
          Type: 'json-file',
          Config: { 'max-size': '10k', 'max-file': '1' }
        },
        OomKillDisable: false
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
      try { await container.stop(); } catch (_e) { /* ignore */ }
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
      } catch (_e) { /* ignore */ }
    }
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (_e) { /* ignore */ }
  }
};

module.exports = {
  runCode,
  RUNTIMES
};
