import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Entity } from '../../components/EntitySwitcher';

export default function ArtistDashboard() {
  const { activeEntity } = useOutletContext<{ activeEntity: Entity }>();
  
  // Analytics State
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    if (activeEntity) {
      fetchAnalytics();
    }
  }, [activeEntity]);

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    const { data, error } = await supabase.rpc('get_artist_analytics', { artist_id_param: activeEntity.id });
    if (!error && data) {
      setAnalytics(data);
    }
    setAnalyticsLoading(false);
  };

  return (
    <div>
      <div className="glass-panel" style={{ padding: '32px', marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 16px 0' }}>Welcome, {activeEntity.name}!</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Your account is verified. Below are the insights gathered from attendees of your events.
        </p>
      </div>

      <h3 style={{ marginBottom: '16px' }}>Audience Analytics</h3>
      {analyticsLoading ? (
        <p>Loading your insights...</p>
      ) : analytics ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)' }}>Total Reach</h4>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent)' }}>
              {analytics.total_tickets || 0}
            </div>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Total tickets sold for your events</p>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <h4 style={{ margin: '0 0 16px 0', color: 'var(--text-secondary)' }}>Top Demographics (Age)</h4>
            {Object.keys(analytics.demographics?.ages || {}).length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No age data available.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(analytics.demographics.ages).map(([age, count]: [string, any]) => (
                  <div key={age} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Age {age}</span>
                    <span style={{ fontWeight: 600 }}>{count} fans</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <h4 style={{ margin: '0 0 16px 0', color: 'var(--text-secondary)' }}>Top Locations (Country)</h4>
            {Object.keys(analytics.demographics?.countries || {}).length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No location data available.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(analytics.demographics.countries).map(([country, count]: [string, any]) => (
                  <div key={country} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{country}</span>
                    <span style={{ fontWeight: 600 }}>{count} fans</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <p>No analytics found.</p>
      )}
    </div>
  );
}
