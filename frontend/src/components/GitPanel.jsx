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
    <div className="git-panel">
      <div className="git-panel-title">
        GitHub 
        {isConnected && <span className="github-user-badge">@{githubUser.username}</span>}
      </div>
      
      {!isConnected ? (
        <div className="github-connect-prompt">
          <p>Connect your GitHub account to commit and push changes directly from DevCollab.</p>
          <button className="git-btn primary" onClick={onConnect}>Connect GitHub</button>
        </div>
      ) : (
        <>
          <div className="git-grid">
            <div className="git-field">
              <label className="git-label">Branch</label>
              <input
                className="git-input"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                disabled={disabled}
                placeholder="branch-name"
              />
            </div>
            <div className="git-field">
              <label className="git-label">Commit message</label>
              <input
                className="git-input"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={disabled}
              />
            </div>
          </div>
          <div className="git-actions">
            <button
              type="button"
              className="git-btn"
              onClick={onInit}
              disabled={disabled || loadingInit}
              title="Initialize or link a GitHub repository"
            >
              {loadingInit ? 'Init...' : 'Init/Link Repo'}
            </button>
            <button
              type="button"
              className="git-btn primary"
              onClick={onCommit}
              disabled={disabled || loadingCommit}
            >
              {loadingCommit ? 'Committing...' : 'Commit & Push'}
            </button>
          </div>
          <div className="git-actions" style={{marginTop: '0.4rem'}}>
            <button
              type="button"
              className="git-btn"
              style={{width: '100%', borderColor: '#60a5fa', color: '#60a5fa'}}
              onClick={onPR}
              disabled={disabled || loadingPR}
            >
              {loadingPR ? 'Creating PR...' : 'Create Pull Request'}
            </button>
          </div>
        </>
      )}
      {status ? <div className="git-status">{status}</div> : null}
    </div>
  );
}


