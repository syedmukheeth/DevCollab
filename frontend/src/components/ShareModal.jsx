import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';

export function ShareModal({ projectId, onClose }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('VIEWER');
  const [accessList, setAccessList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchAccessList();
  }, [projectId]);

  const fetchAccessList = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/projects/${projectId}/access`);
      setAccessList(data);
    } catch (err) {
      console.error('Failed to fetch access list', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email.trim() || inviting) return;

    setInviting(true);
    try {
      await api.post(`/projects/${projectId}/access`, { userEmail: email, role });
      setEmail('');
      fetchAccessList();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to invite user');
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (userId) => {
    try {
      await api.delete(`/projects/${projectId}/access/${userId}`);
      fetchAccessList();
    } catch (err) {
      alert('Failed to remove user');
    }
  };

  return (
    <div className="playback-modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000 }}>
      <div className="glass-panel" style={{ width: '480px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>👥 Share Project</h3>
          <button className="morphic-button" onClick={onClose} style={{ borderRadius: '50%', width: '32px', height: '32px', justifyContent: 'center', fontSize: '1.2rem' }}>×</button>
        </div>

        <div style={{ padding: '1.5rem', flex: 1, overflow: 'auto' }}>
          <form onSubmit={handleInvite} style={{ display: 'flex', gap: '8px', marginBottom: '2rem' }}>
            <div style={{ flex: 1 }}>
              <input
                type="email"
                className="git-input"
                style={{ width: '100%' }}
                placeholder="User email or username"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <select 
              value={role} 
              onChange={e => setRole(e.target.value)} 
              className="git-input" 
              style={{ width: '100px', cursor: 'pointer' }}
            >
              <option value="VIEWER">Viewer</option>
              <option value="EDITOR">Editor</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button className="morphic-button primary" type="submit" disabled={inviting}>
              {inviting ? <span className="spinner" style={{ width: '14px', height: '14px' }} /> : 'Invite'}
            </button>
          </form>

          <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: 700 }}>Users with access</h4>
          {loading && <div style={{ textAlign: 'center', padding: '1rem' }}><span className="spinner" /></div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {accessList.map((access) => (
              <div key={access.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: 'var(--bg-panel)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                <img 
                  src={access.user.avatarUrl || `https://ui-avatars.com/api/?name=${access.user.username}&background=random`} 
                  style={{ width: '32px', height: '32px', borderRadius: '50%' }} 
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{access.user.username}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{access.role}</div>
                </div>
                <button 
                  onClick={() => handleRemove(access.user.id)}
                  style={{ background: 'none', border: 'none', color: '#ff4444', fontSize: '0.9rem', cursor: 'pointer', padding: '4px' }}
                >×</button>
              </div>
            ))}
            {accessList.length === 0 && !loading && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem', fontSize: '0.8rem' }}>No direct collaborators yet.</div>
            )}
          </div>
        </div>

        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="morphic-button" onClick={onClose} style={{ minWidth: '80px', justifyContent: 'center' }}>Done</button>
        </div>
      </div>
    </div>
  );
}
