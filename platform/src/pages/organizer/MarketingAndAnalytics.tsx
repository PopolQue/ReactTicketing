import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { BarChart, Activity, PieChart as PieChartIcon, Share2, Target } from 'lucide-react';

export default function MarketingAndAnalytics() {
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [pixels, setPixels] = useState({
    metaPixelId: '',
    googleAnalyticsId: '',
    tiktokPixelId: ''
  });
  
  // Simulated analytics data
  const [analytics] = useState({
    pageViews: 12450,
    conversionRate: 4.2,
    bounceRate: 42,
    topTrafficSource: 'Instagram',
    demographics: {
      '18-24': 45,
      '25-34': 35,
      '35-44': 15,
      '45+': 5
    }
  });

  useEffect(() => {
    // In a real app, we would fetch the user's saved marketing settings from Supabase
    // For now, we simulate loading the settings
    setTimeout(() => {
      setLoading(false);
    }, 600);
  }, []);

  const handleSavePixels = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate saving to the backend
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return <div style={{ padding: '24px' }}>Loading analytics dashboard...</div>;

  return (
    <div className="marketing-page" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <BarChart size={32} color="var(--accent)" />
        Analytics & Marketing
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
          <Activity size={24} color="#10b981" style={{ marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 8px 0', fontSize: '2rem' }}>{analytics.pageViews.toLocaleString()}</h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Total Page Views</p>
        </div>
        <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
          <Target size={24} color="#3b82f6" style={{ marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 8px 0', fontSize: '2rem' }}>{analytics.conversionRate}%</h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Conversion Rate</p>
        </div>
        <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
          <Share2 size={24} color="#8b5cf6" style={{ marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.5rem' }}>{analytics.topTrafficSource}</h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Top Traffic Source</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        {/* Marketing Pixels */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          <h3 style={{ margin: '0 0 24px 0', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>Tracking Pixels</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
            Integrate your event pages directly with your marketing channels. When configured, we automatically fire purchase events to these pixels.
          </p>
          
          <form onSubmit={handleSavePixels} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Meta (Facebook) Pixel ID</label>
              <input 
                type="text" 
                className="input-field" 
                value={pixels.metaPixelId} 
                onChange={e => setPixels({...pixels, metaPixelId: e.target.value})}
                placeholder="e.g. 123456789012345" 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Google Analytics (GA4) Measurement ID</label>
              <input 
                type="text" 
                className="input-field" 
                value={pixels.googleAnalyticsId} 
                onChange={e => setPixels({...pixels, googleAnalyticsId: e.target.value})}
                placeholder="e.g. G-XXXXXXXXXX" 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>TikTok Pixel ID</label>
              <input 
                type="text" 
                className="input-field" 
                value={pixels.tiktokPixelId} 
                onChange={e => setPixels({...pixels, tiktokPixelId: e.target.value})}
                placeholder="e.g. CD01..." 
              />
            </div>
            
            <button type="submit" className="btn-primary" style={{ marginTop: '16px' }}>
              {saved ? 'Saved Successfully!' : 'Save Integrations'}
            </button>
          </form>
        </div>

        {/* Demographics Chart (Simulated) */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          <h3 style={{ margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            <PieChartIcon size={20} />
            Audience Demographics
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
            {Object.entries(analytics.demographics).map(([age, percentage]) => (
              <div key={age}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>{age} years</span>
                  <span style={{ fontWeight: 'bold' }}>{percentage}%</span>
                </div>
                <div style={{ width: '100%', height: '12px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: 'var(--accent)' }}></div>
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ marginTop: '40px', padding: '16px', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#60a5fa' }}>Marketing Insight</h4>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Your audience skews heavily towards 18-24 year olds. Consider increasing your ad spend on TikTok and Instagram Stories for your upcoming events.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
