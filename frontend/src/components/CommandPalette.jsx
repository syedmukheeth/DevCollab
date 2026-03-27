import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Play, 
  Share2, 
  Settings, 
  HelpCircle, 
  Monitor, 
  Moon, 
  Sun,
  Layout,
  PlusCircle,
  Command,
  ArrowRight
} from 'lucide-react';

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
      setTimeout(() => inputRef.current?.focus(), 100);
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

  const getActionIcon = (id) => {
    switch(id) {
      case 'run': return <Play size={18} className="text-emerald-400" />;
      case 'share': return <Share2 size={18} className="text-blue-400" />;
      case 'settings': return <Settings size={18} className="text-slate-400" />;
      case 'shortcuts': return <HelpCircle size={18} className="text-amber-400" />;
      case 'theme': return <Moon size={18} className="text-purple-400" />;
      case 'search': return <Search size={18} className="text-blue-400" />;
      case 'files': return <Layout size={18} className="text-indigo-400" />;
      case 'new-file': return <PlusCircle size={18} className="text-emerald-400" />;
      default: return <Command size={18} className="text-slate-500" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999999, display: 'flex', justifyContent: 'center' }}>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          />

          {/* Palette Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '640px',
              height: 'fit-content',
              marginTop: '15vh',
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid var(--border-glass)',
              borderRadius: '16px',
              boxShadow: '0 32px 128px rgba(0,0,0,0.8)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Search Input Area */}
            <div style={{ 
              padding: '20px', 
              borderBottom: '1px solid var(--border-glass)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px',
              background: 'rgba(255,255,255,0.02)' 
            }}>
              <Search size={22} className="text-dim" style={{ opacity: 0.5 }} />
              <input
                ref={inputRef}
                type="text"
                style={{
                  width: '100%',
                  fontSize: '1.25rem',
                  fontWeight: 500,
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  outline: 'none',
                  fontFamily: 'var(--font-sans)'
                }}
                placeholder="Type a command..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            {/* Actions List */}
            <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '10px' }}>
              {filteredActions.map((action, i) => {
                const isSelected = i === selectedIndex;
                return (
                  <motion.div
                    key={action.id}
                    onMouseEnter={() => setSelectedIndex(i)}
                    onClick={() => { action.run(); onClose(); }}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                      border: '1px solid',
                      borderColor: isSelected ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'background 0.2s, border-color 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '10px', 
                        background: 'rgba(255,255,255,0.03)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        border: '1px solid var(--border-glass)'
                      }}>
                        {getActionIcon(action.id)}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: isSelected ? 'white' : 'var(--text-main)' }}>{action.label}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Quick access to {action.label.toLowerCase()}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {action.shortcut && (
                          <div style={{ 
                            fontSize: '0.65rem', 
                            padding: '4px 8px', 
                            background: 'rgba(255,255,255,0.05)', 
                            borderRadius: '4px',
                            border: '1px solid var(--border-glass)',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--text-muted)'
                          }}>{action.shortcut}</div>
                        )}
                        <ArrowRight size={14} className="text-blue-400" />
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {filteredActions.length === 0 && (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-dim)' }}>
                  <Search size={48} style={{ margin: '0 auto 16px', opacity: 0.1 }} />
                  <div style={{ fontSize: '1rem', fontWeight: 600 }}>No commands found</div>
                  <div style={{ fontSize: '0.85rem' }}>Try searching for something else</div>
                </div>
              )}
            </div>

            {/* Footer Hints */}
            <div style={{ 
              padding: '12px 20px', 
              background: 'rgba(0,0,0,0.3)', 
              borderTop: '1px solid var(--border-glass)', 
              display: 'flex', 
              gap: '24px',
              fontSize: '0.7rem',
              color: 'var(--text-dim)',
              fontWeight: 800
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <kbd style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-glass)' }}>ENTER</kbd> SELECT
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <kbd style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-glass)' }}>↑↓</kbd> NAVIGATE
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <kbd style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-glass)' }}>ESC</kbd> DISMISS
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
