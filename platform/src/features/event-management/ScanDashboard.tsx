import { useLanguage } from "../../contexts/LanguageContext";
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
export default function ScanDashboard({
  eventId
}: {
  eventId: string;
}) {
  const {
    t
  } = useLanguage();
  const [scanEvents, setScanEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Stats
  const [totalScans, setTotalScans] = useState(0);
  const [totalAdmitted, setTotalAdmitted] = useState(0);
  const [invalidScans, setInvalidScans] = useState(0);
  const [accountBreakdown, setAccountBreakdown] = useState<Record<string, number>>({});
  const [scanVelocity, setScanVelocity] = useState<{
    timestamp: Date;
    count: number;
  }[]>([]);
  useEffect(() => {
    fetchScans();
    const interval = setInterval(fetchScans, 10000); // Poll every 10 seconds for MVP
    return () => clearInterval(interval);
  }, [eventId]);
  async function fetchScans() {
    // We fetch scan_events by looking up the scan_accounts for this event.
    // Or we could fetch tickets for this event and join.
    // Easiest is to fetch scan accounts first.
    const {
      data: accounts
    } = await supabase.from('scan_accounts').select('id, username').eq('event_id', eventId);
    if (!accounts || accounts.length === 0) {
      setLoading(false);
      return;
    }
    const accountIds = accounts.map((a: any) => a.id);
    const {
      data: scans
    } = await supabase.from('scan_events').select('*').in('scanned_by_account_id', accountIds).order('scanned_at', {
      ascending: false
    });
    if (scans) {
      setScanEvents(scans);
      setTotalScans(scans.length);
      setTotalAdmitted(scans.filter((s: any) => s.result === 'admitted' || s.result === 'clock_skew_anomaly').length);
      setInvalidScans(scans.filter((s: any) => s.result !== 'admitted' && s.result !== 'clock_skew_anomaly').length);
      const breakdown: Record<string, number> = {};
      scans.forEach((s: any) => {
        const name = s.scanned_by_account_name || 'Unknown Account';
        breakdown[name] = (breakdown[name] || 0) + 1;
      });
      setAccountBreakdown(breakdown);

      // Calculate Scan Velocity (last hour, 5 min intervals)
      const velocity: Record<number, number> = {};
      const now = Date.now();
      const oneHourAgo = now - 3600000;
      scans.forEach((s: any) => {
        const t = new Date(s.scanned_at).getTime();
        if (t >= oneHourAgo) {
          const bucket = Math.floor(t / 300000) * 300000; // 5 min buckets
          velocity[bucket] = (velocity[bucket] || 0) + 1;
        }
      });
      const velocityArray = Object.keys(velocity).map(k => ({
        timestamp: new Date(parseInt(k)),
        count: velocity[parseInt(k)]
      })).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      setScanVelocity(velocityArray);
    }
    setLoading(false);
  }
  if (loading) return <div className="glass-panel" style={{
    padding: '24px'
  }}>{t("loadingLiveAnalytics")}</div>;
  return <div className="glass-panel" style={{
    padding: '24px'
  }}>
      <h2 style={{
      margin: '0 0 16px 0',
      fontSize: '1.2rem',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}>
        <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: '#10b981',
        animation: 'pulse 2s infinite'
      }} />{t("liveScanAnalytics")}</h2>
      
      {totalScans === 0 ? <p style={{
      color: 'var(--text-secondary)'
    }}>{t("noTicketsHaveBeenScannedY")}</p> : <>
          <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        marginBottom: '24px'
      }}>
            <div style={{
          backgroundColor: 'rgba(255,255,255,0.05)',
          padding: '16px',
          borderRadius: '8px'
        }}>
              <p style={{
            margin: '0 0 4px 0',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem'
          }}>{t("totalScans")}</p>
              <p style={{
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: 'bold'
          }}>{totalScans}</p>
            </div>
            <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          padding: '16px',
          borderRadius: '8px'
        }}>
              <p style={{
            margin: '0 0 4px 0',
            color: '#10b981',
            fontSize: '0.9rem'
          }}>{t("admitted")}</p>
              <p style={{
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#10b981'
          }}>{totalAdmitted}</p>
            </div>
            <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          padding: '16px',
          borderRadius: '8px'
        }}>
              <p style={{
            margin: '0 0 4px 0',
            color: '#ef4444',
            fontSize: '0.9rem'
          }}>{t("invalidRejected")}</p>
              <p style={{
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#ef4444'
          }}>{invalidScans}</p>
            </div>
          </div>

          <h3 style={{
        margin: '0 0 12px 0',
        fontSize: '1rem',
        color: 'var(--text-secondary)'
      }}>{t("scanVelocityLastHour")}</h3>
          <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '5px',
        height: '100px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid var(--border)',
        padding: '10px',
        borderRadius: '8px',
        marginBottom: '24px'
      }}>
            {scanVelocity.length === 0 ? <p style={{
          width: '100%',
          textAlign: 'center',
          color: 'var(--text-secondary)'
        }}>{t("noRecentActivity")}</p> : scanVelocity.map((v, i) => <div key={i} title={`${v.count} scans at ${v.timestamp.toLocaleTimeString()}`} style={{
          flex: 1,
          background: 'var(--accent)',
          height: `${Math.min(100, v.count / 10 * 100)}%`,
          // Normalized to max 10 per 5 min for display
          borderRadius: '2px 2px 0 0'
        }}></div>)}
          </div>

          <h3 style={{
        margin: '0 0 12px 0',
        fontSize: '1rem',
        color: 'var(--text-secondary)'
      }}>{t("scansByAccount")}</h3>
          <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        marginBottom: '24px'
      }}>
            {Object.entries(accountBreakdown).map(([name, count]) => <div key={name} style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '8px 12px',
          backgroundColor: 'rgba(0,0,0,0.2)',
          borderRadius: '6px'
        }}>
                <span>{name}</span>
                <strong style={{
            color: 'var(--accent)'
          }}>{count}</strong>
              </div>)}
          </div>

          <h3 style={{
        margin: '0 0 12px 0',
        fontSize: '1rem',
        color: 'var(--text-secondary)'
      }}>{t("recentActivity")}</h3>
          <div style={{
        maxHeight: '200px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
            {scanEvents.slice(0, 10).map((scan, i) => <div key={i} style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.85rem',
          padding: '8px',
          borderBottom: '1px solid var(--border)'
        }}>
                <span style={{
            color: scan.result === 'admitted' || scan.result === 'clock_skew_anomaly' ? '#10b981' : '#ef4444'
          }}>
                  {scan.result.toUpperCase()}
                </span>
                <span style={{
            color: 'var(--text-secondary)'
          }}>
                  {new Date(scan.scanned_at).toLocaleTimeString()} - {scan.scanned_by_account_name}
                </span>
              </div>)}
          </div>
        </>}

      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
      `}</style>
    </div>;
}