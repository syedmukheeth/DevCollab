import React, { useState, useEffect } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { api } from '../lib/api';

export function DiffModal({ projectId, file, onClose }) {
  const [original, setOriginal] = useState('');
  const [modified, setModified] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch current content from our IDE (handled locally via window function or ref)
        const current = window.getEditorCode ? window.getEditorCode() : (file.content || '');
        setModified(current);

        // Fetch original from GitHub
        const { data } = await api.get(`/projects/${projectId}/github/diff?path=${file.name}`);
        setOriginal(data.originalContent);
      } catch (err) {
        console.error('Failed to fetch diff data', err);
        setOriginal('// Failed to fetch original content from GitHub. Maybe the file is new?');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId, file]);

  return (
    <div className="playback-modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel" style={{ width: '90%', height: '90%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Diff: {file.name}</h3>
          <button className="morphic-button" onClick={onClose} style={{ borderRadius: '50%', width: '32px', height: '32px', justifyContent: 'center', fontSize: '1.2rem' }}>×</button>
        </div>
        <div style={{ flex: 1, minHeight: 0, padding: '1rem' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>Calculating diff...</div>
          ) : (
            <div className="monaco-editor-wrapper" style={{ height: '100%' }}>
              <DiffEditor
                height="100%"
                original={original}
                modified={modified}
                language="javascript"
                theme={document.documentElement.getAttribute('data-theme') === 'light' ? 'vs-light' : 'vs-dark'}
                options={{ readOnly: true, minimap: { enabled: false }, scrollBeyondLastLine: false }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
