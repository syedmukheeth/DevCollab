import React, { useEffect, useMemo, useState } from 'react';
import * as Y from 'yjs';
import { SocketIOProvider } from 'y-socket.io';
import { FileExplorer } from './components/FileExplorer.jsx';
import { CodeEditor } from './components/CodeEditor.jsx';
import { GitPanel } from './components/GitPanel.jsx';
import { PresenceBar } from './components/PresenceBar.jsx';
import { InterviewTimer } from './components/InterviewTimer.jsx';
import { PlaybackModal } from './components/PlaybackModal.jsx';
import { DiffModal } from './components/DiffModal.jsx';
import { api } from './lib/api.js';
import { createDefaultWorkspace, createLocalFile, loadWorkspace, saveWorkspace } from './lib/workspace.js';

const DEFAULT_PROJECT_NAME = 'My DevCollab Project';

export default function App() {
  const [mode, setMode] = useState('cloud');
  const [banner, setBanner] = useState('');
  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [sessionData, setSessionData] = useState(null);
  const [sessionUser, setSessionUser] = useState(null);
  const [githubUser, setGithubUser] = useState(null);
  const [gitBranch, setGitBranch] = useState('main');
  const [gitMessage, setGitMessage] = useState('Update from DevCollab');
  const [gitStatus, setGitStatus] = useState('');
  const [loadingGitInit, setLoadingGitInit] = useState(false);
  const [loadingGitCommit, setLoadingGitCommit] = useState(false);
  const [loadingGitPR, setLoadingGitPR] = useState(false);
  const [presenceStates, setPresenceStates] = useState([]);
  const [globalProvider, setGlobalProvider] = useState(null);
  const [playbackFile, setPlaybackFile] = useState(null);
  const [diffFile, setDiffFile] = useState(null);
  const [outputLines, setOutputLines] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const isLocalMode = mode === 'local';
  const collaborationEnabled = !isLocalMode;

  const getOrCreateLocalUser = () => {
    try {
      const existing = window.localStorage.getItem('devcollab-user');
      if (existing) return JSON.parse(existing);
    } catch (e) {
      // ignore
    }
    const id = Math.random().toString(16).slice(2);
    const name = `User-${id.slice(0, 6)}`;
    const color = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
    const next = { name, color };
    window.localStorage.setItem('devcollab-user', JSON.stringify(next));
    return next;
  };

  const persistLocalWorkspace = (nextProject, nextFiles) => {
    const workspace = {
      project: nextProject,
      files: nextFiles
    };
    saveWorkspace(workspace);
  };

  const bootstrapLocalWorkspace = (message) => {
    const workspace = loadWorkspace() || createDefaultWorkspace();
    setMode('local');
    setBanner(message || 'Running in local workspace mode. Changes are saved in your browser.');
    setProject(workspace.project);
    setFiles(workspace.files);
    setActiveFileId(workspace.files[0]?.id || null);
    const localUser = getOrCreateLocalUser();
    setPresenceStates([{ user: localUser, status: 'local', activeFile: workspace.files[0]?.id || null }]);
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const authRes = await api.post('/auth/anonymous', {});
        if (authRes.data?.token) {
          window.localStorage.setItem('devcollab-token', authRes.data.token);
        }

        const projectsRes = await api.get('/projects');
        let activeProject = projectsRes.data?.[0] || null;
        if (!activeProject) {
          const created = await api.post('/projects', { name: DEFAULT_PROJECT_NAME });
          activeProject = created.data;
        }

        setMode('cloud');
        setProject(activeProject);

        const filesRes = await api.get(`/projects/${activeProject.id}/files`);
        const nextFiles = filesRes.data || [];
        setFiles(nextFiles);
        setActiveFileId(nextFiles[0]?.id || null);
        setBanner('');

        await fetchGithubUser();

        const urlParams = new URLSearchParams(window.location.search);
        const shareLink = urlParams.get('join');
        if (shareLink) {
          try {
            const { data } = await api.post('/sessions/join', { shareLink });
            setSessionData(data.session);
            setSessionUser(data.sessionUser);
          } catch (e) {
            console.error('Failed to join session', e);
          }
        }
      } catch (err) {
        console.error(err);
        bootstrapLocalWorkspace('Backend unavailable. Switched to local workspace mode; your files will stay in this browser.');
      } finally {
        setIsInitializing(false);
      }
    };
    bootstrap();
  }, []);

  useEffect(() => {
    if (!project || !collaborationEnabled) {
      setGlobalProvider(null);
      return undefined;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';
    const room = `project:${project.id}`;
    const token = window.localStorage.getItem('devcollab-token');

    const ydoc = new Y.Doc();
    const provider = new SocketIOProvider(socketUrl, room, ydoc, {
      auth: token ? { token } : {}
    });

    const localUser = getOrCreateLocalUser();
    provider.awareness.setLocalStateField('user', localUser);
    provider.awareness.setLocalStateField('status', 'idle');
    provider.awareness.setLocalStateField('activeFile', activeFileId);

    provider.awareness.on('change', () => {
      const states = Array.from(provider.awareness.getStates().values());
      setPresenceStates(states);
    });

    setGlobalProvider(provider);

    return () => {
      provider.destroy();
      ydoc.destroy();
    };
  }, [project, collaborationEnabled]);

  useEffect(() => {
    if (collaborationEnabled && globalProvider && activeFileId) {
      globalProvider.awareness.setLocalStateField('activeFile', activeFileId);
    }

    if (isLocalMode) {
      const localUser = getOrCreateLocalUser();
      setPresenceStates([{ user: localUser, status: 'local', activeFile: activeFileId }]);
    }
  }, [activeFileId, globalProvider, collaborationEnabled, isLocalMode]);

  useEffect(() => {
    if (!globalProvider) return undefined;
    const ioSocket = globalProvider.socket;
    if (!ioSocket) return undefined;

    const onOutput = (data) => {
      setOutputLines((prev) => [...prev, data]);
    };
    const onFinished = () => {
      setIsRunning(false);
      globalProvider.awareness.setLocalStateField('status', 'idle');
    };

    ioSocket.on('execution-output', onOutput);
    ioSocket.on('execution-finished', onFinished);

    return () => {
      ioSocket.off('execution-output', onOutput);
      ioSocket.off('execution-finished', onFinished);
    };
  }, [globalProvider]);

  const handleRefreshFiles = async () => {
    if (!project) return [];
    if (isLocalMode) {
      const workspace = loadWorkspace();
      const nextFiles = workspace.files || [];
      setFiles(nextFiles);
      return nextFiles;
    }
    const res = await api.get(`/projects/${project.id}/files`);
    setFiles(res.data);
    return res.data;
  };

  const handleCreateFile = async (name) => {
    if (!project) return;
    if (isLocalMode) {
      const newFile = createLocalFile(project.id, name);
      const nextFiles = [...files, newFile];
      setFiles(nextFiles);
      setActiveFileId(newFile.id);
      persistLocalWorkspace(project, nextFiles);
      return;
    }
    const res = await api.post(`/projects/${project.id}/files`, { name });
    const refreshed = await handleRefreshFiles();
    setActiveFileId(res.data.id || refreshed[refreshed.length - 1]?.id || null);
  };

  const handleDeleteFile = async (fileId) => {
    if (isLocalMode) {
      const remaining = files.filter((f) => f.id !== fileId);
      setFiles(remaining);
      setActiveFileId((current) => (current === fileId ? remaining[0]?.id || null : current));
      persistLocalWorkspace(project, remaining);
      return;
    }

    await api.delete(`/files/${fileId}`);
    const refreshed = await handleRefreshFiles();
    setActiveFileId((current) => (current === fileId ? refreshed[0]?.id || null : current));
  };

  const handleRenameFile = async (fileId, newName) => {
    if (isLocalMode) {
      const nextFiles = files.map((file) => (
        file.id === fileId
          ? { ...file, name: newName, updatedAt: new Date().toISOString() }
          : file
      ));
      setFiles(nextFiles);
      persistLocalWorkspace(project, nextFiles);
      return;
    }
    await api.put(`/files/${fileId}`, { name: newName });
    await handleRefreshFiles();
  };

  const handleContentChange = async (fileId, content) => {
    if (isLocalMode) {
      const nextFiles = files.map((file) => (
        file.id === fileId
          ? { ...file, content, updatedAt: new Date().toISOString() }
          : file
      ));
      setFiles(nextFiles);
      persistLocalWorkspace(project, nextFiles);
    }
  };

  const fetchGithubUser = async () => {
    try {
      const { data } = await api.get('/github/user');
      setGithubUser(data);
    } catch (e) {
      setGithubUser(null);
    }
  };

  const handleConnectGitHub = async () => {
    if (isLocalMode) {
      setGitStatus('GitHub integration is unavailable in local workspace mode.');
      return;
    }
    try {
      const { data } = await api.get('/github/auth');
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      window.open(data.url, 'GitHub Auth', `width=${width},height=${height},left=${left},top=${top}`);
    } catch (e) {
      setGitStatus('Failed to start GitHub auth');
    }
  };

  useEffect(() => {
    const handleMessage = (e) => {
      if (e.data === 'github-connected') {
        fetchGithubUser();
        setGitStatus('GitHub connected successfully!');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleGitInit = async () => {
    if (!project) return;
    if (isLocalMode) {
      setGitStatus('Initialize/link repository is disabled in local workspace mode.');
      return;
    }
    setLoadingGitInit(true);
    setGitStatus('');
    try {
      const res = await api.post(`/projects/${project.id}/github/init`, {});
      setGitStatus(`Repo ready: ${res.data.owner}/${res.data.repo} (branch: ${res.data.defaultBranch})`);
    } catch (err) {
      console.error(err);
      setGitStatus(err?.response?.data?.message || 'GitHub init failed');
    } finally {
      setLoadingGitInit(false);
    }
  };

  const handleGitCommit = async () => {
    if (!project) return;
    if (isLocalMode) {
      setGitStatus('Commit and push are unavailable without the backend.');
      return;
    }
    setLoadingGitCommit(true);
    setGitStatus('');
    try {
      const res = await api.post(`/projects/${project.id}/github/commit`, { branch: gitBranch, message: gitMessage });
      setGitStatus(`Committed ${res.data.commitSha.slice(0, 7)} to ${res.data.branch}`);
    } catch (err) {
      console.error(err);
      setGitStatus(err?.response?.data?.message || 'Commit failed');
    } finally {
      setLoadingGitCommit(false);
    }
  };

  const handleGitPR = async () => {
    if (!project) return;
    if (isLocalMode) {
      setGitStatus('Pull request creation is unavailable in local workspace mode.');
      return;
    }
    setLoadingGitPR(true);
    setGitStatus('');
    try {
      const res = await api.post(`/projects/${project.id}/github/create-pr`, {
        head: gitBranch,
        title: `PR from DevCollab: ${gitMessage}`,
        body: 'Automated PR created from DevCollab IDE.'
      });
      setGitStatus(`Created PR #${res.data.number}: ${res.data.html_url}`);
      window.open(res.data.html_url, '_blank');
    } catch (err) {
      console.error(err);
      setGitStatus(err?.response?.data?.message || 'PR creation failed');
    } finally {
      setLoadingGitPR(false);
    }
  };

  const [theme, setTheme] = useState(() => window.localStorage.getItem('devcollab-theme') || 'dark');

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    window.localStorage.setItem('devcollab-theme', next);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const activeFile = useMemo(
    () => files.find((f) => f.id === activeFileId) || null,
    [files, activeFileId]
  );

  const handleRunCode = () => {
    if (isLocalMode) {
      setOutputLines([{ type: 'system', payload: 'Code execution requires the backend runner. Local mode supports editing and file management only.' }]);
      setIsRunning(false);
      return;
    }

    if (!globalProvider || !globalProvider.socket || !activeFile) {
      if (!activeFile) setOutputLines([{ type: 'error', payload: 'No active file selected.' }]);
      return;
    }

    const ext = activeFile.name.split('.').pop().toLowerCase();
    const langMap = { py: 'python', js: 'javascript', ts: 'typescript', go: 'go', java: 'java' };
    const language = langMap[ext];

    if (!language) {
      setOutputLines([{ type: 'error', payload: `Unsupported file extension for execution: .${ext}` }]);
      return;
    }

    setOutputLines([]);
    setIsRunning(true);
    globalProvider.awareness.setLocalStateField('status', 'executing');

    globalProvider.socket.emit('execute-code', {
      code: window.getEditorCode ? window.getEditorCode() : (activeFile.content || ''),
      language,
      fileId: activeFileId
    });
  };

  const handleOpenHistory = () => {
    if (!activeFile) return;
    if (isLocalMode) {
      setGitStatus('Change history replay requires the backend event log.');
      return;
    }
    setPlaybackFile(activeFile);
  };

  const handleOpenDiff = () => {
    if (!activeFile) return;
    if (isLocalMode) {
      setGitStatus('Git diff is unavailable in local workspace mode.');
      return;
    }
    setDiffFile(activeFile);
  };

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-header-left">
          <div className="app-title">
             <span style={{ fontSize: '1.5rem' }}>💠</span> DevCollab
          </div>
          <div className="app-subtitle">
            {project ? project.name : 'Initializing project...'}
            {isLocalMode ? ' • Local mode' : ' • Cloud mode'}
          </div>
        </div>
        <div className="app-header-right" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={toggleTheme} className="theme-toggle" title="Toggle Theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          {sessionData?.interviewMode && (
            <InterviewTimer expiresAt={sessionData.expiresAt} onExpire={() => alert('Interview time ended!')} />
          )}
          {sessionData && sessionData.createdBy && sessionData.createdBy === sessionUser?.userId && sessionUser?.role === 'INTERVIEWER' && (
            <button
              onClick={async () => {
                await api.post(`/sessions/${sessionData.id}/end`);
                window.location.reload();
              }}
              className="morphic-button"
              style={{ background: '#ef4444', color: 'white' }}
            >
              End Interview
            </button>
          )}
          <PresenceBar users={presenceStates} />
        </div>
      </header>
      {banner ? <div className="banner-glass">{banner}</div> : null}
      <div className="app-body">
        <aside className="sidebar glass-panel">
          <FileExplorer
            files={files}
            activeFileId={activeFileId}
            onSelectFile={setActiveFileId}
            onCreateFile={handleCreateFile}
            onDeleteFile={handleDeleteFile}
            onRenameFile={handleRenameFile}
            disabled={isInitializing || !project}
            presenceStates={presenceStates}
          />
        </aside>
        <main className="editor-main-container">
          <div className="git-panel-wrapper glass-panel" style={{ padding: '0.5rem' }}>
            <GitPanel
              disabled={!project}
              branch={gitBranch}
              setBranch={setGitBranch}
              message={gitMessage}
              setMessage={setGitMessage}
              status={gitStatus}
              onInit={handleGitInit}
              onCommit={handleGitCommit}
              loadingInit={loadingGitInit}
              loadingCommit={loadingGitCommit}
              loadingPR={loadingGitPR}
              onPR={handleGitPR}
              githubUser={githubUser}
              onConnect={handleConnectGitHub}
            />
          </div>
          {activeFile ? (
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, padding: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.4rem 0.8rem', gap: '0.5rem' }}>
                <button onClick={handleOpenDiff} className="morphic-button">
                  Diff 📂
                </button>
                <button onClick={handleOpenHistory} className="morphic-button">
                  History 🕒
                </button>
                <button onClick={handleRunCode} disabled={isRunning} className="morphic-button primary">
                  {isRunning ? 'Running...' : 'Run ▶'}
                </button>
              </div>
              <div className="monaco-editor-wrapper" style={{ flex: 1, minHeight: 0, marginTop: '0.5rem' }}>
                <CodeEditor
                    key={`${activeFile.id}-${theme}`}
                    file={activeFile}
                    theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
                    readOnly={isInitializing || (sessionData?.interviewMode && sessionUser?.role === 'VIEWER')}
                    collaborationEnabled={collaborationEnabled}
                    onChange={(content) => handleContentChange(activeFile.id, content)}
                />
              </div>
              <div style={{ height: '30%', marginTop: '1rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '0.3rem 0.8rem', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Terminal</div>
                <div className="terminal-wrapper">
                  {outputLines.length === 0 && <span style={{ color: 'var(--text-muted)' }}>Output will appear here...</span>}
                  {outputLines.map((line, index) => (
                    <div key={`${line.type}-${index}`} style={{ color: line.type === 'error' || line.type === 'stderr' ? '#ef4444' : (line.type === 'system' ? 'var(--accent)' : 'var(--text-main)') }}>
                      {line.payload}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              {isInitializing
                ? 'Setting up your workspace...'
                : 'Create a file to start coding.'}
            </div>
          )}
        </main>
      </div>
      {playbackFile && (
        <PlaybackModal
          room={`file:${playbackFile.id}`}
          filename={playbackFile.name}
          onClose={() => setPlaybackFile(null)}
        />
      )}
      {diffFile && (
        <DiffModal
          projectId={project?.id}
          file={diffFile}
          onClose={() => setDiffFile(null)}
        />
      )}
      <footer className="glass-panel" style={{ marginTop: 'auto', padding: '0.6rem 1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.8rem', borderTop: '1px solid var(--border-glass)', borderRadius: '0' }}>
        <div style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
          Built with ❤️ by <a 
            href="https://www.linkedin.com/in/syedmukheeth" 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ color: 'var(--text-main)', textDecoration: 'none' }}
          >
            Syed Mukheeth
          </a>
          <span style={{ margin: '0 0.75rem', opacity: 0.3 }}>|</span>
          <a 
            href="https://www.linkedin.com/in/syedmukheeth" 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 700 }}
          >
            LinkedIn 🔗
          </a>
        </div>
      </footer>
    </div>
  );
}
