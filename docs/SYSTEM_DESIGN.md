# DevCollab High-Level System Design

DevCollab is a real-time collaborative coding platform that integrates code editing, live sync via CRDTs, and GitHub source control.

## System Architecture

```mermaid
graph TD
    Client[React Frontend] -->|HTTPS/REST| API[Express API]
    Client -->|WebSockets| SocketServer[Socket.io Server]
    
    subgraph "Backend Services"
        API -->|Prisma| DB[(PostgreSQL)]
        API -->|GitHub API| GitHub[GitHub REST API]
        SocketServer -->|Adapter| Redis[(Redis)]
        SocketServer -->|Execution| Docker[Docker Sandbox]
    end
    
    subgraph "Storage"
        DB --- Files[(Project Files)]
        DB --- Snapshots[(Yjs Snapshots)]
    end
```

## Key Components

### 1. **Real-time Collaboration (CRDT)**
- **Technology**: [Yjs](https://yjs.dev/) with `y-socket.io`.
- **Flow**: Clients maintain a local Yjs document. Changes are broadcast via WebSockets. The server acts as a relay and persists snapshots/updates to PostgreSQL.
- **Consistency**: Conflict-free Replicated Data Types (CRDT) ensure all clients eventually converge to the same state without a central "truth" lock.

### 2. **Code Execution Sandbox**
- **Technology**: `dockerode` interacting with a local/remote Docker daemon.
- **Flow**: API receives code and language. Spawns an isolated container with resource limits (CPU/Memory) and no network access. Streams output (stdout/stderr) back to the client via WebSockets.

### 3. **GitHub Integration**
- **Technology**: [Octokit](https://github.com/octokit/rest.js).
- **Flow**: User authenticates via GitHub OAuth. The API acts as a proxy to initialize repositories, commit file snapshots, and create Pull Requests.

### 4. **Persistence Layer**
- **Database**: PostgreSQL managed via Prisma ORM.

## Data Flow: Code Sync & Execution

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Socket Server
    participant DB as Database
    participant D as Docker
    
    C->>S: WebSocket Connect (Room: ProjectID)
    S->>DB: Load Snapshot
    DB-->>S: Return Snapshot
    S-->>C: Sync Initial State
    
    Note over C,S: Continuous Sync via Yjs Updates
    
    C->>S: Emit 'execute-code'
    S->>D: Spawn Container (Code, Language)
    D-->>S: Stream Output
    S-->>C: Emit 'execution-output'
```
