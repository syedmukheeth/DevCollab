import React from 'react';

export function Breadcrumbs({ projectName, fileName, onProjectClick }) {
  return (
    <div className="breadcrumbs" style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      background: 'var(--bg-panel)',
      fontSize: '0.85rem',
      color: 'var(--text-muted)',
      borderBottom: '1px solid var(--border-glass)',
      backdropFilter: 'var(--m-blur)',
      zIndex: 10
    }}>
      <button 
        onClick={onProjectClick}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--accent)',
          fontWeight: 800,
          cursor: 'pointer',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        <span style={{ fontSize: '1.1rem' }}>💠</span> {projectName}
      </button>
      
      {fileName && (
        <>
          <span style={{ opacity: 0.5 }}>/</span>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-main)',
            fontWeight: 600
          }}>
            <svg style={{ width: '14px', height: '14px', opacity: 0.7 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            {fileName}
          </div>
        </>
      )}
    </div>
  );
}
