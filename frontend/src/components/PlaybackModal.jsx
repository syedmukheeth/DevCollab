import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { api } from '../lib/api';

export function PlaybackModal({ room, filename, onClose }) {
  const [updates, setUpdates] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const { data } = await api.get(`/sessions/replay/${room}`);
        // data is array of { createdAt, update: base64 }
        setUpdates(data);
        setLoading(false);
        if (data.length > 0) {
          recalculateContent(data, data.length - 1);
          setCurrentIndex(data.length - 1);
        }
      } catch (err) {
        console.error('Failed to fetch playback updates', err);
        setLoading(false);
      }
    };
    fetchUpdates();
  }, [room]);

  const recalculateContent = (allUpdates, index) => {
    const ydoc = new Y.Doc();
    for (let i = 0; i <= index; i++) {
      const updateUint8 = new Uint8Array(atob(allUpdates[i].update).split('').map(c => c.charCodeAt(0)));
      Y.applyUpdate(ydoc, updateUint8);
    }
    setContent(ydoc.getText('monaco').toString());
  };

  const handleSliderChange = (e) => {
    const idx = parseInt(e.target.value);
    setCurrentIndex(idx);
    recalculateContent(updates, idx);
  };

  return (
    <div className="playback-modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel" style={{ width: '80%', height: '85%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Playback: {filename}</h3>
          <button className="morphic-button" onClick={onClose} style={{ borderRadius: '50%', width: '32px', height: '32px', justifyContent: 'center', fontSize: '1.2rem' }}>×</button>
        </div>
        <div style={{ flex: 1, minHeight: 0, padding: '1rem' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>Loading history...</div>
          ) : (
            <div className="monaco-editor-wrapper" style={{ height: '100%' }}>
              <Editor
                height="100%"
                defaultLanguage="javascript"
                theme={document.documentElement.getAttribute('data-theme') === 'light' ? 'vs-light' : 'vs-dark'}
                value={content}
                options={{ readOnly: true, minimap: { enabled: false }, scrollBeyondLastLine: false }}
              />
            </div>
          )}
        </div>
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-glass)', background: 'var(--border-dim)' }}>
          <input
            type="range"
            style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
            min={0}
            max={Math.max(0, updates.length - 1)}
            value={currentIndex}
            onChange={handleSliderChange}
            disabled={loading || updates.length === 0}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            <span>Step {currentIndex + 1} of {updates.length}</span>
            <span>{updates[currentIndex]?.createdAt ? new Date(updates[currentIndex].createdAt).toLocaleString() : ''}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
