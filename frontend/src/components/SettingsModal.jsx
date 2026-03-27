import React, { useState } from 'react';
import { api } from '../lib/api';

const DEFAULTS = {
  fontSize: 14,
  tabSize: 2,
  wordWrap: 'on',
  minimap: false,
  fontFamily: 'JetBrains Mono, monospace',
  vimMode: false
};

export function SettingsModal({ onClose, onSave, currentUser, onProfileUpdate }) {
  const [activeTab, setActiveTab] = useState('editor');
  const [profile, setProfile] = useState({
    username: currentUser?.username || '',
    bio: currentUser?.bio || ''
  });
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('devcollab-editor-settings');
      return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : { ...DEFAULTS };
    } catch {
      return { ...DEFAULTS };
    }
  });

  const update = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    localStorage.setItem('devcollab-editor-settings', JSON.stringify(settings));
    onSave(settings);
    onClose();
  };

  const handleReset = () => {
    setSettings({ ...DEFAULTS });
    localStorage.removeItem('devcollab-editor-settings');
  };

  const handleProfileSave = async () => {
    try {
      const res = await api.patch('/users/profile', profile);
      onProfileUpdate(res.data);
      alert('Profile updated successfully!');
    } catch (err) {
      alert('Failed to update profile');
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatarUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onProfileUpdate({ ...currentUser, avatarUrl: res.data.avatarUrl });
    } catch (err) {
      alert('Avatar upload failed');
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <div className="playback-modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
      <div className="glass-panel" style={{ width: '480px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>⚙️ Settings</h3>
          <button className="morphic-button" onClick={onClose} style={{ borderRadius: '50%', width: '32px', height: '32px', justifyContent: 'center', fontSize: '1.2rem' }}>×</button>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-glass)', background: 'var(--bg-panel)' }}>
          <button 
            onClick={() => setActiveTab('editor')}
            style={{ 
              flex: 1, padding: '12px', border: 'none', background: activeTab === 'editor' ? 'transparent' : 'rgba(0,0,0,0.1)',
              color: activeTab === 'editor' ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 700, cursor: 'pointer',
              borderBottom: activeTab === 'editor' ? '2px solid var(--accent)' : 'none'
            }}
          >Editor</button>
          <button 
            onClick={() => setActiveTab('profile')}
            style={{ 
              flex: 1, padding: '12px', border: 'none', background: activeTab === 'profile' ? 'transparent' : 'rgba(0,0,0,0.1)',
              color: activeTab === 'profile' ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 700, cursor: 'pointer',
              borderBottom: activeTab === 'profile' ? '2px solid var(--accent)' : 'none'
            }}
          >Profile</button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
          {activeTab === 'editor' ? (
            <>
              {/* Font Size */}
              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 700 }}>Font Size</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input 
                    type="range" min="10" max="24" value={settings.fontSize} 
                    onChange={e => update('fontSize', Number(e.target.value))}
                    style={{ flex: 1, accentColor: 'var(--accent)' }}
                  />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, minWidth: '30px' }}>{settings.fontSize}px</span>
                </div>
              </div>

              {/* Tab Size */}
              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 700 }}>Tab Size</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[2, 4, 8].map(n => (
                    <button key={n} className={`morphic-button ${settings.tabSize === n ? 'primary' : ''}`}
                      onClick={() => update('tabSize', n)}
                      style={{ flex: 1, justifyContent: 'center' }}
                    >{n} spaces</button>
                  ))}
                </div>
              </div>

              {/* Word Wrap */}
              <div style={{ marginBottom: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Word Wrap</label>
                <button 
                  className={`morphic-button ${settings.wordWrap === 'on' ? 'primary' : ''}`}
                  onClick={() => update('wordWrap', settings.wordWrap === 'on' ? 'off' : 'on')}
                  style={{ minWidth: '60px', justifyContent: 'center' }}
                >{settings.wordWrap === 'on' ? 'ON' : 'OFF'}</button>
              </div>

              {/* Minimap */}
              <div style={{ marginBottom: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Minimap</label>
                <button 
                  className={`morphic-button ${settings.minimap ? 'primary' : ''}`}
                  onClick={() => update('minimap', !settings.minimap)}
                  style={{ minWidth: '60px', justifyContent: 'center' }}
                >{settings.minimap ? 'ON' : 'OFF'}</button>
              </div>

              {/* Font Family */}
              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 700 }}>Font</label>
                <select 
                  value={settings.fontFamily}
                  onChange={e => update('fontFamily', e.target.value)}
                  className="git-input"
                  style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem', background: 'var(--bg-main)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: 'var(--text-main)' }}
                >
                  <option value="JetBrains Mono, monospace">JetBrains Mono</option>
                  <option value="Fira Code, monospace">Fira Code</option>
                  <option value="Cascadia Code, monospace">Cascadia Code</option>
                  <option value="Source Code Pro, monospace">Source Code Pro</option>
                  <option value="monospace">System Monospace</option>
                </select>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-main)', border: '2px solid var(--border-glass)', overflow: 'hidden' }}>
                  {currentUser?.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 900, color: 'var(--text-muted)' }}>
                      {(currentUser?.username || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  {avatarUploading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="spinner" /></div>}
                </div>
                <div style={{ flex: 1 }}>
                  <input 
                    type="file" 
                    id="avatar-upload" 
                    style={{ display: 'none' }} 
                    onChange={handleAvatarUpload}
                    accept="image/*"
                  />
                  <label htmlFor="avatar-upload" className="morphic-button" style={{ display: 'inline-flex', cursor: 'pointer' }}>
                    Change Avatar
                  </label>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '8px' }}>JPG, PNG or GIF. Max 2MB.</p>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 700 }}>Username</label>
                <input 
                  className="git-input" 
                  value={profile.username}
                  onChange={e => setProfile(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Your unique handle"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 700 }}>Bio</label>
                <textarea 
                  className="git-input" 
                  value={profile.bio}
                  onChange={e => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself..."
                  style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
                />
              </div>
              
              <button className="morphic-button primary" onClick={handleProfileSave} style={{ justifyContent: 'center' }}>Update Profile</button>
            </div>
          )}
        </div>

        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-glass)', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          {activeTab === 'editor' && <button className="morphic-button" onClick={handleReset} style={{ justifyContent: 'center' }}>Reset</button>}
          <button className="morphic-button primary" onClick={activeTab === 'editor' ? handleSave : onClose} style={{ justifyContent: 'center' }}>
            {activeTab === 'editor' ? 'Save Settings' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ShortcutsOverlay({ onClose }) {
  const shortcuts = [
    { keys: 'Ctrl + Enter', label: 'Run Code' },
    { keys: 'Ctrl + S', label: 'Save File' },
    { keys: 'Ctrl + B', label: 'Toggle Sidebar' },
    { keys: 'Ctrl + J', label: 'Toggle Terminal' },
    { keys: 'Ctrl + Shift + T', label: 'Toggle Theme' },
    { keys: 'Ctrl + N', label: 'New File' },
    { keys: 'Ctrl + Shift + ?', label: 'Show Shortcuts' },
  ];

  return (
    <div className="playback-modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
      <div className="glass-panel" style={{ width: '400px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>⌨️ Keyboard Shortcuts</h3>
          <button className="morphic-button" onClick={onClose} style={{ borderRadius: '50%', width: '32px', height: '32px', justifyContent: 'center', fontSize: '1.2rem' }}>×</button>
        </div>
        <div style={{ padding: '1rem 1.5rem' }}>
          {shortcuts.map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: i < shortcuts.length - 1 ? '1px solid var(--border-dim)' : 'none' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{s.label}</span>
              <kbd style={{ background: 'var(--bg-main)', border: '1px solid var(--border-glass)', borderRadius: '4px', padding: '2px 8px', fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-muted)' }}>{s.keys}</kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { DEFAULTS as DEFAULT_EDITOR_SETTINGS };
