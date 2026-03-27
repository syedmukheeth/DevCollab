import React from 'react';

const FEATURES = [
  {
    icon: '🤝',
    title: 'Real-time Collaboration',
    desc: 'Conflict-free editing with live cursor presence powered by CRDTs'
  },
  {
    icon: '⚡',
    title: 'Sandboxed Execution',
    desc: '8 languages in isolated Docker containers with resource limits'
  },
  {
    icon: '🔗',
    title: 'GitHub Integration',
    desc: 'Commit, push, and create PRs directly from the workspace'
  },
  {
    icon: '🛡️',
    title: 'Production Security',
    desc: 'Circuit breakers, RBAC, request validation, HMAC auth'
  },
  {
    icon: '🕒',
    title: 'Time-Travel Debug',
    desc: 'Replay edit history with state snapshots and visual diffs'
  },
  {
    icon: '👥',
    title: 'Interview Mode',
    desc: 'Timed sessions with role-based permissions for interviewers'
  }
];

const LANGUAGES = ['Python', 'JavaScript', 'TypeScript', 'Go', 'Java', 'C++', 'Rust', 'Ruby'];

export function LandingPage({ onEnter }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-main)',
      color: 'var(--text-main)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'var(--font-sans)'
    }}>
      {/* Hero Section */}
      <header style={{
        textAlign: 'center',
        padding: '4rem 2rem 2rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-100px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
          zIndex: 0,
          pointerEvents: 'none'
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            marginBottom: '0.5rem',
            lineHeight: 1.1
          }}>
            💠 DevCollab
          </h1>
          <p style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.3rem)',
            color: 'var(--text-muted)',
            maxWidth: '600px',
            margin: '0 auto 2rem',
            lineHeight: 1.6
          }}>
            A real-time collaborative IDE with sandboxed code execution,
            GitHub integration, and interview workflows.
          </p>
          <button
            onClick={onEnter}
            className="morphic-button primary"
            style={{
              fontSize: '1.1rem',
              padding: '12px 40px',
              borderRadius: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              boxShadow: '0 4px 20px var(--accent-glow)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 8px 30px var(--accent-glow)'; }}
            onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 20px var(--accent-glow)'; }}
          >
            Launch IDE →
          </button>
        </div>
      </header>

      {/* Language Badges */}
      <section style={{ textAlign: 'center', padding: '1rem 2rem 2rem' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.75rem', letterSpacing: '0.1em' }}>
          Supports
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.5rem' }}>
          {LANGUAGES.map(lang => (
            <span key={lang} style={{
              padding: '4px 14px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 600,
              background: 'var(--bg-panel)',
              border: '1px solid var(--border-glass)',
              backdropFilter: 'var(--m-blur)',
              color: 'var(--text-main)'
            }}>{lang}</span>
          ))}
        </div>
      </section>

      {/* Feature Grid */}
      <section style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}>
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="glass-panel"
              style={{
                padding: '1.5rem',
                borderRadius: '16px',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'default'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--m-shadow)'; }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{f.icon}</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.5rem' }}>{f.title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section style={{ textAlign: 'center', padding: '2rem', display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap' }}>
        {[
          { num: '79', label: 'Tests Passing' },
          { num: '8', label: 'Languages' },
          { num: '10', label: 'Test Suites' },
          { num: '<2s', label: 'Test Speed' }
        ].map((s, i) => (
          <div key={i}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent)' }}>{s.num}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        padding: '1.5rem',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        borderTop: '1px solid var(--border-glass)'
      }}>
        Built with ❤️ by{' '}
        <a
          href="https://www.linkedin.com/in/syedmukheeth"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 800, borderBottom: '2px solid var(--accent)' }}
        >
          Syed Mukheeth
        </a>
      </footer>
    </div>
  );
}
