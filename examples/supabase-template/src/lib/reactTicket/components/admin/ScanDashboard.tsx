import React from 'react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useReactTicket } from '../../hooks/useReactTicket';

export const ScanDashboard: React.FC = () => {
  const { event } = useReactTicket();
  const { summary, isLoading, error, refresh } = useAnalytics(event.id);

  if (isLoading && !summary) return <p>Loading analytics...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error} <button onClick={refresh}>Retry</button></p>;
  if (!summary) return null;

  return (
    <div className="scan-dashboard" style={{ marginTop: '20px' }}>
      <h3>Live Scan Dashboard</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <div className="stat-card" style={{ padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Admitted / Issued</span>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{summary.totalAdmitted} / {summary.totalIssued}</div>
            <small style={{ color: '#22c55e' }}>{((summary.totalAdmitted / (summary.totalIssued || 1)) * 100).toFixed(1)}%</small>
        </div>
        <div className="stat-card" style={{ padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Duplicates / Invalid</span>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{summary.duplicateScanCount} / {summary.invalidScanCount}</div>
            <small style={{ color: '#ef4444' }}>Anomalies detected</small>
        </div>
      </div>

      <h4>Scan Velocity (Last Hour)</h4>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '5px', height: '100px', background: '#f1f5f9', padding: '10px', borderRadius: '8px', marginBottom: '20px' }}>
        {summary.scanVelocity.length === 0 ? <p style={{width: '100%', textAlign: 'center', color: '#64748b'}}>No recent activity</p> : 
         summary.scanVelocity.map((v, i) => (
            <div key={i} title={`${v.count} scans at ${v.timestamp.toLocaleTimeString()}`} style={{
                flex: 1,
                background: '#3b82f6',
                height: `${Math.min(100, (v.count / 10) * 100)}%`, // Normalized to max 10 per 5 min for display
                borderRadius: '2px 2px 0 0'
            }}></div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <section>
            <h4>Admission Rate by Ticket Type</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <tbody>
                    {Object.entries(summary.admissionRateByTicketType).map(([typeId, data]) => (
                        <tr key={typeId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '5px 0' }}>{typeId}</td>
                            <td style={{ textAlign: 'right' }}>{data.admitted} / {data.total}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
        <section>
            <h4>Scans per Account</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <tbody>
                    {Object.entries(summary.scansPerAccount).map(([accountId, data]) => (
                        <tr key={accountId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '5px 0' }}>{data.username}</td>
                            <td style={{ textAlign: 'right' }}>{data.count}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
      </div>

      {summary.clockSkewAnomalies > 0 && (
          <div style={{ marginTop: '20px', padding: '10px', background: '#fff7ed', border: '1px solid #fdba74', borderRadius: '8px', color: '#9a3412' }}>
              <strong>Warning:</strong> {summary.clockSkewAnomalies} clock skew anomalies detected. Ensure crew devices have correct time settings.
          </div>
      )}
    </div>
  );
};
