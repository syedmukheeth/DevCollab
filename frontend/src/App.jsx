import React, { useEffect, useMemo, useState } from 'react';
import * as Y from 'yjs';
import { SocketIOProvider } from 'y-socket.io';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layout, 
  BarChart3, 
  Settings, 
  Keyboard, 
  Image as ImageIcon, 
  Share2, 
  Moon, 
  Sun, 
  LogOut, 
  Github,
  Zap,
  Menu,
  Box,
  Play
} from 'lucide-react';
import { FileExplorer } from './components/FileExplorer.jsx';
import { CodeEditor } from './components/CodeEditor.jsx';
import { GitPanel } from './components/GitPanel.jsx';
import { PresenceBar } from './components/PresenceBar.jsx';
import { InterviewTimer } from './components/InterviewTimer.jsx';
import { PlaybackModal } from './components/PlaybackModal.jsx';
import { DiffModal } from './components/DiffModal.jsx';
import { SettingsModal, ShortcutsOverlay } from './components/SettingsModal.jsx';
import { LandingPage } from './components/LandingPage.jsx';
import { SessionPanel } from './components/SessionPanel.jsx';
import { MetricsPanel } from './components/MetricsPanel.jsx';
import { TerminalPanel } from './components/TerminalPanel.jsx';
import { MeetingPanel } from './components/MeetingPanel.jsx';
import { CopilotPanel } from './components/CopilotPanel.jsx';
import AssetGallery from './components/AssetGallery.jsx';
import { SearchPanel } from './components/SearchPanel.jsx';
import { ShareModal } from './components/ShareModal.jsx';
import { CommandPalette } from './components/CommandPalette.jsx';
import { Breadcrumbs } from './components/Breadcrumbs.jsx';
import { registerShortcuts } from './lib/keybindings.js';
import { api } from './lib/api.js';
import { createDefaultWorkspace, createLocalFile, loadWorkspace, saveWorkspace } from './lib/workspace.js';

const DEFAULT_PROJECT_NAME = 'My DevCollab Project';

export default function App() {
  const [mode, setMode] = useState('cloud');
  const [banner, setBanner] = useState('');
  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([]);
  const [openedFileIds, setOpenedFileIds] = useState([]);
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
  const [showLanding, setShowLanding] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showAssets, setShowAssets] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState('explorer');
  const [currentUser, setCurrentUser] = useState(null);
  const [theme, setTheme] = useState(() => window.localStorage.getItem('devcollab-theme') || 'dark');
  const [editorSettings, setEditorSettings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('devcollab-editor-settings') || '{}');
    } catch { return {}; }
  });

  const isLocalMode = mode === 'local';
  const collaborationEnabled = !isLocalMode;

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

  const persistLocalWorkspace = (nextProject, nextFiles) => {
    const workspace = { project: nextProject, files: nextFiles };
    saveWorkspace(workspace);
  };

  const bootstrapLocalWorkspace = (message) => {
    const workspace = loadWorkspace() || createDefaultWorkspace();
    setMode('local');
    setBanner(message || 'Running in local mode. Changes are saved in your browser.');
    setProject(workspace.project);
    setFiles(workspace.files);
    const firstId = workspace.files[0]?.id || null;
    setActiveFileId(firstId);
    if (firstId) setOpenedFileIds([firstId]);
    const localUser = getOrCreateLocalUser();
    setPresenceStates([{ user: localUser, status: 'local', activeFile: firstId }]);
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = urlParams.get('token');
        if (tokenFromUrl) {
          window.localStorage.setItem('devcollab-token', tokenFromUrl);
          window.history.replaceState({}, document.title, window.location.pathname);
          setShowLanding(false);
        }

        const currentToken = window.localStorage.getItem('devcollab-token');
        if (!currentToken) {
          const authRes = await api.post('/auth/anonymous', {});
          if (authRes.data?.token) {
            window.localStorage.setItem('devcollab-token', authRes.data.token);
          }
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
        const firstId = nextFiles[0]?.id || null;
        setActiveFileId(firstId);
        if (firstId) setOpenedFileIds([firstId]);
        setBanner('');
        
        try {
          const profileRes = await api.get('/users/profile');
          setCurrentUser(profileRes.data);
        } catch (_e) {}

        await fetchGithubUser();

        const shareLink = urlParams.get('join');
        if (shareLink) {
          try {
            const { data } = await api.post('/sessions/join', { shareLink });
            setSessionData(data.session);
            setSessionUser(data.sessionUser);
          } catch (e) {}
        }
      } catch (err) {
        bootstrapLocalWorkspace('Backend unavailable. Switched to local mode.');
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
    if (!globalProvider?.socket) return undefined;
    const ioSocket = globalProvider.socket;
    const onOutput = (data) => setOutputLines((prev) => [...prev, data]);
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
      const nextFiles = files.map((f) => f.id === fileId ? { ...f, name: newName } : f);
      setFiles(nextFiles);
      persistLocalWorkspace(project, nextFiles);
      return;
    }
    await api.put(`/files/${fileId}`, { name: newName });
    await handleRefreshFiles();
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
      setGitStatus('GitHub integration is disabled in local mode.');
      return;
    }
    try {
      const { data } = await api.get('/github/auth');
      window.location.href = data.url;
    } catch (e) {
      setGitStatus('Failed to start GitHub auth');
    }
  };

  const handleGitInit = async () => {
    if (!project || isLocalMode) return;
    setLoadingGitInit(true);
    try {
      const res = await api.post(`/projects/${project.id}/github/init`, {});
      setGitStatus(`Repo ready: ${res.data.owner}/${res.data.repo}`);
    } catch (err) {
      setGitStatus(err?.response?.data?.message || 'GitHub init failed');
    } finally {
      setLoadingGitInit(false);
    }
  };

  const handleGitCommit = async () => {
    if (!project || isLocalMode) return;
    setLoadingGitCommit(true);
    try {
      const res = await api.post(`/projects/${project.id}/github/commit`, { branch: gitBranch, message: gitMessage });
      setGitStatus(`Committed ${res.data.commitSha.slice(0, 7)}`);
    } catch (err) {
      setGitStatus(err?.response?.data?.message || 'Commit failed');
    } finally {
      setLoadingGitCommit(false);
    }
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    window.localStorage.setItem('devcollab-theme', next);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    return registerShortcuts({
      'run-code': handleRunCode,
      'toggle-sidebar': () => setShowSidebar(p => !p),
      'toggle-theme': toggleTheme,
      'show-shortcuts': () => setShowShortcuts(p => !p),
      'command-palette': () => setShowCommandPalette(true)
    });
  });

  const paletteActions = [
    { id: 'run', label: 'Run Code', shortcut: 'Ctrl+R', run: () => handleRunCode() },
    { id: 'search', label: 'Search Files', shortcut: 'Ctrl+Shift+F', run: () => { setShowSidebar(true); setActiveSidebarTab('search'); } },
    { id: 'share', label: 'Share Project', run: () => setShowShare(true) },
    { id: 'theme', label: 'Toggle Dark/Light Mode', shortcut: 'Ctrl+Shift+T', run: toggleTheme },
    { id: 'settings', label: 'Open Settings', run: () => setShowSettings(true) },
    { id: 'sidebar', label: 'Toggle Sidebar', shortcut: 'Ctrl+B', run: () => setShowSidebar(p => !p) }
  ];

  const activeFile = useMemo(() => files.find((f) => f.id === activeFileId) || null, [files, activeFileId]);

  const handleRunCode = () => {
    if (isLocalMode) {
      setOutputLines([{ type: 'system', payload: 'Code execution requires the cloud runner.' }]);
      return;
    }
    if (!globalProvider?.socket || !activeFile) return;
    const ext = activeFile.name.split('.').pop().toLowerCase();
    const langMap = { py: 'python', js: 'javascript', ts: 'typescript', go: 'go', java: 'java' };
    const language = langMap[ext];
    if (!language) {
      setOutputLines([{ type: 'error', payload: 'Unsupported file type.' }]);
      return;
    }
    setOutputLines([]);
    setIsRunning(true);
    globalProvider.awareness.setLocalStateField('status', 'executing');
    globalProvider.socket.emit('execute-code', {
      code: window.getEditorCode?.() || activeFile.content || '',
      language,
      fileId: activeFileId
    });
  };

  const handleSelectFile = (id) => {
    if (!openedFileIds.includes(id)) setOpenedFileIds(prev => [...prev, id]);
    setActiveFileId(id);
  };

  const handleJumpToResult = (fileId, line) => {
    handleSelectFile(fileId);
    setTimeout(() => window.editorGoToLine?.(line), 200);
  };

  const handleCloseTab = (e, id) => {
    e.stopPropagation();
    const nextOpened = openedFileIds.filter(fId => fId !== id);
    setOpenedFileIds(nextOpened);
    if (activeFileId === id) setActiveFileId(nextOpened.length > 0 ? nextOpened[nextOpened.length - 1] : null);
  };

  if (showLanding) return <LandingPage onEnter={() => setShowLanding(false)} />;

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-header-left">
          <div className="app-title"><Box size={22} className="text-blue-500" /> DevCollab</div>
          <div className="app-subtitle">
            {project?.name || 'Loading...'}
            <span style={{ opacity: 0.3, margin: '0 8px' }}>|</span>
            {isLocalMode ? 'Local Node' : 'Cloud Cluster'}
          </div>
        </div>
        <div className="app-header-right" style={{ display: 'flex', gap: '0.5rem' }}>
          {collaborationEnabled && <MeetingPanel socket={globalProvider?.socket} roomId={project?.id} currentUser={sessionUser} />}
          <button onClick={() => setShowSidebar(!showSidebar)} className="morphic-button" title="Toggle Sidebar"><Menu size={18} /></button>
          <button onClick={() => setShowMetrics(true)} className="morphic-button" title="Metrics"><BarChart3 size={18} /></button>
          <button onClick={() => setShowSettings(true)} className="morphic-button" title="Settings"><Settings size={18} /></button>
          <button onClick={() => setShowShortcuts(true)} className="morphic-button" title="Shortcuts"><Keyboard size={18} /></button>
          <button onClick={() => setShowAssets(true)} className="morphic-button" title="Assets"><ImageIcon size={18} /></button>
          <button onClick={() => setShowShare(true)} className="morphic-button primary" title="Share"><Share2 size={16} /> Share</button>
          <button onClick={toggleTheme} className="theme-toggle">{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
          {githubUser ? (
            <img src={githubUser.avatarUrl} alt="Avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--accent)' }} />
          ) : (
            <button onClick={handleConnectGitHub} className="morphic-button"><Github size={16} /> Connect</button>
          )}
          <PresenceBar users={presenceStates} />
        </div>
      </header>
      
      {banner && <div className="banner-glass"><Zap size={14} style={{ marginRight: 8 }} /> {banner}</div>}
      
      <motion.div initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} className="app-body">
        {showSidebar && (
          <aside className="sidebar glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="sidebar-tabs">
              <button className={`sidebar-tab ${activeSidebarTab === 'explorer' ? 'active' : ''}`} onClick={() => setActiveSidebarTab('explorer')}>
                <Layout size={16} style={{ marginBottom: 4 }} /><div>FILES</div>
              </button>
              <button className={`sidebar-tab ${activeSidebarTab === 'search' ? 'active' : ''}`} onClick={() => setActiveSidebarTab('search')}>
                <BarChart3 size={16} style={{ marginBottom: 4 }} /><div>SEARCH</div>
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {activeSidebarTab === 'explorer' ? (
                <FileExplorer files={files} activeFileId={activeFileId} onSelectFile={handleSelectFile} onCreateFile={handleCreateFile} onDeleteFile={handleDeleteFile} onRenameFile={handleRenameFile} disabled={isInitializing} />
              ) : (
                <SearchPanel projectId={project?.id} onSelectResult={handleJumpToResult} />
              )}
            </div>
            <SessionPanel projectId={project?.id} />
          </aside>
        )}

        <main className="editor-main-container">
          <div className="git-panel-wrapper glass-panel" style={{ padding: '0.5rem' }}>
            <GitPanel disabled={!project} branch={gitBranch} setBranch={setGitBranch} message={gitMessage} setMessage={setGitMessage} status={gitStatus} onInit={handleGitInit} onCommit={handleGitCommit} loadingInit={loadingGitInit} loadingCommit={loadingGitCommit} loadingPR={loadingGitPR} onPR={() => {}} githubUser={githubUser} onConnect={handleConnectGitHub} />
          </div>
          
          <div className="editor-workspace" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {activeFileId && <Breadcrumbs projectName={project?.name} fileName={files.find(f => f.id === activeFileId)?.name} />}
            <div className="monaco-editor-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {activeFile ? (
                <CodeEditor file={activeFile} theme={theme === 'dark' ? 'vs-dark' : 'vs-light'} collaborationEnabled={collaborationEnabled} currentUser={currentUser} onChange={(content) => {
                  const nextFiles = files.map(f => f.id === activeFile.id ? { ...f, content } : f);
                  setFiles(nextFiles);
                  if (isLocalMode) persistLocalWorkspace(project, nextFiles);
                }} editorSettings={editorSettings} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dim)' }}>Select a file to begin.</div>
              )}
            </div>
            
            <div style={{ height: '30%', marginTop: '1rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.4rem 0.8rem', gap: '0.5rem' }}>
                <button onClick={handleRunCode} disabled={isRunning} className="morphic-button primary">{isRunning ? 'Running...' : 'Run'} <Play size={14} style={{ marginLeft: 6 }} /></button>
              </div>
              <div className="terminal-wrapper" style={{ flex: 1, background: '#0f172a', borderRadius: '12px' }}>
                <TerminalPanel socket={globalProvider?.socket} sessionId={project?.id} />
              </div>
            </div>
          </div>
        </main>
      </motion.div>

      <CopilotPanel disabled={!project} projectId={project?.id} fileId={activeFileId} />
      <CommandPalette isOpen={showCommandPalette} onClose={() => setShowCommandPalette(false)} actions={paletteActions} />
      
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} onSave={setEditorSettings} currentUser={currentUser} onProfileUpdate={setCurrentUser} />}
      {showShortcuts && <ShortcutsOverlay onClose={() => setShowShortcuts(false)} />}
      {showAssets && project && <AssetGallery projectId={project.id} onClose={() => setShowAssets(false)} />}
      {showShare && project && <ShareModal projectId={project.id} onClose={() => setShowShare(false)} />}
      
      <footer className="glass-panel" style={{ padding: '0.6rem', textAlign: 'center', fontSize: '0.8rem', borderTop: '1px solid var(--border-glass)', borderRadius: '0' }}>
        Built with ❤️ by Syed Mukheeth
      </footer>
    </div>
  );
}
