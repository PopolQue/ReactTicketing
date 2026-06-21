import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { BarChart, Activity, PieChart as PieChartIcon, Share2, Target } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import type { Entity } from '../../components/EntitySwitcher';
import Dropdown from '../../components/Dropdown';
import ScanDashboard from '../../features/event-management/ScanDashboard';
import { useLanguage } from '../../contexts/LanguageContext';

export default function MarketingAndAnalytics() {
  const { t } = useLanguage();
  const { activeEntity } = useOutletContext<{ activeEntity: Entity }>();
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [pixels, setPixels] = useState({
    metaPixelId: '',
    googleAnalyticsId: '',
    tiktokPixelId: '',
  });

  const [events, setEvents] = useState<{ id: string; name: string }[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');

  const [analytics, setAnalytics] = useState({
    pageViews: 0,
    conversionRate: 0,
    bounceRate: 0,
    topTrafficSource: 'Direct',
    demographics: {} as Record<string, number>,
  });

  useEffect(() => {
    async function fetchData() {
      if (!activeEntity) return;

      // Fetch pixels
      const { data: orgData } = await supabase
        .from('organizers')
        .select('marketing_pixels')
        .eq('id', activeEntity.id)
        .single();

      if (orgData?.marketing_pixels) {
        setPixels({
          metaPixelId: orgData.marketing_pixels.metaPixelId || '',
          googleAnalyticsId: orgData.marketing_pixels.googleAnalyticsId || '',
          tiktokPixelId: orgData.marketing_pixels.tiktokPixelId || '',
        });
      }

      // Fetch Page Views
      const { count: pageViewsCount } = await supabase
        .from('page_views')
        .select('*', { count: 'exact', head: true })
        .eq('organizer_id', activeEntity.id);

      // Fetch Events for Tickets & Demographics
      const { data: eventsData } = await supabase
        .from('events')
        .select('id, name')
        .eq('organizer_id', activeEntity.id);

      let ticketsSold = 0;
      const demoCounts: Record<string, number> = {};

      if (eventsData && eventsData.length > 0) {
        setEvents(eventsData);
        if (!selectedEventId) {
          setSelectedEventId(eventsData[0].id);
        }

        const eventIds = eventsData.map((e) => e.id);
        const { data: ticketsData } = await supabase
          .from('tickets')
          .select('personalization')
          .in('event_id', eventIds);

        if (ticketsData) {
          ticketsSold = ticketsData.length;
          ticketsData.forEach((t) => {
            const age = t.personalization?.Age || 'Unknown';
            demoCounts[age] = (demoCounts[age] || 0) + 1;
          });
        }
      }

      const totalDemos = Object.values(demoCounts).reduce((a, b) => a + b, 0);
      const demoPercentages: Record<string, number> = {};
      if (totalDemos > 0) {
        Object.entries(demoCounts).forEach(([age, count]) => {
          demoPercentages[age] = Math.round((count / totalDemos) * 100);
        });
      } else {
        demoPercentages['18-24'] = 0;
      }

      const pv = pageViewsCount || 0;
      const convRate = pv > 0 ? ((ticketsSold / pv) * 100).toFixed(1) : 0;

      setAnalytics({
        pageViews: pv,
        conversionRate: Number(convRate),
        bounceRate: 0,
        topTrafficSource: 'Direct',
        demographics:
          Object.keys(demoPercentages).length > 0 ? demoPercentages : { '18-24': 0, '25-34': 0 },
      });

      setLoading(false);
    }
    fetchData();
  }, [activeEntity]);

  const handleSavePixels = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEntity) return;

    await supabase
      .from('organizers')
      .update({
        marketing_pixels: pixels,
      })
      .eq('id', activeEntity.id);

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return <div style={{ padding: '24px' }}>{t('organizer.marketing.loading')}</div>;

  return (
    <div className="marketing-page" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <BarChart size={32} color="var(--accent)" />
        {t('organizer.marketing.title')}
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '24px',
          marginBottom: '40px',
        }}
      >
        <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
          <Activity size={24} color="#10b981" style={{ marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 8px 0', fontSize: '2rem' }}>
            {analytics.pageViews.toLocaleString()}
          </h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            {t('organizer.marketing.pageViews')}
          </p>
        </div>
        <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
          <Target size={24} color="#3b82f6" style={{ marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 8px 0', fontSize: '2rem' }}>{analytics.conversionRate}%</h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            {t('organizer.marketing.conversionRate')}
          </p>
        </div>
        <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
          <Share2 size={24} color="#8b5cf6" style={{ marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.5rem' }}>{analytics.topTrafficSource}</h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            {t('organizer.marketing.topTraffic')}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        {/* Marketing Pixels */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          <h3
            style={{
              margin: '0 0 24px 0',
              borderBottom: '1px solid var(--border)',
              paddingBottom: '12px',
            }}
          >
            {t('organizer.marketing.trackingPixels')}
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
            {t('organizer.marketing.pixelsDesc')}
          </p>

          <form
            onSubmit={handleSavePixels}
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <div>
              <label
                style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}
              >
                {t('organizer.marketing.metaPixel')}
              </label>
              <input
                type="text"
                className="input-field"
                value={pixels.metaPixelId}
                onChange={(e) => setPixels({ ...pixels, metaPixelId: e.target.value })}
                placeholder={t('organizer.marketing.metaPixelPlaceholder')}
              />
            </div>
            <div>
              <label
                style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}
              >
                {t('organizer.marketing.ga4')}
              </label>
              <input
                type="text"
                className="input-field"
                value={pixels.googleAnalyticsId}
                onChange={(e) => setPixels({ ...pixels, googleAnalyticsId: e.target.value })}
                placeholder={t('organizer.marketing.ga4Placeholder')}
              />
            </div>
            <div>
              <label
                style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}
              >
                {t('organizer.marketing.tiktokPixel')}
              </label>
              <input
                type="text"
                className="input-field"
                value={pixels.tiktokPixelId}
                onChange={(e) => setPixels({ ...pixels, tiktokPixelId: e.target.value })}
                placeholder={t('organizer.marketing.tiktokPixelPlaceholder')}
              />
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '16px' }}>
              {saved
                ? t('organizer.marketing.savedSuccess')
                : t('organizer.marketing.saveIntegrations')}
            </button>
          </form>
        </div>

        {/* Demographics Chart (Simulated) */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          <h3
            style={{
              margin: '0 0 24px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderBottom: '1px solid var(--border)',
              paddingBottom: '12px',
            }}
          >
            <PieChartIcon size={20} />
            {t('organizer.marketing.audienceDemographics')}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
            {Object.entries(analytics.demographics).map(([age, percentage]) => (
              <div key={age}>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}
                >
                  <span>
                    {age} {t('organizer.marketing.years')}
                  </span>
                  <span style={{ fontWeight: 'bold' }}>{percentage}%</span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '12px',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: '6px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${percentage}%`,
                      height: '100%',
                      backgroundColor: 'var(--accent)',
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: '40px',
              padding: '16px',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '8px',
            }}
          >
            <h4 style={{ margin: '0 0 8px 0', color: '#60a5fa' }}>
              {t('organizer.marketing.marketingInsight')}
            </h4>
            <p
              style={{
                margin: 0,
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}
            >
              {t('organizer.marketing.insightDesc')}
            </p>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '32px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}
        >
          <h3 style={{ margin: 0 }}>{t('organizer.marketing.scanAnalytics')}</h3>
          <div style={{ width: '300px' }}>
            <Dropdown
              value={selectedEventId}
              onChange={(val) => setSelectedEventId(val)}
              options={events.map((e) => ({ value: e.id, label: e.name }))}
              placeholder={t('organizer.marketing.selectEvent')}
            />
          </div>
        </div>
        {selectedEventId ? (
          <ScanDashboard eventId={selectedEventId} />
        ) : (
          <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)' }}>
              {t('organizer.marketing.noEventSelected')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
