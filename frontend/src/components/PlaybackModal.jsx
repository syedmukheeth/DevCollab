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
    <div className="playback-modal-overlay">
      <div className="playback-modal">
        <div className="playback-header">
          <h3>Playback: {filename}</h3>
          <button className="icon-button" onClick={onClose} style={{fontSize: '1.5rem'}}>×</button>
        </div>
        <div className="playback-body">
          {loading ? (
            <div className="empty-state">Loading history...</div>
          ) : (
            <Editor
              height="100%"
              defaultLanguage="javascript"
              theme="vs-dark"
              value={content}
              options={{ readOnly: true, minimap: { enabled: false } }}
            />
          )}
        </div>
        <div className="playback-controls">
          <input
            type="range"
            className="playback-slider"
            min={0}
            max={Math.max(0, updates.length - 1)}
            value={currentIndex}
            onChange={handleSliderChange}
            disabled={loading || updates.length === 0}
          />
          <div className="playback-info">
            <span>Step {currentIndex + 1} of {updates.length}</span>
            <span>{updates[currentIndex]?.createdAt ? new Date(updates[currentIndex].createdAt).toLocaleString() : ''}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
