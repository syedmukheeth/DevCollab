import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';

export function SessionPanel({ projectId }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // NOTE: Simple mock implementation for UI demonstration if real sockets are not broadcasting sessions
  // Ideally this fetches from /api/projects/:projectId/sessions
  useEffect(() => {
    // mock fetch
    const fetchAuth = async () => {
      try {
        const res = await api.get(`/projects/${projectId}`);
        // For simplicity, we just list it in a glass panel
        setSessions([{ id: 'mock-123', shareLink: '1234-abcd', createdAt: new Date().toISOString() }]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (projectId) fetchAuth();
  }, [projectId]);

  if (!projectId) return null;

  return (
    <div className="session-panel" style={{ padding: '1rem', borderTop: '1px solid var(--border-glass)' }}>
      <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Active Sessions</h3>
      {loading ? (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Loading...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
          {sessions.map(s => (
            <div key={s.id} style={{ background: 'var(--bg-main)', padding: '8px', borderRadius: '4px', fontSize: '0.85rem' }}>
              <div>Session: {s.id.slice(0, 8)}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Link: {s.shareLink}</div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}?join=${s.shareLink}`);
                  alert('Invite link copied!');
                }}
                className="morphic-button"
                style={{ fontSize: '0.7rem', padding: '2px 6px', marginTop: '4px' }}
              >
                Copy Invite
              </button>
            </div>
          ))}
          <button className="morphic-button primary" style={{ fontSize: '0.8rem', padding: '4px 8px' }}>
            + New Collaboration Session
          </button>
        </div>
      )}
    </div>
  );
}

