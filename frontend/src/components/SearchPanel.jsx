import React, { useState } from 'react';
import { api } from '../lib/api';
import { 
  Search, 
  Settings2, 
  CaseSensitive, 
  Regex, 
  FileText, 
  ChevronRight,
  Loader2,
  XCircle
} from 'lucide-react';

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
      setResults(data.results || []);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ marginBottom: '1rem', fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Search size={14} /> Global Search
      </div>
      
      <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            style={{ 
              width: '100%', 
              padding: '10px 36px 10px 12px', 
              background: 'rgba(0,0,0,0.2)', 
              border: '1px solid var(--border-glass)', 
              borderRadius: '8px',
              color: 'white',
              fontSize: '0.85rem',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            placeholder="Search symbols, text..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border-glass)'}
          />
          <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            type="button"
            onClick={() => setIsRegex(!isRegex)}
            style={{ 
              flex: 1,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '6px', 
              fontSize: '0.7rem', 
              padding: '6px',
              borderRadius: '6px',
              border: '1px solid',
              borderColor: isRegex ? 'var(--accent)' : 'var(--border-glass)',
              background: isRegex ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              color: isRegex ? 'var(--accent-neon)' : 'var(--text-dim)',
              cursor: 'pointer',
              fontWeight: 700
            }}
          >
            <Regex size={14} /> REGEX
          </button>
          <button 
            type="button"
            onClick={() => setIsCaseSensitive(!isCaseSensitive)}
            style={{ 
              flex: 1,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '6px', 
              fontSize: '0.7rem', 
              padding: '6px',
              borderRadius: '6px',
              border: '1px solid',
              borderColor: isCaseSensitive ? 'var(--accent)' : 'var(--border-glass)',
              background: isCaseSensitive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              color: isCaseSensitive ? 'var(--accent-neon)' : 'var(--text-dim)',
              cursor: 'pointer',
              fontWeight: 700
            }}
          >
            <CaseSensitive size={14} /> CASE
          </button>
        </div>
      </form>

      <div style={{ flex: 1, marginTop: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {results.length === 0 && !loading && query && (
          <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem', marginTop: '3rem', padding: '0 1rem' }}>
            <XCircle size={32} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
            No results for "{query}"
          </div>
        )}
        
        {results.map((res, i) => (
          <div 
            key={i} 
            onClick={() => onSelectResult(res.fileId, res.line)}
            style={{ 
              padding: '10px', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              background: 'transparent',
              transition: 'all 0.2s',
              border: '1px solid transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              e.currentTarget.style.borderColor = 'var(--border-glass)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={14} className="text-blue-400" />
                {res.fileName}
              </span>
              <span style={{ 
                fontSize: '0.65rem', 
                color: 'var(--accent-neon)', 
                background: 'rgba(59, 130, 246, 0.1)', 
                padding: '2px 6px', 
                borderRadius: '4px',
                fontWeight: 800
              }}>L{res.line}</span>
            </div>
            <div style={{ 
              fontSize: '0.75rem', 
              color: 'var(--text-muted)', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap',
              fontFamily: 'var(--font-mono)',
              paddingLeft: '10px',
              borderLeft: '2px solid var(--accent)',
              opacity: 0.7
            }}>
              {res.content.trim()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
