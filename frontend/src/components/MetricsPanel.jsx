import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';

export function MetricsPanel() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const { data } = await api.get('/metrics/system');
        setMetrics(data);
      } catch (e) {
        console.error('Metrics Error:', e);
      }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!metrics) return <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>Loading execution telemetry...</div>;

  return (
    <div className="metrics-panel" style={{ padding: '1rem' }}>
      <h3 style={{ marginTop: 0 }}>System Telemetry</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1rem', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Memory Load</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{metrics.memory?.usagePercent}</div>
        </div>
        
        <div className="glass-panel" style={{ padding: '1rem', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>CPU Load Avg</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{metrics.cpuStats?.[0]?.toFixed(2)}</div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Container Queue</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{metrics.executionQueue?.depth}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pending jobs</div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Workers</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{metrics.executionQueue?.runningWorkers} / {metrics.executionQueue?.concurrencyLimit}</div>
        </div>
      </div>
    </div>
  );
}
