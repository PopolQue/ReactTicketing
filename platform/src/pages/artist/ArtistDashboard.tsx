import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Entity } from '../../components/EntitySwitcher';
import { useLanguage } from '../../contexts/LanguageContext';
import { Share2, Music } from 'lucide-react';

export default function ArtistDashboard() {
  const { t } = useLanguage();
  const { activeEntity } = useOutletContext<{ activeEntity: Entity }>();
  
  // Artist State
  const [artist, setArtist] = useState<any>(null);
  
  // Analytics State
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);
    // Fetch Artist Profile
    const { data: artistData } = await supabase
        .from('artists')
        .select('*')
        .eq('id', activeEntity.id)
        .single();
    setArtist(artistData);

    // Fetch Analytics
    const { data: analyticsData } = await supabase.rpc('get_artist_analytics', { artist_id_param: activeEntity.id });
    setAnalytics(analyticsData);
    setLoading(false);
  }

  useEffect(() => {
    if (activeEntity) {
      fetchData();
    }
  }, [activeEntity]);

  if (loading) return <div>{t('artist_dash_loading')}</div>;

  return (
    <div>
      <div className="glass-panel" style={{ padding: '32px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
        {artist?.image_url && <img src={artist.image_url} alt={artist.name} style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover' }} />}
        <div style={{ flex: '1 1 200px' }}>
            <h2 style={{ margin: '0 0 8px 0' }}>{artist?.name}</h2>
            <div style={{ display: 'flex', gap: '16px' }}>
                {artist?.spotify_url && <a href={artist.spotify_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}><Music size={24} /></a>}
                {artist?.instagram_url && <a href={artist.instagram_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}><Share2 size={24} /></a>}
                {artist?.soundcloud_url && <a href={artist.soundcloud_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}><Music size={24} /></a>}
            </div>
        </div>
      </div>

      <h3 style={{ marginBottom: '16px' }}>{t('artist_dash_analytics')}</h3>
      {analytics ? (
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
