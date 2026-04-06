import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { 
  Settings, 
  User, 
  Cpu, 
  Keyboard, 
  Type, 
  WrapText, 
  Monitor, 
  RefreshCcw, 
  Check, 
  X, 
  Upload,
  Terminal,
  Save,
  Trash2,
  FileCode
} from 'lucide-react';

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
      const saved = localStorage.getItem('syncmesh-editor-settings');
      return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : { ...DEFAULTS };
    } catch {
      return { ...DEFAULTS };
    }
  });

  const update = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    localStorage.setItem('syncmesh-editor-settings', JSON.stringify(settings));
    onSave(settings);
    onClose();
  };

  const handleReset = () => {
    setSettings({ ...DEFAULTS });
    localStorage.removeItem('syncmesh-editor-settings');
  };

  const handleProfileSave = async () => {
    try {
      const res = await api.patch('/users/profile', profile);
      onProfileUpdate(res.data);
      // alert('Profile updated!'); 
    } catch (err) {
      console.error('Failed to update profile');
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
      console.error('Avatar upload failed');
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <div className="playback-modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999 }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-panel" 
        style={{ 
          width: '560px', 
          maxHeight: '85vh', 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden',
          background: 'rgba(15, 23, 42, 0.98)',
          borderRadius: '24px',
          boxShadow: '0 32px 128px rgba(0,0,0,0.8)',
          border: '1px solid var(--border-glass)'
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Settings size={20} className="text-blue-400" />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>System Settings</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '6px' }}>
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.2)' }}>
          {[
            { id: 'editor', icon: <FileCode size={16} />, label: 'Editor' },
            { id: 'profile', icon: <User size={16} />, label: 'Account' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{ 
                flex: 1, 
                padding: '14px', 
                border: 'none', 
                background: activeTab === tab.id ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                color: activeTab === tab.id ? 'var(--accent-neon)' : 'var(--text-dim)', 
                fontWeight: 700, 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '0.9rem',
                borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {activeTab === 'editor' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Font Size */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '12px', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>
                  <Type size={14} /> Font Size
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                  <input 
                    type="range" min="10" max="24" value={settings.fontSize} 
                    onChange={e => update('fontSize', Number(e.target.value))}
                    style={{ flex: 1, accentColor: 'var(--accent)' }}
                  />
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-neon)', minWidth: '40px', textAlign: 'right' }}>{settings.fontSize}px</span>
                </div>
              </div>

              {/* Tab Size */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '12px', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>
                  <Terminal size={14} /> Indentation
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {[2, 4, 8].map(n => (
                    <button 
                      key={n} 
                      onClick={() => update('tabSize', n)}
                      style={{ 
                        flex: 1, 
                        padding: '12px', 
                        borderRadius: '12px', 
                        border: '1px solid',
                        borderColor: settings.tabSize === n ? 'var(--accent)' : 'var(--border-glass)',
                        background: settings.tabSize === n ? 'rgba(59, 130, 246, 0.1)' : 'rgba(0,0,0,0.2)',
                        color: settings.tabSize === n ? 'white' : 'var(--text-dim)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {n} Spaces
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles Group */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div 
                  onClick={() => update('wordWrap', settings.wordWrap === 'on' ? 'off' : 'on')}
                  style={{ 
                    padding: '16px', 
                    borderRadius: '16px', 
                    background: 'rgba(0,0,0,0.2)', 
                    border: '1px solid var(--border-glass)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <WrapText size={18} className="text-dim" />
                    <div style={{ 
                      width: '32px', height: '18px', borderRadius: '10px', 
                      background: settings.wordWrap === 'on' ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                      position: 'relative'
                    }}>
                      <div style={{ 
                        position: 'absolute', top: '2px', left: settings.wordWrap === 'on' ? '16px' : '2px',
                        width: '14px', height: '14px', borderRadius: '50%', background: 'white', transition: 'all 0.2s'
                      }} />
                    </div>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white' }}>Word Wrap</div>
                </div>

                <div 
                  onClick={() => update('minimap', !settings.minimap)}
                  style={{ 
                    padding: '16px', 
                    borderRadius: '16px', 
                    background: 'rgba(0,0,0,0.2)', 
                    border: '1px solid var(--border-glass)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Monitor size={18} className="text-dim" />
                    <div style={{ 
                      width: '32px', height: '18px', borderRadius: '10px', 
                      background: settings.minimap ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                      position: 'relative'
                    }}>
                      <div style={{ 
                        position: 'absolute', top: '2px', left: settings.minimap ? '16px' : '2px',
                        width: '14px', height: '14px', borderRadius: '50%', background: 'white', transition: 'all 0.2s'
                      }} />
                    </div>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white' }}>Editor Minimap</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '20px', border: '1px solid var(--border-glass)' }}>
                <div style={{ position: 'relative', width: '90px', height: '90px', borderRadius: '24px', background: 'var(--bg-deep)', border: '2px solid var(--accent)', overflow: 'hidden' }}>
                  {currentUser?.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 900, color: 'var(--accent)' }}>
                      {(currentUser?.username || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  {avatarUploading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><RefreshCcw size={24} className="animate-spin text-white" /></div>}
                </div>
                <div style={{ flex: 1 }}>
                  <input type="file" id="avatar-upload" style={{ display: 'none' }} onChange={handleAvatarUpload} accept="image/*" />
                  <label htmlFor="avatar-upload" style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px',
                    background: 'var(--accent)', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 4px 12px var(--accent-glow)'
                  }}>
                    <Upload size={16} /> New Avatar
                  </label>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '10px' }}>Recommended: Square JPG or PNG, max 2MB.</p>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>Display Name</label>
                <input 
                  style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: '12px', color: 'white', outline: 'none', transition: 'all 0.2s' }}
                  value={profile.username}
                  onChange={e => setProfile(prev => ({ ...prev, username: e.target.value }))}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-glass)'}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>User Bio</label>
                <textarea 
                  style={{ width: '100%', minHeight: '100px', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: '12px', color: 'white', outline: 'none', resize: 'none', transition: 'all 0.2s' }}
                  value={profile.bio}
                  onChange={e => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-glass)'}
                />
              </div>
              
              <button 
                onClick={handleProfileSave}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'white', color: 'black', fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Check size={18} /> Update Profile
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border-glass)', display: 'flex', gap: '12px', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.2)' }}>
          {activeTab === 'editor' && (
            <button onClick={handleReset} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--text-dim)', fontWeight: 600, cursor: 'pointer', padding: '10px' }}>
              <Trash2 size={16} /> Reset
            </button>
          )}
          <button 
            onClick={activeTab === 'editor' ? handleSave : onClose}
            style={{ 
              padding: '10px 24px', borderRadius: '10px', background: 'var(--accent)', color: 'white', 
              fontWeight: 800, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px var(--accent-glow)',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <Save size={18} /> {activeTab === 'editor' ? 'Save Changes' : 'Close'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function ShortcutsOverlay({ onClose }) {
  const shortcuts = [
    { keys: 'Ctrl + Enter', label: 'Execute Code' },
    { keys: 'Ctrl + S', label: 'Save Changes' },
    { keys: 'Ctrl + B', label: 'Toggle Explorer' },
    { keys: 'Ctrl + J', label: 'Toggle Console' },
    { keys: 'Ctrl + Shift + P', label: 'Command Palette' },
    { keys: 'Ctrl + N', label: 'New Workspace File' },
    { keys: 'Ctrl + Shift + T', label: 'Switch Theme' },
  ];

  return (
    <div className="playback-modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999 }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ 
          width: '440px', 
          background: 'rgba(15, 23, 42, 0.98)', 
          borderRadius: '24px', 
          border: '1px solid var(--border-glass)',
          boxShadow: '0 32px 128px rgba(0,0,0,0.8)',
          overflow: 'hidden'
        }}
      >
        <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,191,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Keyboard size={20} className="text-amber-400" />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>Key Bindings</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '6px' }}>
            <X size={24} />
          </button>
        </div>
        <div style={{ padding: '16px 24px' }}>
          {shortcuts.map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < shortcuts.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 500 }}>{s.label}</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {s.keys.split(' + ').map((key, ki) => (
                  <kbd key={ki} style={{ 
                    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', 
                    borderRadius: '6px', padding: '4px 8px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', 
                    fontWeight: 800, color: 'var(--accent-neon)', boxShadow: '0 2px 0 rgba(0,0,0,0.3)'
                  }}>
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export { DEFAULTS as DEFAULT_EDITOR_SETTINGS };
