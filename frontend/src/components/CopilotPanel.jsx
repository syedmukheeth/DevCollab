import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import Markdown from 'react-markdown';

export function CopilotPanel({ disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading || disabled) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Gather context
      const codeContext = typeof window.getEditorCode === 'function' ? window.getEditorCode() : '';
      let selection = '';
      let language = 'plaintext';
      
      // Attempt to extract the current selection
      if (window.monaco && window.monaco.editor.getModels().length > 0) {
        const editor = window.monaco.editor.getEditors()[0];
        if (editor) {
          const model = editor.getModel();
          language = model.getLanguageId();
          const sel = editor.getSelection();
          if (sel && !sel.isEmpty()) {
            selection = model.getValueInRange(sel);
          }
        }
      }

      const res = await api.post('/ai/chat', { message: userMsg.content, codeContext, language, selection });
      setMessages(prev => [...prev, { role: 'ai', content: res.data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'error', content: 'Connection failed. Ensure your backend has OPENAI_API_KEY set.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="morphic-button"
        title="AI Copilot"
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          padding: '12px',
          borderRadius: '50%',
          width: '56px',
          height: '56px',
          fontSize: '24px',
          boxShadow: '0 8px 32px var(--shadow-color)',
          zIndex: 1000
        }}
      >
        ✨
      </button>
    );
  }

  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      right: '20px',
      width: '380px',
      height: '500px',
      backgroundColor: 'var(--bg-glass)',
      backdropFilter: 'blur(16px)',
      border: '1px solid var(--border-glass)',
      borderRadius: '12px',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 16px 48px rgba(0,0,0,0.3)',
      zIndex: 1000,
      overflow: 'hidden'
    }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
          <span>✨</span> AI Copilot
        </div>
        <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '18px' }}>×</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.length === 0 && (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '14px', marginTop: '20px' }}>
            <p>I'm your AI pair programmer.</p>
            <p>Select some code and ask me to explain it, or tell me to rewrite a function!</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            backgroundColor: m.role === 'user' ? 'var(--accent)' : m.role === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)',
            color: m.role === 'user' ? '#fff' : m.role === 'error' ? '#ef4444' : 'var(--text-primary)',
            padding: '8px 12px',
            borderRadius: '12px',
            borderBottomRightRadius: m.role === 'user' ? '4px' : '12px',
            borderBottomLeftRadius: m.role !== 'user' ? '4px' : '12px',
            maxWidth: '85%',
            fontSize: '14px',
            lineHeight: 1.5
          }}>
            {m.role === 'user' ? (
              <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
            ) : (
              <Markdown components={{
                code({node, inline, className, children, ...props}) {
                  return !inline ? (
                    <div style={{ background: 'rgba(0,0,0,0.4)', padding: '8px', borderRadius: '4px', marginTop: '8px', marginBottom: '8px', overflowX: 'auto', fontSize: '12px' }}>
                      <code className={className} {...props}>{children}</code>
                    </div>
                  ) : (
                    <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: '4px', fontSize: '12px' }} {...props}>{children}</code>
                  )
                }
              }}>{m.content}</Markdown>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', color: 'var(--text-secondary)', fontSize: '12px' }}>
            Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '12px', borderTop: '1px solid var(--border-glass)', display: 'flex', gap: '8px' }}>
        <input 
          type="text" 
          value={input} 
          onChange={e => setInput(e.target.value)}
          placeholder="Ask Copilot..." 
          disabled={disabled || loading}
          style={{ 
            flex: 1, 
            background: 'rgba(255,255,255,0.05)', 
            border: '1px solid var(--border-glass)', 
            color: 'var(--text-primary)', 
            padding: '8px 12px', 
            borderRadius: '20px',
            outline: 'none'
          }}
        />
        <button 
          type="submit" 
          disabled={!input.trim() || disabled || loading}
          className="morphic-button primary" 
          style={{ width: '36px', height: '36px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
        >
          ↑
        </button>
      </form>
    </div>
  );
}
