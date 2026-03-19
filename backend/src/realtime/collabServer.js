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
    const pubClient = createClient({ url: redisUrl });
    const subClient = pubClient.duplicate();
    await pubClient.connect();
    await subClient.connect();
    io.adapter(createAdapter(pubClient, subClient));
  }

  // Phase 3 (CRDT): Yjs sync + awareness over Socket.IO namespaces: /yjs|<room>
  // This runs alongside the Phase 2 revision-based events for now.
  const ysocketio = new YSocketIO(io);
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

  // In-memory, per-file state. This is intentionally simple for Phase 2.
  // Phase 3 (CRDT) will replace this with shared document state (e.g. Yjs).
  const fileState = new Map();

  const getOrLoadFileState = async (fileId) => {
    const existing = fileState.get(fileId);
    if (existing) return existing;

    const file = await File.findById(fileId);
    if (!file) return null;

    const state = {
      fileId,
      content: file.content || '',
      rev: typeof file.rev === 'number' ? file.rev : 0,
      saveTimer: null
    };
    fileState.set(fileId, state);
    return state;
  };

  const schedulePersist = (state) => {
    if (state.saveTimer) return;
    state.saveTimer = setTimeout(async () => {
      state.saveTimer = null;
      try {
        await File.findByIdAndUpdate(state.fileId, {
          content: state.content,
          rev: state.rev
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to persist file state', err);
      }
    }, 500);
  };

  io.on('connection', (socket) => {
    socket.on('file:join', async ({ fileId }) => {
      if (!fileId) return;
      const state = await getOrLoadFileState(fileId);
      if (!state) {
        socket.emit('file:error', { fileId, message: 'File not found' });
        return;
      }

      socket.join(makeRoom(fileId));
      socket.emit('file:snapshot', {
        fileId,
        content: state.content,
        rev: state.rev
      });
    });

    socket.on('file:leave', ({ fileId }) => {
      if (!fileId) return;
      socket.leave(makeRoom(fileId));
    });

    socket.on('file:change', async ({ fileId, content, baseRev }) => {
      if (!fileId || typeof content !== 'string') return;

      const state = await getOrLoadFileState(fileId);
      if (!state) {
        socket.emit('file:error', { fileId, message: 'File not found' });
        return;
      }

      if (typeof baseRev !== 'number' || baseRev !== state.rev) {
        socket.emit('file:outOfDate', {
          fileId,
          content: state.content,
          rev: state.rev
        });
        return;
      }

      state.content = content;
      state.rev += 1;
      schedulePersist(state);

      socket.emit('file:ack', { fileId, rev: state.rev });
      socket.to(makeRoom(fileId)).emit('file:changed', {
        fileId,
        content: state.content,
        rev: state.rev
      });
    });

    socket.on('cursor:update', ({ fileId, cursor, selection }) => {
      if (!fileId) return;
      socket.to(makeRoom(fileId)).emit('cursor:updated', {
        fileId,
        socketId: socket.id,
        cursor,
        selection
      });
    });
  });

  return { io };
};

module.exports = { createCollabServer };

