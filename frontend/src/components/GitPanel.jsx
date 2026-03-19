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
  loadingCommit
}) {
  return (
    <div className="git-panel">
      <div className="git-panel-title">GitHub</div>
      <div className="git-grid">
        <div className="git-field">
          <label className="git-label">Branch</label>
          <input
            className="git-input"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            disabled={disabled}
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
        >
          {loadingInit ? 'Init...' : 'Init Repo'}
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
      {status ? <div className="git-status">{status}</div> : null}
    </div>
  );
}

