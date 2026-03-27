import React, { useState } from 'react';
import { 
  FileText, 
  FolderOpen, 
  Plus, 
  Trash2, 
  Edit3, 
  FileCode,
  FileJson,
  FileTerminal
} from 'lucide-react';

export function FileExplorer({ 
  files, 
  activeFileId, 
  onSelectFile, 
  onCreateFile, 
  onDeleteFile, 
  onRenameFile,
  disabled
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [renamingId, setRenamingId] = useState(null);
  const [renamingName, setRenamingName] = useState('');

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (ext === 'js' || ext === 'jsx' || ext === 'ts' || ext === 'tsx') return <FileCode size={16} className="text-blue-400" />;
    if (ext === 'json') return <FileJson size={16} className="text-amber-400" />;
    if (ext === 'md') return <FileText size={16} className="text-slate-400" />;
    if (ext === 'sh') return <FileTerminal size={16} className="text-emerald-400" />;
    return <FileText size={16} className="text-slate-500" />;
  };

  return (
    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FolderOpen size={14} /> Workspace
        </h3>
        <button 
          onClick={() => setIsCreating(true)}
          disabled={disabled}
          style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: '4px', display: 'flex' }}
          title="New File"
        >
          <Plus size={18} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {isCreating && (
          <div style={{ padding: '6px 10px', background: 'rgba(59, 130, 246, 0.08)', borderRadius: '8px', marginBottom: '8px', border: '1px solid var(--accent)' }}>
            <input
              autoFocus
              style={{ background: 'none', border: 'none', color: 'white', fontSize: '0.85rem', width: '100%', outline: 'none' }}
              placeholder="filename.js"
              value={newName}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newName) {
                  onCreateFile(newName);
                  setNewName('');
                  setIsCreating(false);
                } else if (e.key === 'Escape') {
                  setIsCreating(false);
                }
              }}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={() => { if(!newName) setIsCreating(false); }}
            />
          </div>
        )}

        {files.map((file) => {
          const isActive = activeFileId === file.id;
          const isRenaming = renamingId === file.id;
          
          return (
            <div
              key={file.id}
              onClick={() => onSelectFile(file.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                border: '1px solid',
                borderColor: isActive ? 'var(--border-active)' : 'transparent',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                e.currentTarget.querySelector('.file-actions').style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
                e.currentTarget.querySelector('.file-actions').style.opacity = '0';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {getFileIcon(file.name)}
              </div>
              
              <div style={{ 
                flex: 1, 
                fontSize: '0.85rem', 
                fontWeight: isActive ? 600 : 500, 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap' 
              }}>
                {isRenaming ? (
                  <input
                    autoFocus
                    value={renamingName}
                    style={{ background: 'none', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: '0.85rem' }}
                    onChange={(e) => setRenamingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onRenameFile(file.id, renamingName);
                        setRenamingId(null);
                      } else if (e.key === 'Escape') {
                        setRenamingId(null);
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  file.name
                )}
              </div>

              <div 
                className="file-actions"
                style={{ 
                  display: 'flex', 
                  gap: '4px', 
                  opacity: isActive ? 1 : 0,
                  transition: 'opacity 0.2s',
                  paddingLeft: '8px'
                }}
              >
                <button 
                  onClick={(e) => { e.stopPropagation(); setRenamingId(file.id); setRenamingName(file.name); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '2px', display: 'flex' }}
                  title="Rename"
                >
                  <Edit3 size={14} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDeleteFile(file.id); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '2px', display: 'flex' }}
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
