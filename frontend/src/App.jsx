import React, { useEffect, useState } from 'react';
import { FileExplorer } from './components/FileExplorer.jsx';
import { CodeEditor } from './components/CodeEditor.jsx';
import { GitPanel } from './components/GitPanel.jsx';
import { PresenceBar } from './components/PresenceBar.jsx';
import { InterviewTimer } from './components/InterviewTimer.jsx';
import { PlaybackModal } from './components/PlaybackModal.jsx';
import { DiffModal } from './components/DiffModal.jsx';
import { api } from './lib/api.js';
import * as Y from 'yjs';
import { SocketIOProvider } from 'y-socket.io';

const DEFAULT_PROJECT_NAME = 'My DevCollab Project';

export default function App() {
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

  // Helper for local devcollab user
  const getOrCreateLocalUser = () => {
    try {
      const existing = window.localStorage.getItem('devcollab-user');
      if (existing) return JSON.parse(existing);
    } catch (e) {}
    const id = Math.random().toString(16).slice(2);
    const name = `User-${id.slice(0, 6)}`;
    const color = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
    const next = { name, color };
    window.localStorage.setItem('devcollab-user', JSON.stringify(next));
    return next;
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

        setProject(activeProject);

        const filesRes = await api.get(`/projects/${activeProject.id}/files`);
        setFiles(filesRes.data);
        if (filesRes.data.length > 0) setActiveFileId(filesRes.data[0].id);

        await fetchGithubUser();

        // Check if we are in a session
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
        // eslint-disable-next-line no-console
        console.error(err);
      } finally {
        setIsInitializing(false);
      }
    };
    bootstrap();
  }, []);

  useEffect(() => {
    if (!project) return;
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
  }, [project]);

  // Update active file in global awareness
  useEffect(() => {
    if (globalProvider && activeFileId) {
      globalProvider.awareness.setLocalStateField('activeFile', activeFileId);
    }
  }, [activeFileId, globalProvider]);

  // Execution Event Listeners moved down
  useEffect(() => {
    if (!globalProvider) return;
    const ioSocket = globalProvider.socket;
    if (!ioSocket) return;

    const onOutput = (data) => {
      setOutputLines(prev => [...prev, data]);
    };
    const onFinished = () => {
      setIsRunning(false);
    };

    ioSocket.on('execution-output', onOutput);
    ioSocket.on('execution-finished', onFinished);

    return () => {
      ioSocket.off('execution-output', onOutput);
      ioSocket.off('execution-finished', onFinished);
    };
  }, [globalProvider]);

  // Phase 3 (CRDT) uses Yjs + y-socket.io directly. The Phase 2 Socket.IO events
  // remain on the server, but the UI no longer depends on them for content sync.

  const handleRefreshFiles = async () => {
    if (!project) return;
    const res = await api.get(`/projects/${project.id}/files`);
    setFiles(res.data);
  };

  const handleCreateFile = async (name) => {
    if (!project) return;
    const res = await api.post(`/projects/${project.id}/files`, {
      name
    });
    await handleRefreshFiles();
    setActiveFileId(res.data.id);
  };

  const handleDeleteFile = async (fileId) => {
    await api.delete(`/files/${fileId}`);
    await handleRefreshFiles();
    setActiveFileId((current) => {
      if (current === fileId) {
        const remaining = files.filter((f) => f.id !== fileId);
        return remaining.length ? remaining[0].id : null;
      }
      return current;
    });
  };

  const handleRenameFile = async (fileId, newName) => {
    await api.put(`/files/${fileId}`, { name: newName });
    await handleRefreshFiles();
  };



  const fetchGithubUser = async () => {
    try {
      const { data } = await api.get('/github/user');
      setGithubUser(data);
    } catch (e) {
      // ignore
    }
  };

  const handleConnectGitHub = async () => {
    try {
      const { data } = await api.get('/github/auth');
      const width = 600, height = 700;
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
    setLoadingGitInit(true);
    setGitStatus('');
    try {
      const res = await api.post(
        `/projects/${project.id}/github/init`,
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
        `/projects/${project.id}/github/commit`,
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

  const handleGitPR = async () => {
    if (!project) return;
    setLoadingGitPR(true);
    setGitStatus('');
    try {
      const res = await api.post(`/projects/${project.id}/github/create-pr`, {
        head: gitBranch,
        title: `PR from DevCollab: ${gitMessage}`,
        body: `Automated PR created from DevCollab IDE.`
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

  const activeFile = files.find((f) => f.id === activeFileId) || null;

  const handleRunCode = () => {
    if (!globalProvider || !globalProvider.socket || !activeFile) {
      if (!activeFile) setOutputLines([{ type: 'error', payload: 'No active file selected.' }]);
      return;
    }
    
    // Determine language by extension
    const ext = activeFile.name.split('.').pop().toLowerCase();
    const langMap = { py: 'python', js: 'javascript', ts: 'typescript', go: 'go', java: 'java' };
    const language = langMap[ext];
    
    if (!language) {
      setOutputLines([{ type: 'error', payload: `Unsupported file extension for execution: .${ext}` }]);
      return;
    }

    setOutputLines([]);
    setIsRunning(true);

    globalProvider.socket.emit('execute-code', { 
      code: window.getEditorCode ? window.getEditorCode() : (activeFile.content || ''),
      language, 
      fileId: activeFileId 
    });
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
        <div className="app-header-right">
          {sessionData?.interviewMode && (
            <InterviewTimer expiresAt={sessionData.expiresAt} onExpire={() => alert('Interview time ended!')} />
          )}
          {sessionData?.createdBy === window.localStorage.getItem('devcollab-user-id-placeholder') && (
             /* Actually I should check if requester is creator */
             sessionUser?.role === 'INTERVIEWER' && (
               <button onClick={async () => {
                 await api.post(`/sessions/${sessionData.id}/end`);
                 window.location.reload();
               }} style={{marginLeft: '1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', padding: '0.2rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer'}}>
                 End Interview
               </button>
             )
          )}
          <PresenceBar users={presenceStates} />
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
            presenceStates={presenceStates}
          />
        </aside>
        <main className="editor-container">
          <div className="git-panel-wrapper">
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
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.4rem 0.8rem', backgroundColor: '#020617', borderBottom: '1px solid #1f2937', gap: '0.5rem' }}>
                <button onClick={() => setDiffFile(activeFile)} style={{ cursor: 'pointer', padding: '0.3rem 0.8rem', background: '#374151', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.8rem' }}>
                  Diff 📂
                </button>
                <button onClick={() => setPlaybackFile(activeFile)} style={{ cursor: 'pointer', padding: '0.3rem 0.8rem', background: '#374151', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.8rem' }}>
                  History 🕒
                </button>
                <button onClick={handleRunCode} disabled={isRunning} style={{ cursor: isRunning ? 'not-allowed' : 'pointer', padding: '0.3rem 1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  {isRunning ? 'Running...' : 'Run ▶'}
                </button>
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <CodeEditor
                  key={activeFile.id}
                  file={activeFile}
                  readOnly={isInitializing || (sessionData?.interviewMode && sessionUser?.role === 'VIEWER')}
                />
              </div>
              <div style={{ height: '35%', backgroundColor: '#020617', borderTop: '1px solid #1f2937', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '0.3rem 0.8rem', fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #1f2937' }}>Terminal</div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0.8rem', fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                  {outputLines.length === 0 && <span style={{color: '#4b5563'}}>Output will appear here...</span>}
                  {outputLines.map((l, i) => (
                    <span key={i} style={{ color: l.type === 'error' || l.type === 'stderr' ? '#ef4444' : (l.type === 'system' ? '#60a5fa' : '#d1d5db') }}>
                      {l.payload}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
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
    </div>
  );
}

