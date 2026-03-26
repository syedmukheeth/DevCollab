# DevCollab 🚀

DevCollab is a high-performance, real-time collaborative coding platform designed for developers and interviewers. It features conflict-free editing (CRDT), integrated code execution, and seamless GitHub synchronization.

## ✨ Features

- 🤝 **Real-time Collaboration**: Live multi-user editing powered by **Yjs** and **Socket.io**.
- 🛠️ **Integrated IDE**: Fully featured code editor using **Monaco Editor** (VS Code's engine).
- ⚡ **Instant Execution**: Run code in secure, isolated Docker sandboxes (JS, Python, Go, Java, TS).
- 🔗 **GitHub Integration**: Initialize repositories, commit changes, and create PRs directly from the IDE.
- 🕒 **Change History**: Playback and visual diffing of file history.
- 👥 **Interview Mode**: Dedicated mode for technical interviews with synchronized timers.

## 🏗️ Architecture

DevCollab is built with a modern, scalable stack:

- **Frontend**: React, Vite, Monaco Editor, Tailwind-inspired CSS.
- **Backend**: Node.js, Express, Socket.io.
- **Database**: PostgreSQL with **Prisma ORM**.
- **Real-time Layer**: Yjs (CRDT) with Redis Pub/Sub for horizontal scaling.
- **Execution Engine**: Docker (Dockerode) for isolated code sandboxes.

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- Docker (for code execution)
- PostgreSQL
- Redis (optional, for scaling)

### Local Setup

1. **Clone & Install**:
   ```bash
   git clone https://github.com/syedmukheeth/DevCollab.git
   cd DevCollab
   ```

2. **Backend**:
   ```bash
   cd backend
   cp .env.example .env # Update DATABASE_URL and SECRETs
   npm install
   npx prisma generate
   npx prisma db push
   npm run dev
   ```

3. **Frontend**:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

### Docker (Recommended)

Run the entire stack in one command:
```bash
docker compose up --build
```

- **Frontend**: `http://localhost:5173`
- **Backend**: `http://localhost:4000`

## ⚙️ Environment Variables

### Backend
- `DATABASE_URL`: PostgreSQL connection string.
- `SESSION_SECRET`: Random string for session security.
- `REDIS_URL`: (Optional) Redis connection for scaling.
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`: For OAuth integration.

### Frontend
- `VITE_API_BASE_URL`: Backend API URL.
- `VITE_SOCKET_URL`: Backend WebSocket URL.

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

