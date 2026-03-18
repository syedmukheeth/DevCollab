import React, { useEffect, useState } from 'react';
import { FileExplorer } from './components/FileExplorer.jsx';
import { CodeEditor } from './components/CodeEditor.jsx';
import { api } from './lib/api.js';
import { socket } from './lib/socket.js';

const DEFAULT_PROJECT_NAME = 'My DevCollab Project';

export default function App() {
  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        // For phase 1, always create a fresh project on load.
        const projectRes = await api.post('/projects', {
          name: DEFAULT_PROJECT_NAME
        });
        setProject(projectRes.data);

        const filesRes = await api.get(`/projects/${projectRes.data._id}/files`);
        setFiles(filesRes.data);
        if (filesRes.data.length > 0) {
          setActiveFileId(filesRes.data[0]._id);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
      } finally {
        setIsInitializing(false);
      }
    };
    bootstrap();
  }, []);

  // Phase 3 (CRDT) uses Yjs + y-socket.io directly. The Phase 2 Socket.IO events
  // remain on the server, but the UI no longer depends on them for content sync.

  const handleRefreshFiles = async () => {
    if (!project) return;
    const res = await api.get(`/projects/${project._id}/files`);
    setFiles(res.data);
  };

  const handleCreateFile = async (name) => {
    if (!project) return;
    const res = await api.post(`/projects/${project._id}/files`, {
      name
    });
    await handleRefreshFiles();
    setActiveFileId(res.data._id);
  };

  const handleDeleteFile = async (fileId) => {
    await api.delete(`/files/${fileId}`);
    await handleRefreshFiles();
    setActiveFileId((current) => {
      if (current === fileId) {
        const remaining = files.filter((f) => f._id !== fileId);
        return remaining.length ? remaining[0]._id : null;
      }
      return current;
    });
  };

  const handleRenameFile = async (fileId, newName) => {
    await api.put(`/files/${fileId}`, { name: newName });
    await handleRefreshFiles();
  };

  const handlePersistFileContent = async (fileId, content) => {
    await api.put(`/files/${fileId}`, { content });
    setFiles((prev) => prev.map((f) => (f._id === fileId ? { ...f, content } : f)));
  };

  const activeFile = files.find((f) => f._id === activeFileId) || null;

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-title">DevCollab</div>
        <div className="app-subtitle">
          {project ? project.name : 'Initializing project...'}
        </div>
      </header>
      <div className="app-body">
        <aside className="sidebar">
          <FileExplorer
            files={files}
            activeFileId={activeFileId}
            onSelectFile={setActiveFileId}
            onCreateFile={handleCreateFile}
            onDeleteFile={handleDeleteFile}
            onRenameFile={handleRenameFile}
            disabled={isInitializing || !project}
          />
        </aside>
        <main className="editor-container">
          {activeFile ? (
            <CodeEditor
              key={activeFile._id}
              file={activeFile}
              onPersistContent={(content) =>
                handlePersistFileContent(activeFile._id, content)
              }
              readOnly={isInitializing}
            />
          ) : (
            <div className="empty-state">
              {isInitializing
                ? 'Setting up your workspace...'
                : 'Create a file to start coding.'}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

