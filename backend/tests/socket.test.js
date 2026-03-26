const { Server } = require('socket.io');
const Client = require('socket.io-client');
const http = require('http');
const express = require('express');

describe('WebSocket Collaboration Server', () => {
  let io, serverSocket, clientSocket;

  beforeAll((done) => {
    const app = express();
    const httpServer = http.createServer(app);
    io = new Server(httpServer);
    
    // Simple echo for testing socket connection
    io.on('connection', (socket) => {
      serverSocket = socket;
      socket.on('join-room', (room) => {
        socket.join(room);
        socket.emit('joined', room);
      });
      socket.on('execute-code', (data) => {
        io.to(Array.from(socket.rooms)[1]).emit('execution-output', { type: 'system', payload: 'Code received' });
      });
    });

    httpServer.listen(() => {
      const port = httpServer.address().port;
      clientSocket = new Client(`http://localhost:${port}`);
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
  });

  test('Client can connect and join a document room', (done) => {
    clientSocket.emit('join-room', 'doc-123');
    clientSocket.on('joined', (room) => {
      expect(room).toBe('doc-123');
      done();
    });
  });

  test('Client can emit execute-code and receive execution-output', (done) => {
    clientSocket.on('execution-output', (data) => {
      expect(data.payload).toBe('Code received');
      done();
    });
    clientSocket.emit('execute-code', { code: 'print(1)', language: 'python' });
  });
});
