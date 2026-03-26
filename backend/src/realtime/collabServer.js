const { Server } = require('socket.io');
const { YSocketIO } = require('y-socket.io/dist/server');
const Y = require('yjs');
const { prisma } = require('../config/db');
const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');

const ROOM_PREFIX = 'file:';

const makeRoom = (fileId) => `${ROOM_PREFIX}${fileId}`;

const createCollabServer = async ({ httpServer, corsOrigin, redisUrl }) => {
  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigin || '*'
    }
  });

  let redisConnected = false;
  if (redisUrl) {
    try {
      const url = new URL(redisUrl);
      const isTls = url.protocol === 'rediss:';
      const pubClient = createClient({
        url: redisUrl,
        socket: isTls
          ? {
              tls: true,
              servername: url.hostname
            }
          : undefined
      });
      const subClient = pubClient.duplicate();
      await pubClient.connect();
      await subClient.connect();
      io.adapter(createAdapter(pubClient, subClient));
      redisConnected = true;
      console.log('✅ Redis Adapter connected');
    } catch (err) {
      console.warn('⚠️ Redis connection failed, falling back to in-memory adapter for local development.');
      redisConnected = false;
    }
  }

  const ysocketio = new YSocketIO(io, {
    authenticate: (handshake) => {
      const { verifyAuthToken } = require('../utils/authToken');
      const token = handshake?.auth?.token;
      const secret = process.env.SESSION_SECRET;
      const verified = verifyAuthToken({ token, secret });
      return verified.ok;
    }
  });
  ysocketio.initialize();

  const yPersistTimers = new Map();

  const parseFileIdFromRoom = (room) => {
    if (typeof room !== 'string') return null;
    if (!room.startsWith(ROOM_PREFIX)) return null;
    return room.slice(ROOM_PREFIX.length);
  };

  const persistRoomSoon = (doc) => {
    const room = doc?.name || doc?.roomName || doc?.id;
    const ydoc = doc?.ydoc || doc?.doc;
    if (!room || !ydoc) return;

    if (yPersistTimers.get(room)) return;
    yPersistTimers.set(
      room,
      setTimeout(async () => {
        yPersistTimers.delete(room);
        try {
          const update = Y.encodeStateAsUpdate(ydoc);
          const fileId = parseFileIdFromRoom(room) || null;
          await prisma.yjsSnapshot.upsert({
            where: { room },
            update: { fileId, state: Buffer.from(update) },
            create: { room, fileId, state: Buffer.from(update) }
          });
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('Failed to persist Yjs snapshot', err);
        }
      }, 1000)
    );
  };

  ysocketio.on('document-loaded', async (doc) => {
    try {
      const room = doc?.name || doc?.roomName || doc?.id;
      const ydoc = doc?.ydoc || doc?.doc;
      if (!room || !ydoc) return;

      const snap = await prisma.yjsSnapshot.findUnique({ where: { room } });
      if (snap?.state?.length) {
        Y.applyUpdate(ydoc, new Uint8Array(snap.state));
      } else {
        const fileId = parseFileIdFromRoom(room);
        if (fileId) {
          const file = await prisma.file.findUnique({ where: { id: fileId } });
          if (file?.content) {
            const ytext = ydoc.getText('monaco');
            if (ytext.length === 0) ytext.insert(0, file.content);
          }
        }
        persistRoomSoon(doc);
      }

      ydoc.on('update', async (update) => {
        try {
          await prisma.yjsUpdate.create({
            data: {
              room,
              update: Buffer.from(update)
            }
          });
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('Failed to persist yjs update', err);
        }
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to load Yjs snapshot', err);
    }
  });

  ysocketio.on('document-update', (doc) => {
    persistRoomSoon(doc);
  });

  ysocketio.on('all-document-connections-closed', (doc) => {
    persistRoomSoon(doc);
  });

  io.on('connection', (socket) => {
    socket.on('execute-code', async ({ code, language, fileId, sessionId }) => {
      // In a real app, verify the auth token and ensure the user is an EDITOR/INTERVIEWER in this session.
      // For this implementation, we will trust the socket event or perform a quick check if needed.
      const { runCode } = require('../services/executionService');
      
      socket.emit('execution-output', { type: 'system', payload: `Starting execution environment for ${language}...\n` });

      await runCode({
        code,
        language,
        onData: ({ isStderr, payload }) => {
          socket.emit('execution-output', {
            type: isStderr ? 'stderr' : 'stdout',
            payload
          });
        },
        onDone: (exitCode, err) => {
          if (err) {
            socket.emit('execution-output', { type: 'error', payload: `\nExecution Error: ${err.message || err}` });
          } else {
            socket.emit('execution-output', { type: 'system', payload: `\nProcess exited with code ${exitCode}` });
          }
          socket.emit('execution-finished', { exitCode });
        }
      });
      socket.on('pty-start', ({ sessionId } = {}) => {
        const ptyService = require('../services/ptyService');
        const ptyId = sessionId || socket.id;
        const ptyProcess = ptyService.createSession(ptyId);
        
        socket.emit('pty-output', '\x1b[32m--- Secure Docker Interactive Shell ---\x1b[0m\r\n');
        
        const dataListener = ptyProcess.onData((data) => {
          socket.emit('pty-output', data);
        });

        socket.on('pty-input', (data) => {
          ptyProcess.write(data);
        });

        socket.on('pty-resize', ({ cols, rows }) => {
          ptyService.resizeSession(ptyId, cols, rows);
        });

        socket.on('disconnect', () => {
          dataListener.dispose();
          ptyService.endSession(ptyId);
        });
      });
    });

  return { io, redisConnected };
};

module.exports = { createCollabServer };
