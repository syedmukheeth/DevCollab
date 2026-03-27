import React, { useState } from 'react';
import { api } from '../lib/api';

export function SearchPanel({ projectId, onSelectResult }) {
  const [query, setQuery] = useState('');
  const [isRegex, setIsRegex] = useState(false);
  const [isCaseSensitive, setIsCaseSensitive] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const { data } = await api.get(`/projects/${projectId}/search`, {
        params: { 
          q: query, 
          regex: isRegex.toString(), 
          caseSensitive: isCaseSensitive.toString() 
        }
      });
      setResults(data.results);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-panel" style={{ padding: '0.8rem', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="sidebar-header" style={{ marginBottom: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Search Workspace</div>
      
      <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            className="git-input"
            style={{ width: '100%', paddingRight: '32px' }}
            placeholder="Search across files..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {loading && (
            <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)' }}>
              <span className="spinner" style={{ width: '14px', height: '14px' }} />
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <input type="checkbox" checked={isRegex} onChange={e => setIsRegex(e.target.checked)} />
            .* Regex
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <input type="checkbox" checked={isCaseSensitive} onChange={e => setIsCaseSensitive(e.target.checked)} />
            Aa Case
          </label>
        </div>
        
        <button type="submit" className="morphic-button primary" style={{ justifyContent: 'center' }} disabled={loading}>
          Find
        </button>
      </form>

      <div className="search-results" style={{ flex: 1, marginTop: '1.2rem', overflowY: 'auto', borderTop: '1px solid var(--border-glass)', paddingTop: '1rem' }}>
        {results.length === 0 && !loading && query && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2rem' }}>No matches found.</div>
        )}
        
        {results.map((res, i) => (
          <div 
            key={i} 
            className="search-result-item" 
            onClick={() => onSelectResult(res.fileId, res.line)}
            style={{ 
              padding: '10px 12px', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              marginBottom: '8px',
              border: '1px solid transparent',
              background: 'rgba(255,255,255,0.02)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseOver={(e) => { 
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; 
              e.currentTarget.style.borderColor = 'var(--border-glass)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => { 
              e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; 
              e.currentTarget.style.borderColor = 'transparent'; 
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1rem' }}>📄</span>
                {res.fileName}
              </span>
              <span style={{ 
                fontSize: '0.65rem', 
                color: 'var(--accent)', 
                background: 'rgba(52, 152, 219, 0.1)', 
                padding: '2px 8px', 
                borderRadius: '12px',
                fontWeight: 700,
                border: '1px solid rgba(52, 152, 219, 0.2)'
              }}>LINE {res.line}</span>
            </div>
            <div style={{ 
              fontSize: '0.75rem', 
              color: 'var(--text-muted)', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap',
              fontFamily: 'monospace',
              marginTop: '6px',
              paddingLeft: '10px',
              borderLeft: '2.5px solid var(--accent)',
              opacity: 0.8
            }}>
              {res.content.trim()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
