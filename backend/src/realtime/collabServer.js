const { Server } = require('socket.io');
const { YSocketIO } = require('y-socket.io/dist/server');
const File = require('../models/File');

const ROOM_PREFIX = 'file:';

const makeRoom = (fileId) => `${ROOM_PREFIX}${fileId}`;

const createCollabServer = ({ httpServer, corsOrigin }) => {
  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigin || '*'
    }
  });

  // Phase 3 (CRDT): Yjs sync + awareness over Socket.IO namespaces: /yjs|<room>
  // This runs alongside the Phase 2 revision-based events for now.
  const ysocketio = new YSocketIO(io);
  ysocketio.initialize();

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

