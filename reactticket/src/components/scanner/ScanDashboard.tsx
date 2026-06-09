import React from 'react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useReactTicket } from '../../hooks/useReactTicket';

export const ScanDashboard: React.FC = () => {
  const { event } = useReactTicket();
  const { data, isLoading } = useAnalytics(event.id);

  if (isLoading) return <div>Loading...</div>;

  return (
    <section className="ReactTicket-root scan-dashboard">
      <h2>Scan Dashboard</h2>
      {/* Analytics charts would go here */}
      <p>Data: {JSON.stringify(data)}</p>
    </section>
  );
};
