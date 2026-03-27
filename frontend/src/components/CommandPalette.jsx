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
        backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        display: 'flex', justifyContent: 'center', paddingTop: '15vh',
        zIndex: 200000
      }}
    >
      <div 
        className="glass-panel"
        onClick={e => e.stopPropagation()}
        style={{
          width: '600px', maxHeight: '400px', display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)', border: '1px solid var(--border-glass)'
        }}
      >
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-glass)' }}>
          <input
            ref={inputRef}
            type="text"
            className="git-input"
            style={{ width: '100%', fontSize: '1.1rem', padding: '8px' }}
            placeholder="Type a command or search action..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredActions.map((action, i) => (
            <div
              key={action.id}
              onClick={() => { action.run(); onClose(); }}
              onMouseEnter={() => setSelectedIndex(i)}
              style={{
                padding: '12px 16px', cursor: 'pointer',
                background: i === selectedIndex ? 'var(--accent)' : 'transparent',
                color: i === selectedIndex ? '#fff' : 'var(--text-primary)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}
            >
              <div style={{ fontWeight: 600 }}>{action.label}</div>
              {action.shortcut && (
                <div style={{ fontSize: '0.75rem', opacity: 0.7, background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px' }}>
                  {action.shortcut}
                </div>
              )}
            </div>
          ))}
          {filteredActions.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No commands matching "{query}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
