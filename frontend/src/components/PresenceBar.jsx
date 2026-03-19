import React from 'react';

export function PresenceBar({ users }) {
  if (!users || users.length === 0) return null;

  return (
    <div className="presence-bar">
      {users.map((u, i) => {
        if (!u.user) return null;
        const stateColor = u.status === 'typing' ? '#10b981' : u.status === 'executing' ? '#3b82f6' : '#6b7280';
        return (
          <div key={i} className="presence-avatar" style={{ borderColor: u.user.color }} title={`${u.user.name} (${u.status || 'idle'})`}>
            {u.user.name.charAt(0).toUpperCase()}
            <div className="presence-status-dot" style={{ backgroundColor: stateColor }} />
          </div>
        );
      })}
    </div>
  );
}
