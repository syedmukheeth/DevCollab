import React, { useEffect, useState } from 'react';
import { FileExplorer } from './components/FileExplorer.jsx';
import { CodeEditor } from './components/CodeEditor.jsx';
import { GitPanel } from './components/GitPanel.jsx';
import { api } from './lib/api.js';

const DEFAULT_PROJECT_NAME = 'My DevCollab Project';

export default function App() {
  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [gitBranch, setGitBranch] = useState('main');
  const [gitMessage, setGitMessage] = useState('Update from DevCollab');
  const [gitStatus, setGitStatus] = useState('');
  const [loadingGitInit, setLoadingGitInit] = useState(false);
  const [loadingGitCommit, setLoadingGitCommit] = useState(false);

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

  const activeFile = files.find((f) => f._id === activeFileId) || null;

  const handleGitInit = async () => {
    if (!project) return;
    setLoadingGitInit(true);
    setGitStatus('');
    try {
      const res = await api.post(
        `/projects/${project._id}/github/init`,
        {}
      );
      setGitStatus(
        `Repo ready: ${res.data.owner}/${res.data.repo} (branch: ${res.data.defaultBranch})`
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setGitStatus(err?.response?.data?.message || 'GitHub init failed');
    } finally {
      setLoadingGitInit(false);
    }
  };

  const handleGitCommit = async () => {
    if (!project) return;
    setLoadingGitCommit(true);
    setGitStatus('');
    try {
      const res = await api.post(
        `/projects/${project._id}/github/commit`,
        { branch: gitBranch, message: gitMessage }
      );
      setGitStatus(
        `Committed ${res.data.commitSha.slice(0, 7)} to ${res.data.branch}`
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setGitStatus(err?.response?.data?.message || 'Commit failed');
    } finally {
      setLoadingGitCommit(false);
    }
  };

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-header-left">
          <div className="app-title">DevCollab</div>
          <div className="app-subtitle">
            {project ? project.name : 'Initializing project...'}
          </div>
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
          <div className="git-panel-wrapper">
            <GitPanel
              disabled={!project || isInitializing}
              branch={gitBranch}
              setBranch={setGitBranch}
              message={gitMessage}
              setMessage={setGitMessage}
              status={gitStatus}
              onInit={handleGitInit}
              onCommit={handleGitCommit}
              loadingInit={loadingGitInit}
              loadingCommit={loadingGitCommit}
            />
          </div>
          {activeFile ? (
            <CodeEditor
              key={activeFile._id}
              file={activeFile}
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

