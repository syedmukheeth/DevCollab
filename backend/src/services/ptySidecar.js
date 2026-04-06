const pty = require('node-pty');
const containerPool = require('./containerPool');
const logger = require('../utils/logger');

/**
 * PRODUCTION-GRADE PTY SIDECAR
 * Decouples terminal management from the main API process.
 * Uses pre-warmed containers from the pool for instant shell access.
 */

class PtySidecar {
  constructor() {
    this.sessions = new Map();
  }

  async createSession(id, { cols = 80, rows = 30 } = {}) {
    if (this.sessions.has(id)) {
      return this.sessions.get(id);
    }

    logger.info(`Creating PTY session ${id} using pooled container...`);
    
    const isDockerless = process.env.RENDER || process.env.DOCKERLESS || true;
    let ptyProcess, containerId, container;

    if (isDockerless) {
      const shell = process.platform === 'win32' ? 'powershell.exe' : 'sh';
      ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-256color',
        cols,
        rows,
        env: { ...process.env, TERM: 'xterm-256color' }
      });
    } else {
      // 1. Get a pre-warmed container from the pool
      container = await containerPool.getContainer('javascript'); // Defaulting to node-alpine for shell
      containerId = container.id;

      // 2. Spawn node-pty to exec into the running container
      ptyProcess = pty.spawn('docker', ['exec', '-it', containerId, 'sh'], {
        name: 'xterm-256color',
        cols,
        rows,
        env: { ...process.env, TERM: 'xterm-256color' }
      });
    }

    const session = {
      pty: ptyProcess,
      containerId,
      container
    };

    this.sessions.set(id, session);

    ptyProcess.onExit(async () => {
      logger.info(`PTY session ${id} exited. Cleaning up container ${containerId}...`);
      this.sessions.delete(id);
      try {
        await container.remove({ force: true });
      } catch (err) {
        logger.error(`Failed to cleanup container ${containerId}: ${err.message}`);
      }
    });

    return ptyProcess;
  }

  resizeSession(id, cols, rows) {
    const session = this.sessions.get(id);
    if (session?.pty) {
      session.pty.resize(cols, rows);
    }
  }

  async endSession(id) {
    const session = this.sessions.get(id);
    if (session) {
      session.pty.kill();
      // OnExit handler handles the rest
    }
  }
}

module.exports = new PtySidecar();
