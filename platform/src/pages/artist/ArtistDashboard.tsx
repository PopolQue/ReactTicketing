import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Entity } from '../../components/EntitySwitcher';
import { useLanguage } from '../../contexts/LanguageContext';

export default function ArtistDashboard() {
  const { t } = useLanguage();
  const { activeEntity } = useOutletContext<{ activeEntity: Entity }>();
  
  // Analytics State
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  async function fetchAnalytics() {
    setAnalyticsLoading(true);
    const { data, error } = await supabase.rpc('get_artist_analytics', { artist_id_param: activeEntity.id });
    if (!error && data) {
      setAnalytics(data);
    }
    setAnalyticsLoading(false);
  }

  useEffect(() => {
    if (activeEntity) {
      fetchAnalytics();
    }
  }, [activeEntity]);

  return (
    <div>
      <div className="glass-panel" style={{ padding: '32px', marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 16px 0' }}>{t('artist_dash_welcome').replace('{name}', activeEntity.name)}</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          {t('artist_dash_insights_desc')}
        </p>
      </div>

      <h3 style={{ marginBottom: '16px' }}>{t('artist_dash_analytics')}</h3>
      {analyticsLoading ? (
        <p>{t('artist_dash_loading_insights')}</p>
      ) : analytics ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)' }}>{t('artist_dash_total_reach')}</h4>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent)' }}>
              {analytics.total_tickets || 0}
            </div>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('artist_dash_total_tickets')}</p>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <h4 style={{ margin: '0 0 16px 0', color: 'var(--text-secondary)' }}>{t('artist_dash_top_demographics')}</h4>
            {Object.keys(analytics.demographics?.ages || {}).length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>{t('artist_dash_no_age_data')}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(analytics.demographics.ages).map(([age, count]: [string, any]) => (
                  <div key={age} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{t('artist_dash_age').replace('{age}', age)}</span>
                    <span style={{ fontWeight: 600 }}>{count} {t('artist_dash_fans')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <h4 style={{ margin: '0 0 16px 0', color: 'var(--text-secondary)' }}>{t('artist_dash_top_locations')}</h4>
            {Object.keys(analytics.demographics?.countries || {}).length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>{t('artist_dash_no_location_data')}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(analytics.demographics.countries).map(([country, count]: [string, any]) => (
                  <div key={country} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{country}</span>
                    <span style={{ fontWeight: 600 }}>{count} {t('artist_dash_fans')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <p>{t('artist_dash_no_analytics')}</p>
      )}
    </div>
  );
}
