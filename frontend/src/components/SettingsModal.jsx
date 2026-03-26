import React, { useState, useEffect } from 'react';

const DEFAULTS = {
  fontSize: 14,
  tabSize: 2,
  wordWrap: 'on',
  minimap: false,
  fontFamily: 'JetBrains Mono, monospace',
  vimMode: false
};

export function SettingsModal({ onClose, onSave }) {
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

  return (
    <div className="playback-modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
      <div className="glass-panel" style={{ width: '480px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>⚙️ Settings</h3>
          <button className="morphic-button" onClick={onClose} style={{ borderRadius: '50%', width: '32px', height: '32px', justifyContent: 'center', fontSize: '1.2rem' }}>×</button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
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
        </div>

        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-glass)', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button className="morphic-button" onClick={handleReset} style={{ justifyContent: 'center' }}>Reset</button>
          <button className="morphic-button primary" onClick={handleSave} style={{ justifyContent: 'center' }}>Save</button>
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
