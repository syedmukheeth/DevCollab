# DevCollab (Phase 1)

DevCollab is a real-time collaborative coding platform (MERN stack). This repository currently contains the Phase 1 foundation: project/file management, Monaco-based editor, and a VS Code-style UI.

## Backend

- Node.js + Express
- MongoDB via Mongoose
- REST endpoints for projects/files

### Run backend

```bash
cd backend
cp .env.example .env   # edit MONGO_URI if needed
npm install
npm run dev
```

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

