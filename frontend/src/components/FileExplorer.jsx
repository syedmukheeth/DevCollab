import React, { useState } from 'react';

export function FileExplorer({
  files,
  activeFileId,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  onRenameFile,
  disabled
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
    setEditingFileId(file._id);
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
          const isActive = file._id === activeFileId;
          const isEditing = editingFileId === file._id;
          return (
            <div
              key={file._id}
              className={`file-item ${isActive ? 'active' : ''}`}
            >
              {isEditing ? (
                <input
                  className="file-rename-input"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={() => commitRename(file._id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename(file._id);
                    if (e.key === 'Escape') {
                      setEditingFileId(null);
                      setEditingName('');
                    }
                  }}
                  autoFocus
                />
              ) : (
                <button
                  type="button"
                  className="file-name-button"
                  onClick={() => onSelectFile(file._id)}
                >
                  {file.name}
                </button>
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
                    onClick={() => onDeleteFile(file._id)}
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

