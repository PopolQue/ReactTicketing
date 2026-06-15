import React from 'react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useReactTicket } from '../../hooks/useReactTicket';

export const ScanDashboard: React.FC = () => {
  const { event } = useReactTicket();
  const { summary, isLoading } = useAnalytics(event.id);

  if (isLoading) return (
    <section className="ReactTicket-root scan-dashboard" role="status" aria-busy="true" aria-label="Loading scan dashboard">
      <div style={{ height: '32px', background: '#e2e8f0', borderRadius: '4px', width: '40%', marginBottom: '20px', animation: 'pulse 1.5s infinite' }}></div>
      <div style={{ height: '100px', background: '#f8fafc', borderRadius: '8px', animation: 'pulse 1.5s infinite' }}></div>
    </section>
  );

  return (
    <section className="ReactTicket-root scan-dashboard" role="region" aria-label="Scan Dashboard">
      <h2>Scan Dashboard</h2>
      {/* Analytics charts would go here */}
      <p aria-live="polite">Data: {JSON.stringify(summary)}</p>
    </section>
  );
};
