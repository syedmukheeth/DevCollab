import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import Markdown from 'react-markdown';
import { 
  Bot, 
  Sparkles, 
  X, 
  Send, 
  MessageSquare, 
  Zap, 
  Maximize2, 
  Minimize2,
  AlertCircle,
  Terminal
} from 'lucide-react';

export function CopilotPanel({ disabled, projectId, fileId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading || disabled) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const codeContext = typeof window.getEditorCode === 'function' ? window.getEditorCode() : '';
      let selection = '';
      let language = 'plaintext';
      
      if (window.monaco && window.monaco.editor.getModels().length > 0) {
        const editors = window.monaco.editor.getEditors();
        if (editors.length > 0) {
          const editor = editors[0];
          const model = editor.getModel();
          language = model.getLanguageId();
          const sel = editor.getSelection();
          if (sel && !sel.isEmpty()) {
            selection = model.getValueInRange(sel);
          }
        }
      }

      const res = await api.post('/ai/chat', { 
        message: userMsg.content, 
        codeContext, 
        language, 
        selection,
        projectId,
        fileId
      });
      setMessages(prev => [...prev, { role: 'ai', content: res.data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'error', content: 'Neural link interrupted. Please check your configuration.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button 
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 20 }}
            whileHover={{ scale: 1.1, translateY: -4 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            style={{
              position: 'fixed',
              bottom: '30px',
              right: '30px',
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'var(--accent)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 12px 40px var(--accent-glow)',
              zIndex: 1000,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Sparkles size={28} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              width: isMaximized ? '600px' : '400px',
              height: isMaximized ? '80vh' : '550px'
            }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="glass-panel"
            style={{
              position: 'fixed',
              bottom: '30px',
              right: '30px',
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid var(--border-glass)',
              borderRadius: '24px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
              zIndex: 100000,
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{ 
              padding: '16px 20px', 
              borderBottom: '1px solid var(--border-glass)', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              background: 'rgba(255,255,255,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '10px', 
                  background: 'rgba(59, 130, 246, 0.1)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <Zap size={18} className="text-blue-400" />
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'white' }}>SyncMesh Copilot</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>GPT-4o Intelligence</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => setIsMaximized(!isMaximized)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px' }}
                >
                  {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {messages.length === 0 && (
                <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '40px 20px' }}>
                  <Bot size={48} style={{ margin: '0 auto 16px', opacity: 0.1 }} />
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>Hello! How can I help with your code today?</div>
                  <div style={{ fontSize: '0.8rem', marginTop: '8px' }}>Ask me to explain logic, find bugs, or refactor functions.</div>
                </div>
              )}
              
              {messages.map((m, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: m.role === 'user' ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i} 
                  style={{
                    alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: i === 0 && m.role === 'ai' && isMaximized ? '95%' : '85%',
                    backgroundColor: m.role === 'user' ? 'var(--accent)' : m.role === 'error' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255,255,255,0.03)',
                    color: m.role === 'user' ? 'white' : m.role === 'error' ? '#ef4444' : 'var(--text-main)',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    borderBottomRightRadius: m.role === 'user' ? '4px' : '16px',
                    borderBottomLeftRadius: m.role !== 'user' ? '4px' : '16px',
                    fontSize: '0.9rem',
                    lineHeight: 1.6,
                    border: m.role === 'error' ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(255,255,255,0.05)',
                    position: 'relative'
                  }}
                >
                  {m.role === 'error' && <AlertCircle size={14} style={{ marginBottom: 4 }} />}
                  <Markdown components={{
                    code({node, inline, className, children, ...props}) {
                      return !inline ? (
                        <div style={{ 
                          background: '#0f172a', 
                          padding: '12px', 
                          borderRadius: '8px', 
                          marginTop: '8px', 
                          marginBottom: '8px', 
                          overflowX: 'auto', 
                          fontSize: '0.8rem',
                          border: '1px solid rgba(255,255,255,0.05)',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          <code className={className} {...props}>{children}</code>
                        </div>
                      ) : (
                        <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 4px', borderRadius: '4px', fontSize: '0.85rem' }} {...props}>{children}</code>
                      )
                    }
                  }}>{m.content}</Markdown>
                </motion.div>
              ))}
              
              {loading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ alignSelf: 'flex-start', display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-dim)', fontSize: '0.8rem' }}
                >
                  <Loader2 size={14} className="animate-spin" /> Thinking...
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} style={{ padding: '20px', borderTop: '1px solid var(--border-glass)', display: 'flex', gap: '12px', background: 'rgba(0,0,0,0.2)' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input 
                  type="text" 
                  value={input} 
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask a question..." 
                  disabled={disabled || loading}
                  style={{ 
                    width: '100%', 
                    background: 'rgba(255,255,255,0.03)', 
                    border: '1px solid var(--border-glass)', 
                    color: 'white', 
                    padding: '12px 14px', 
                    borderRadius: '12px',
                    outline: 'none',
                    fontSize: '0.9rem',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-glass)'}
                />
              </div>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit" 
                disabled={!input.trim() || disabled || loading}
                style={{ 
                  width: '44px', 
                  height: '44px', 
                  background: 'var(--accent)', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '12px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px var(--accent-glow)'
                }}
              >
                <Send size={18} />
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const Loader2 = ({ size, className }) => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
    className={className}
    style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
  >
    <Zap size={size} />
  </motion.div>
);
