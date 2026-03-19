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
    <div className="file-explorer">
      <div className="file-explorer-header">Files</div>
      <div className="file-list">
        {files.map((file) => {
          const isActive = file.id === activeFileId;
          const isEditing = editingFileId === file.id;
          return (
            <div
              key={file.id}
              className={`file-item ${isActive ? 'active' : ''}`}
            >
              {isEditing ? (
                <input
                  className="file-rename-input"
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
                <>
                  <div className="file-presence">
                    {(presenceStates || []).filter(s => s.activeFile === file.id && s.user).map((u, i) => (
                      <div key={i} className="file-presence-dot" style={{ backgroundColor: u.user.color }} title={u.user.name} />
                    ))}
                  </div>
                  <button
                    type="button"
                    className="file-name-button"
                    onClick={() => onSelectFile(file.id)}
                  >
                    {file.name}
                  </button>
                </>
              )}
              {!isEditing && (
                <div className="file-actions">
                  <button
                    type="button"
                    className="icon-button"
                    title="Rename file"
                    onClick={() => startRename(file)}
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    title="Delete file"
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
      <form className="file-create-form" onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="New file name"
          value={newFileName}
          onChange={(e) => setNewFileName(e.target.value)}
          disabled={disabled}
        />
        <button type="submit" disabled={disabled}>
          +
        </button>
      </form>
    </div>
  );
}

