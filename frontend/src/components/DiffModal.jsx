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
    <div className="playback-modal-overlay">
      <div className="playback-modal" style={{width: '95%', height: '95%'}}>
        <div className="playback-header">
          <h3>Diff: {file.name} (GitHub vs Local)</h3>
          <button className="icon-button" onClick={onClose} style={{fontSize: '1.5rem'}}>×</button>
        </div>
        <div className="playback-body">
          {loading ? (
            <div className="empty-state">Calculating diff...</div>
          ) : (
            <DiffEditor
              height="100%"
              original={original}
              modified={modified}
              language="javascript"
              theme="vs-dark"
              options={{ readOnly: true, minimap: { enabled: false } }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
