const os = require('os');
const pty = require('node-pty');

class PtyService {
  constructor() {
    this.sessions = new Map(); // Map<string, ptyProcess>
  }

  createSession(id) {
    if (this.sessions.has(id)) {
      return this.sessions.get(id);
    }
    
    // In production, spawn an isolated Docker container:
    // docker run -i --rm devcollab-runner-[lang] /bin/sh
    const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
    const isDockerless = process.env.RENDER || process.env.DOCKERLESS || true;
    
    let ptyProcess;
    if (isDockerless) {
      ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        cwd: process.env.HOME || process.env.USERPROFILE,
        env: process.env
      });
    } else {
      ptyProcess = pty.spawn('docker', ['run', '-i', '--rm', 'node:20-alpine', 'sh'], {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        cwd: process.env.HOME,
        env: process.env
      });
    }

    this.sessions.set(id, ptyProcess);

    ptyProcess.onExit(() => {
      this.sessions.delete(id);
    });

    return ptyProcess;
  }

  getSession(id) {
    return this.sessions.get(id);
  }

  resizeSession(id, cols, rows) {
    const ptyProcess = this.sessions.get(id);
    if (ptyProcess) {
      ptyProcess.resize(cols, rows);
    }
  }

  endSession(id) {
    const ptyProcess = this.sessions.get(id);
    if (ptyProcess) {
      ptyProcess.kill();
      this.sessions.delete(id);
    }
  }
}

module.exports = new PtyService();
