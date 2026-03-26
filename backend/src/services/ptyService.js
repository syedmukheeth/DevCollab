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
    // For universal interactive shell, we can just use an Alpine or Ubuntu container.
    // For this demonstration, we spawn a generic node shell. On windows, it defaults to powershell if not careful.
    const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
    
    // To stick to the Google-grade architecture, we want the PTY isolated. 
    // We can assume Docker is running: docker run -i --rm -a stdin -a stdout -a stderr alpine sh
    const ptyProcess = pty.spawn('docker', ['run', '-i', '--rm', 'node:20-alpine', 'sh'], {
      name: 'xterm-color',
      cols: 80,
      rows: 30,
      cwd: process.env.HOME,
      env: process.env
    });

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
