const { Server } = require('socket.io');
const { YSocketIO } = require('y-socket.io/dist/server');
const Y = require('yjs');
const { prisma } = require('../config/db');
const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');
const { setupWebRTCSignaling } = require('./signaling');
const historyService = require('../services/historyService');
const logger = require('../utils/logger');

const ROOM_PREFIX = 'file:';

const createCollabServer = async ({ httpServer, corsOrigin, redisUrl }) => {
  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigin || '*'
    }
  });

  let redisConnected = false;
  let pubClient = null;
  if (redisUrl) {
    try {
      const url = new URL(redisUrl);
      const isTls = url.protocol === 'rediss:';
      pubClient = createClient({
        url: redisUrl,
        socket: isTls
          ? {
              tls: true,
              servername: url.hostname
            }
          : undefined
      });
      pubClient.on('error', (err) => {
        console.warn('🔴 Redis Pub Client Error:', err.message);
      });
      const subClient = pubClient.duplicate();
      subClient.on('error', (err) => {
        console.warn('🔴 Redis Sub Client Error:', err.message);
      });
      await pubClient.connect();
      await subClient.connect();
      io.adapter(createAdapter(pubClient, subClient));
      redisConnected = true;
      console.log('✅ Redis Adapter connected');
    } catch (_err) {
      console.warn('⚠️ Redis connection failed, falling back to in-memory adapter for local development.');
      pubClient = null;
      redisConnected = false;
    }
  }

  const ysocketio = new YSocketIO(io, {
    authenticate: async (handshake) => {
      const { verifyAuthToken } = require('../utils/authToken');
      const token = handshake?.auth?.token;
      const { ok } = await verifyAuthToken({ token });
      return ok;
    }
  });
  ysocketio.initialize();

  // --- SEPARATE AWARENESS / PRESENCE CHANNEL ---
  // A dedicated namespace for high-frequency cursor/presence data.
  // This ensures document synchronization never blocks awareness updates.
  const presenceNamespace = io.of(/^\/presence\|.*$/);
  
  presenceNamespace.on('connection', (socket) => {
    const room = socket.nsp.name.split('|')[1];
    if (!room) return socket.disconnect();

    socket.join(room);
    logger.info(`Presence: Client connected to room ${room}`);

    socket.on('awareness-update', (update) => {
      // Relay awareness to all other clients in the same project room
      socket.to(room).emit('awareness-update', update);
    });

    socket.on('disconnect', () => {
      logger.info(`Presence: Client disconnected from room ${room}`);
    });
  });

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
          
          // 1. Database-Level Snapshot
          await prisma.yjsSnapshot.upsert({
            where: { room },
            update: { fileId, state: Buffer.from(update) },
            create: { room, fileId, state: Buffer.from(update) }
          });

          // 2. S3/MinIO-Level Checkpoint (Merkle Root)
          // We get the list of update hashes for this room to form the checkpoint.
          // For simplicity in this step, we'll archive the full snapshot as a chunk.
          const snapHash = await historyService.archiveUpdate(Buffer.from(update));
          await historyService.createCheckpoint(room, [snapHash]);
          logger.info(`✅ Created Merkle checkpoint for room ${room}`);
        } catch (err) {
          logger.error('Failed to persist Yjs snapshot and create checkpoint', err);
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
          // 1. Persist to Redis Stream for high-performance op log
          if (redisUrl && pubClient?.isOpen) {
            const streamKey = `yjs:stream:${room}`;
            await pubClient.xAdd(streamKey, '*', {
              update: Buffer.from(update).toString('base64')
            }, {
              TRIM: {
                strategy: 'MAXLEN',
                strategyModifier: '~',
                threshold: 1000 // Keep last 1000 ops in stream for recovery
              }
            });
          }

          // 2. Background persistence to Prisma
          await prisma.yjsUpdate.create({
            data: {
              room,
              update: Buffer.from(update)
            }
          });

          // 3. Incremental Archiving to S3
          await historyService.archiveUpdate(Buffer.from(update));
        } catch (err) {
          logger.error('Failed to persist yjs update', err);
        }
      });
    } catch (err) {
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
    socket.on('execute-code', async ({ code, language, sessionId: _sessionId }) => {
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

    // Simple signaling for project-level awareness (cursors are handled by Yjs)
    socket.on('join-project', (projectId) => {
      socket.join(`project-${projectId}`);
    });
  });

  // Dedicated WebRTC signaling for audio/video calling
  setupWebRTCSignaling(io);

  return { io, redisConnected };
};

module.exports = { createCollabServer };
