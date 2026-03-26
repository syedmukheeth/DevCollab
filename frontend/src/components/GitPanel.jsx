import React from 'react';

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
    <div className="git-panel" style={{ background: 'none', border: 'none', padding: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
        <div style={{ fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
           <span style={{ opacity: 0.8 }}>🐙</span> GitHub 
        </div>
        {isConnected && (
            <div style={{ fontSize: '0.75rem', background: 'var(--accent)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
              @{githubUser.username}
            </div>
        )}
      </div>
      
      {!isConnected ? (
        <div style={{ textAlign: 'center', padding: '0.5rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>Connect GitHub to persist your code.</p>
          <button className="morphic-button primary" style={{ width: '100%', justifyContent: 'center' }} onClick={onConnect}>Connect Account</button>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '0.5rem', marginBottom: '0.8rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 700 }}>Branch</label>
              <input
                className="git-input"
                style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', background: 'var(--bg-main)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: 'var(--text-main)' }}
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                disabled={disabled}
                placeholder="main"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 700 }}>Commit Msg</label>
              <input
                className="git-input"
                style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', background: 'var(--bg-main)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: 'var(--text-main)' }}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={disabled}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
               className="morphic-button"
               style={{ flex: 1, justifyContent: 'center' }}
               onClick={onInit}
               disabled={disabled || loadingInit}
            >
              {loadingInit ? '...' : 'Init Repo'}
            </button>
            <button
               className="morphic-button primary"
               style={{ flex: 1.5, justifyContent: 'center' }}
               onClick={onCommit}
               disabled={disabled || loadingCommit}
            >
              {loadingCommit ? '...' : 'Push Code'}
            </button>
          </div>
          <button
              className="morphic-button"
              style={{ width: '100%', marginTop: '0.5rem', justifyContent: 'center', borderColor: 'var(--accent)', color: 'var(--accent)' }}
              onClick={onPR}
              disabled={disabled || loadingPR}
            >
              {loadingPR ? 'Creating PR...' : 'Create Pull Request'}
          </button>
        </>
      )}
      {status ? <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 500 }}>{status}</div> : null}
    </div>
  );
}


