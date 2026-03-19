# DevCollab (Phase 1)

DevCollab is a real-time collaborative coding platform (MERN stack). This repository currently contains the Phase 1 foundation: project/file management, Monaco-based editor, and a VS Code-style UI.

## Backend

- Node.js + Express
- MongoDB via Mongoose
- REST endpoints for projects/files
- Socket.IO real-time sync (Yjs CRDT) persisted to Mongo
- Optional Redis adapter for horizontal scaling

### Run backend

```bash
cd backend
cp .env.example .env   # edit MONGO_URI if needed
npm install
npm run dev
```

Required production env:
- `MONGO_URI`
- `SOCKET_ORIGIN` / `CLIENT_ORIGIN` (CORS)
- `REDIS_URL` (optional; enables Phase 5 scaling)
- `GITHUB_TOKEN` (optional; enables Phase 4 GitHub actions)

Key endpoints (base: `/api`):

- `POST /projects` – create project
- `GET /projects/:projectId/files` – list files for a project
- `POST /projects/:projectId/files` – create file
- `GET /files/:fileId` – get single file
- `PUT /files/:fileId` – update name/content
- `DELETE /files/:fileId` – delete file

## Frontend

- React + Vite
- Monaco Editor (`@monaco-editor/react`)
- Dark VS Code-like layout with sidebar explorer and main editor
- Real-time collaboration using Yjs (CRDT)

### Run frontend

```bash
cd frontend
npm install
npm run dev
```

Configure the API base URL if needed via:

```bash
VITE_API_BASE_URL=http://localhost:4000/api
```

## Notes for future phases

- WebSocket server (Socket.IO) can be mounted on the same Express app.
- Per-file collaboration rooms can be keyed by `projectId:fileId`.
- CRDT (e.g. Yjs) can be integrated at the editor layer while still persisting snapshots via existing file APIs.

## Phase 2 (real-time) – added

- Socket.IO server is mounted on the backend HTTP server.
- Clients join a room per file (`file:<fileId>`).
- Live edits use a simple revision counter (`rev`) with last-write-wins semantics.
- Cursor/selection positions are broadcast and rendered as Monaco decorations.

## Phase 3+4+5 (production state)

- Phase 3: Monaco editing is CRDT-based via Yjs + y-socket.io.
- Phase 3 persistence: Yjs snapshots are stored in MongoDB (`YjsSnapshot` per room).
- Phase 4: REST endpoints to initialize GitHub repo and commit current file contents.
- Phase 5: Socket.IO uses Redis Pub/Sub adapter when `REDIS_URL` is set.

