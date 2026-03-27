import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Terminal, 
  Github, 
  ShieldCheck, 
  History, 
  UserPlus, 
  Cpu, 
  Globe,
  ArrowRight,
  Code2,
  Sparkles
} from 'lucide-react';

const FEATURES = [
  {
    icon: <Users className="w-8 h-8 text-blue-400" />,
    title: 'Real-time Collaboration',
    desc: 'Conflict-free editing with live cursor presence powered by Yjs CRDTs.'
  },
  {
    icon: <Terminal className="w-8 h-8 text-emerald-400" />,
    title: 'Sandboxed Execution',
    desc: '8+ languages running in isolated Docker environments with resource limits.'
  },
  {
    icon: <Github className="w-8 h-8 text-purple-400" />,
    title: 'GitHub Integration',
    desc: 'Commit, push, and create PRs directly from your browser workspace.'
  },
  {
    icon: <ShieldCheck className="w-8 h-8 text-amber-400" />,
    title: 'Enterprise Security',
    desc: 'Circuit breakers, RBAC, and HMAC-signed API communication.'
  },
  {
    icon: <History className="w-8 h-8 text-rose-400" />,
    title: 'Time-Travel Replay',
    desc: 'Visual history replay with state snapshots and interactive diffing.'
  },
  {
    icon: <UserPlus className="w-8 h-8 text-indigo-400" />,
    title: 'Interview Mode',
    desc: 'Timed sessions with role-based permissions and audio/video calling.'
  }
];

const LANGUAGES = [
  { name: 'Python', icon: <Code2 size={14} /> },
  { name: 'JavaScript', icon: <Code2 size={14} /> },
  { name: 'TypeScript', icon: <Code2 size={14} /> },
  { name: 'Go', icon: <Code2 size={14} /> },
  { name: 'Java', icon: <Code2 size={14} /> },
  { name: 'C++', icon: <Code2 size={14} /> },
  { name: 'Rust', icon: <Code2 size={14} /> },
  { name: 'Ruby', icon: <Code2 size={14} /> }
];

export function LandingPage({ onEnter }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-deep)',
      color: 'var(--text-main)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'var(--font-sans)',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Background Orbs */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-5%',
        width: '60vw',
        height: '60vw',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      {/* Hero Section */}
      <header style={{
        textAlign: 'center',
        padding: '8rem 2rem 4rem',
        position: 'relative',
        zIndex: 1
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: '20px',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            color: 'var(--accent-neon)',
            fontSize: '0.8rem',
            fontWeight: 700,
            marginBottom: '2rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <Sparkles size={14} /> v2.0 Enterprise Release
          </div>
          
          <h1 style={{
            fontSize: 'clamp(3rem, 8vw, 5.5rem)',
            fontFamily: 'var(--font-heading)',
            fontWeight: 900,
            letterSpacing: '-0.04em',
            marginBottom: '1rem',
            lineHeight: 0.9,
            background: 'linear-gradient(to bottom, #fff 40%, rgba(255,255,255,0.6) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            DevCollab
          </h1>
          
          <p style={{
            fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
            color: 'var(--text-muted)',
            maxWidth: '700px',
            margin: '0 auto 3rem',
            lineHeight: 1.6,
            fontWeight: 400
          }}>
            The professional grade real-time IDE for elite engineering teams.
            Experience seamless collaboration with zero-latency sync.
          </p>

          <motion.button
            whileHover={{ scale: 1.05, translateY: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onEnter}
            style={{
              fontSize: '1.15rem',
              padding: '16px 48px',
              borderRadius: '14px',
              fontWeight: 800,
              cursor: 'pointer',
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              boxShadow: '0 8px 32px var(--accent-glow)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              fontFamily: 'var(--font-heading)'
            }}
          >
            Launch Workspace <ArrowRight size={20} />
          </motion.button>
        </motion.div>
      </header>

      {/* Languages Banner */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
        style={{ textAlign: 'center', padding: '2rem' }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem', opacity: 0.7 }}>
          {LANGUAGES.map(lang => (
            <div key={lang.name} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-glass)',
              color: 'var(--text-muted)'
            }}>
              {lang.icon} {lang.name}
            </div>
          ))}
        </div>
      </motion.section>

      {/* Feature Grid */}
      <section style={{ padding: '6rem 2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem'
        }}>
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-panel"
             style={{
                padding: '2.5rem',
                borderRadius: '24px',
                position: 'relative',
                overflow: 'hidden',
                background: 'rgba(15, 23, 42, 0.4)',
                border: '1px solid rgba(255,255,255,0.05)',
                transition: 'border-color 0.3s'
              }}
              whileHover={{ borderColor: 'var(--accent)' }}
            >
              <div style={{ marginBottom: '1.5rem' }}>{f.icon}</div>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontFamily: 'var(--font-heading)', 
                fontWeight: 700, 
                marginBottom: '0.75rem',
                color: 'white'
              }}>{f.title}</h3>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Metrics */}
      <section style={{ 
        textAlign: 'center', 
        padding: '4rem 2rem', 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '4rem', 
        flexWrap: 'wrap',
        background: 'rgba(0,0,0,0.2)',
        borderTop: '1px solid var(--border-glass)'
      }}>
        {[
          { icon: <Cpu size={24} />, num: '8', label: 'Languages' },
          { icon: <Globe size={24} />, num: 'Cloud', label: 'Architecture' },
          { icon: <History size={24} />, num: '∞', label: 'Snapshots' },
          { icon: <ShieldCheck size={24} />, num: 'AES', label: 'Security' }
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{ color: 'var(--accent-neon)', marginBottom: '4px' }}>{s.icon}</div>
            <div style={{ fontSize: '2.5rem', fontFamily: 'var(--font-heading)', fontWeight: 900, color: 'white' }}>{s.num}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.1em' }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        padding: '3rem 2rem',
        textAlign: 'center',
        borderTop: '1px solid var(--border-glass)'
      }}>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontWeight: 500 }}>
          Designed for the next generation of engineers.
        </div>
        <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          © 2026 DevCollab Enterprise. Managed by <a href="#" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 700 }}>Syed Mukheeth</a>
        </div>
      </footer>
    </div>
  );
}
