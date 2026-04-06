import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { 
  Users, 
  Mail, 
  Shield, 
  Trash2, 
  Check, 
  UserPlus, 
  X, 
  Loader2,
  Lock,
  Globe,
  Settings,
  RefreshCcw
} from 'lucide-react';

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
      console.error('Failed to invite user');
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (userId) => {
    try {
      await api.delete(`/projects/${projectId}/access/${userId}`);
      fetchAccessList();
    } catch (err) {
      console.error('Failed to remove user');
    }
  };

  return (
    <div className="playback-modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000000 }}>
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
      />

      {/* Modal Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        className="glass-panel" 
        style={{ 
          position: 'relative',
          width: '520px', 
          maxHeight: '85vh', 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden',
          background: 'rgba(15, 23, 42, 0.98)',
          borderRadius: '24px',
          boxShadow: '0 32px 128px rgba(0,0,0,0.9)',
          border: '1px solid var(--border-glass)'
        }}
      >
        {/* Header */}
        <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={22} className="text-blue-400" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>Collaborative Governance</h3>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>Project Permissions & Access</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '8px' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ padding: '24px', flex: 1, overflow: 'auto' }}>
          {/* Invite Form */}
          <form onSubmit={handleInvite} style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-dim)', opacity: 0.5 }} />
              <input
                type="email"
                style={{ 
                  width: '100%', 
                  padding: '12px 14px 12px 42px', 
                  background: 'rgba(0,0,0,0.2)', 
                  border: '1px solid var(--border-glass)', 
                  borderRadius: '12px', 
                  color: 'white',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
                placeholder="Collaborator's email address..."
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-glass)'}
              />
            </div>
            <select 
              value={role} 
              onChange={e => setRole(e.target.value)} 
              style={{ 
                width: '110px', 
                background: 'rgba(0,0,0,0.2)', 
                border: '1px solid var(--border-glass)', 
                borderRadius: '12px', 
                color: 'white',
                padding: '0 12px',
                cursor: 'pointer',
                outline: 'none',
                fontWeight: 600,
                fontSize: '0.85rem'
              }}
            >
              <option value="VIEWER">Viewer</option>
              <option value="EDITOR">Editor</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button 
              className="morphic-button primary" 
              type="submit" 
              disabled={inviting || !email.trim()}
              style={{ padding: '0 24px', borderRadius: '12px', height: '46px', boxShadow: '0 4px 12px var(--accent-glow)' }}
            >
              {inviting ? <RefreshCcw size={18} className="animate-spin" /> : <UserPlus size={18} />}
            </button>
          </form>

          {/* User List */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Shield size={14} className="text-blue-400" />
            <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 800, letterSpacing: '0.05em', margin: 0 }}>Verified Entities</h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {accessList.map((access, i) => (
              <motion.div 
                key={access.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '16px', 
                  padding: '14px', 
                  background: 'rgba(255,255,255,0.02)', 
                  borderRadius: '16px', 
                  border: '1px solid rgba(255,255,255,0.05)',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{ position: 'relative' }}>
                  <img 
                    src={access.user.avatarUrl || `https://ui-avatars.com/api/?name=${access.user.username}&background=random`} 
                    style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1px solid var(--border-glass)' }} 
                  />
                  <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '12px', height: '12px', borderRadius: '50%', background: '#10b981', border: '2px solid #0f172a' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'white' }}>{access.user.username}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {access.role === 'ADMIN' ? <Globe size={10} /> : <Lock size={10} />}
                    {access.role}
                  </div>
                </div>
                <button 
                  onClick={() => handleRemove(access.user.id)}
                  style={{ 
                    background: 'rgba(239, 68, 68, 0.1)', 
                    border: 'none', 
                    color: '#ef4444', 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '8px', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                  title="Remove Access"
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))}

            <AnimatePresence>
              {accessList.length === 0 && !loading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)', border: '1px dashed var(--border-glass)', borderRadius: '16px' }}
                >
                  <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.1 }} />
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Elite Isolation</div>
                  <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>No external collaborators have been granted access.</div>
                </motion.div>
              )}
            </AnimatePresence>

            {loading && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                <RefreshCcw size={24} className="animate-spin text-blue-400" />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Settings size={14} /> Unified Security Policy
          </div>
          <button 
            className="morphic-button primary" 
            onClick={onClose} 
            style={{ padding: '8px 24px', borderRadius: '10px', fontWeight: 800, height: '40px' }}
          >
            Finalize
          </button>
        </div>
      </motion.div>
    </div>
  );
}
