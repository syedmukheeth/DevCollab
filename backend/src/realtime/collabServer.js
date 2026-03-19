const { Server } = require('socket.io');
const { YSocketIO } = require('y-socket.io/dist/server');
const Y = require('yjs');
const File = require('../models/File');
const YjsSnapshot = require('../models/YjsSnapshot');
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

  // Phase 5 (scaling): use Socket.IO Redis adapter so events broadcast across processes.
  if (redisUrl) {
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
  }

  // Phase 3 (CRDT): Yjs sync + awareness over Socket.IO namespaces: /yjs|<room>
  // This runs alongside the Phase 2 revision-based events for now.
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

  // --- Mongo-backed Yjs snapshot persistence ---
  // Stores a compact doc snapshot per room. This avoids unbounded growth from per-update logs.
  // Room name is what the client passes to SocketIOProvider (we use `file:<fileId>`).
  const yPersistTimers = new Map(); // room -> timeout

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
          const fileId = parseFileIdFromRoom(room);
          await YjsSnapshot.findOneAndUpdate(
            { room },
            { room, fileId: fileId || undefined, state: Buffer.from(update) },
            { upsert: true, new: true }
          );
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

      const snap = await YjsSnapshot.findOne({ room });
      if (snap?.state?.length) {
        Y.applyUpdate(ydoc, new Uint8Array(snap.state));
      } else {
        // First load: hydrate from current File.content (Phase 1 REST content) if present.
        const fileId = parseFileIdFromRoom(room);
        if (fileId) {
          const file = await File.findById(fileId);
          if (file?.content) {
            const ytext = ydoc.getText('monaco');
            if (ytext.length === 0) ytext.insert(0, file.content);
          }
        }
        persistRoomSoon(doc);
      }
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

  return { io };
};

module.exports = { createCollabServer };

