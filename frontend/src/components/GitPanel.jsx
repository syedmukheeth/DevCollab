import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Github, 
  GitBranch, 
  Send, 
  Terminal, 
  Check, 
  Plus, 
  GitPullRequest,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export function GitPanel({
  disabled,
  branch,
  setBranch,
  message,
  setMessage,
  status,
  onInit,
  onCommit,
  loadingInit,
  loadingCommit,
  loadingPR,
  onPR,
  githubUser,
  onConnect
}) {
  const isConnected = !!githubUser?.accessToken;

  return (
    <div className="git-panel" style={{ background: 'none', border: 'none', padding: '12px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
           <Github size={18} className="text-blue-400" /> Version Control 
        </div>
        <AnimatePresence>
          {isConnected && (
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ 
                fontSize: '0.7rem', 
                background: 'rgba(59, 130, 246, 0.15)', 
                color: 'var(--accent-neon)', 
                padding: '4px 10px', 
                borderRadius: '10px', 
                fontWeight: 700,
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}
            >
              @{githubUser.username}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {!isConnected ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid var(--border-glass)' }}
        >
          <Github size={32} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '16px', lineHeight: 1.5 }}>Connect GitHub to enable repository synchronization and PR management.</p>
          <button 
            className="morphic-button primary" 
            style={{ width: '100%', justifyContent: 'center', borderRadius: '12px' }} 
            onClick={onConnect}
          >
            Authenticate GitHub
          </button>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.65rem', color: 'var(--text-dim)', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 800 }}>
                <GitBranch size={12} /> Target Branch
              </label>
              <input
                className="git-input"
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  fontSize: '0.85rem', 
                  background: 'rgba(0,0,0,0.2)', 
                  border: '1px solid var(--border-glass)', 
                  borderRadius: '10px', 
                  color: 'white',
                  outline: 'none'
                }}
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                disabled={disabled}
                placeholder="main"
              />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.65rem', color: 'var(--text-dim)', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 800 }}>
                <Terminal size={12} /> Commit Text
              </label>
              <input
                className="git-input"
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  fontSize: '0.85rem', 
                  background: 'rgba(0,0,0,0.2)', 
                  border: '1px solid var(--border-glass)', 
                  borderRadius: '10px', 
                  color: 'white',
                  outline: 'none'
                }}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={disabled}
                placeholder="Initial commit"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
               className="morphic-button"
               style={{ flex: 1, justifyContent: 'center', borderRadius: '12px', height: '40px' }}
               onClick={onInit}
               disabled={disabled || loadingInit}
            >
              {loadingInit ? <RefreshCcw size={16} className="animate-spin" /> : 'Init Workspace'}
            </button>
            <button
               className="morphic-button primary"
               style={{ flex: 1, justifyContent: 'center', borderRadius: '12px', height: '40px', gap: '8px' }}
               onClick={onCommit}
               disabled={disabled || loadingCommit}
            >
              {loadingCommit ? <RefreshCcw size={16} className="animate-spin" /> : <><Send size={16} /> Sync Changes</>}
            </button>
          </div>

          <button
              className="morphic-button"
              style={{ 
                width: '100%', 
                height: '44px',
                justifyContent: 'center', 
                gap: '8px',
                borderColor: 'var(--accent)', 
                color: 'var(--accent-neon)', 
                borderRadius: '12px',
                background: 'rgba(59, 130, 246, 0.05)',
                fontWeight: 800
              }}
              onClick={onPR}
              disabled={disabled || loadingPR}
            >
              {loadingPR ? <RefreshCcw size={16} className="animate-spin" /> : <><GitPullRequest size={18} /> Propose Deployment</>}
          </button>
        </div>
      )}

      <AnimatePresence>
        {status && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ 
              marginTop: '16px', 
              padding: '12px',
              borderRadius: '10px',
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              fontSize: '0.75rem', 
              color: 'var(--accent-neon)', 
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              overflow: 'hidden'
            }}
          >
            <Check size={14} /> {status}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const RefreshCcw = ({ size, className }) => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
    className={className}
    style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
  >
    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85.83 6.72 2.24M21 3v9h-9" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </motion.div>
);
