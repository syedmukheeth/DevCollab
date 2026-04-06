const WebSocket = require('ws');
const { spawn } = require('child_process');

function setupLspServer(server) {
  const wss = new WebSocket.Server({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    if (request.url.startsWith('/lsp/')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (ws, request) => {
    const lang = request.url.split('/').pop();
    
    // Architecturally, SyncMesh spins up Docker containers for the Language Server.
    // For this tier, we seamlessly provision typescript-language-server dynamically 
    // by streaming standard I/O to the JSON-RPC WebSockets in real time.
    const isDockerless = process.env.RENDER || process.env.DOCKERLESS || true; // Set true by default for this tier
    let lspProcess;
    
    if (lang === 'javascript' || lang === 'typescript') {
      if (isDockerless) {
        lspProcess = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['-y', 'typescript-language-server', '--stdio']);
      } else {
        lspProcess = spawn('docker', ['run', '-i', '--rm', 'node:20-alpine', 'npx', '-y', 'typescript-language-server', '--stdio']);
      }
    } else if (lang === 'python') {
      if (isDockerless) {
        lspProcess = spawn('pylsp');
      } else {
        lspProcess = spawn('docker', ['run', '-i', '--rm', 'python:3-alpine', 'sh', '-c', 'pip install python-lsp-server && pylsp']);
      }
    } else {
      ws.close();
      return;
    }

    ws.on('message', (msg) => {
      lspProcess.stdin.write(msg);
    });

    lspProcess.stdout.on('data', (data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    lspProcess.stderr.on('data', (data) => {
      console.error(`LSP [${lang}] stderr: `, data.toString());
    });

    lspProcess.on('error', (err) => {
      console.error(`LSP [${lang}] fail to spawn: `, err.message);
      if (ws.readyState === WebSocket.OPEN) ws.close();
    });

    ws.on('close', () => {
      lspProcess.kill();
    });
  });
}

module.exports = { setupLspServer };
