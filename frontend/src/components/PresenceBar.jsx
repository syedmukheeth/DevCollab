import { motion } from 'framer-motion';

export function PresenceBar({ users }) {
  if (!users || users.length === 0) return null;

  return (
    <div className="presence-bar" style={{ display: 'flex', gap: '6px' }}>
      {users.map((u, i) => {
        if (!u.user) return null;
        const stateColor = u.status === 'typing' ? '#10b981' : u.status === 'executing' ? 'var(--accent)' : '#64748b';
        return (
          <div key={i} className="presence-avatar" style={{ border: `2px solid ${u.user.color}`, borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', fontSize: '0.8rem', fontWeight: 800, background: 'var(--bg-panel)', color: 'var(--text-main)', boxShadow: 'var(--m-shadow)', overflow: 'hidden' }} title={`${u.user.name} (${u.status || 'idle'})`}>
            {u.user.avatar ? (
              <img src={u.user.avatar} alt={u.user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              u.user.name.charAt(0).toUpperCase()
            )}
            <div className="presence-status-dot" style={{ backgroundColor: stateColor, border: '2px solid var(--bg-panel)' }} />
          </div>
        );
      })}
    </div>
  );
}
