import React, { useState, useEffect, useRef } from 'react';

export function CommandPalette({ isOpen, onClose, actions }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const filteredActions = actions.filter(action => 
    action.label.toLowerCase().includes(query.toLowerCase()) ||
    action.id.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredActions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredActions.length) % filteredActions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredActions[selectedIndex]) {
        filteredActions[selectedIndex].run();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="command-palette-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
        display: 'flex', justifyContent: 'center', paddingTop: '15vh',
        zIndex: 200000,
        animation: 'paletteFadeIn 0.2s ease-out'
      }}
    >
      <style>{`
        @keyframes paletteFadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div 
        className="glass-panel"
        onClick={e => e.stopPropagation()}
        style={{
          width: '640px', maxHeight: '450px', display: 'flex', flexDirection: 'column',
          boxShadow: '0 30px 90px rgba(0,0,0,0.7)', border: '1px solid var(--border-glass)',
          background: 'rgba(20, 20, 25, 0.95)', borderRadius: '12px', overflow: 'hidden'
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ opacity: 0.5, fontSize: '1.2rem' }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            className="git-input"
            style={{ width: '100%', fontSize: '1.2rem', padding: '10px 0', background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none' }}
            placeholder="Search commands (e.g. 'Run', 'Share', 'Theme')..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {filteredActions.map((action, i) => (
            <div
              key={action.id}
              onClick={() => { action.run(); onClose(); }}
              onMouseEnter={() => setSelectedIndex(i)}
              style={{
                padding: '12px 16px', cursor: 'pointer', borderRadius: '8px',
                background: i === selectedIndex ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: i === selectedIndex ? 'var(--accent)' : 'var(--text-primary)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                transition: 'all 0.1s ease', transform: i === selectedIndex ? 'translateX(4px)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.1rem', filter: i === selectedIndex ? 'none' : 'grayscale(1)' }}>
                  {action.id === 'run' ? '▶️' : action.id === 'share' ? '🔗' : '⚙️'}
                </span>
                <span style={{ fontWeight: i === selectedIndex ? 700 : 500 }}>{action.label}</span>
              </div>
              {action.shortcut && (
                <div style={{ 
                  fontSize: '0.7rem', opacity: 0.8, background: 'rgba(255,255,255,0.05)', 
                  padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)',
                  fontFamily: 'monospace', color: 'var(--text-muted)'
                }}>
                  {action.shortcut}
                </div>
              )}
            </div>
          ))}
          {filteredActions.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '2rem' }}>🤔</div>
              <div>No commands matching "{query}"</div>
            </div>
          )}
        </div>
        <div style={{ padding: '10px 20px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--border-glass)', display: 'flex', gap: '20px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          <span><kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: '3px' }}>↑↓</kbd> to navigate</span>
          <span><kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: '3px' }}>Enter</kbd> to select</span>
          <span><kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: '3px' }}>Esc</kbd> to dismiss</span>
        </div>
      </div>
    </div>
  );
}
