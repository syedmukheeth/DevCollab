import React, { useState } from 'react';

export function FileExplorer({
  files,
  activeFileId,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  onRenameFile,
  disabled,
  presenceStates = []
}) {
  const [newFileName, setNewFileName] = useState('');
  const [editingFileId, setEditingFileId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    onCreateFile(newFileName.trim());
    setNewFileName('');
  };

  const startRename = (file) => {
    setEditingFileId(file.id);
    setEditingName(file.name);
  };

  const commitRename = (fileId) => {
    const name = editingName.trim();
    if (name) {
      onRenameFile(fileId, name);
    }
    setEditingFileId(null);
    setEditingName('');
  };

  return (
    <div className="file-explorer" style={{ padding: '0.5rem' }}>
      <div className="file-explorer-header" style={{ padding: '0.5rem 1rem', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Files</div>
      <div className="file-list" style={{ marginTop: '0.5rem' }}>
        {files.map((file) => {
          const isActive = file.id === activeFileId;
          const isEditing = editingFileId === file.id;
          return (
            <div
              key={file.id}
              className={`file-item ${isActive ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              {isEditing ? (
                <input
                  className="git-input"
                  style={{ flex: 1, margin: 0, padding: '2px 8px', fontSize: '0.85rem' }}
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={() => commitRename(file.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename(file.id);
                    if (e.key === 'Escape') {
                      setEditingFileId(null);
                      setEditingName('');
                    }
                  }}
                  autoFocus
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                  <div className="file-presence" style={{ display: 'flex', gap: '2px' }}>
                    {(presenceStates || []).filter(s => s.activeFile === file.id && s.user).map((u, i) => (
                      <div key={i} className="presence-status-dot" style={{ backgroundColor: u.user.color, width: '8px', height: '8px', position: 'static' }} title={u.user.name} />
                    ))}
                  </div>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', textAlign: 'left', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', fontSize: '0.85rem' }}
                    onClick={() => onSelectFile(file.id)}
                  >
                    {file.name}
                  </button>
                </div>
              )}
              {!isEditing && (
                <div className="file-actions" style={{ display: 'flex', opacity: isActive ? 1 : 0.4 }}>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '0 4px' }}
                    title="Rename"
                    onClick={() => startRename(file)}
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.9rem', padding: '0 4px' }}
                    title="Delete"
                    onClick={() => onDeleteFile(file.id)}
                  >
                    🗑
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <form className="file-create-form" onSubmit={handleCreate} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', padding: '0.5rem' }}>
        <input
          type="text"
          className="git-input"
          style={{ flex: 1, margin: 0, fontSize: '0.8rem' }}
          placeholder="New file..."
          value={newFileName}
          onChange={(e) => setNewFileName(e.target.value)}
          disabled={disabled}
        />
        <button type="submit" disabled={disabled} className="morphic-button primary" style={{ padding: '0.2rem 0.6rem' }}>
          +
        </button>
      </form>
    </div>
  );
}

