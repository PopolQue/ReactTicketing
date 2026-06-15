import { Link } from 'react-router-dom';
import { Building2, CalendarDays, PieChart, KeyRound } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function ForVenues() {
  const { t } = useLanguage();

  const benefits = [
    {
      icon: <Building2 size={32} />,
      color: '#6366f1',
      title: t('venueProfiles'),
      description: t('venueProfilesDesc'),
    },
    {
      icon: <CalendarDays size={32} />,
      color: '#c084fc',
      title: t('eventCalendarIntegration'),
      description: t('eventCalendarIntegrationDesc'),
    },
    {
      icon: <PieChart size={32} />,
      color: '#34d399',
      title: t('audienceInsights'),
      description: t('audienceInsightsDesc'),
    },
    {
      icon: <KeyRound size={32} />,
      color: '#f472b6',
      title: t('claimAndManage'),
      description: t('claimAndManageDesc'),
    },
  ];

  const stats = [
    { value: '500+', label: t('venuesListed') },
    { value: '1M+', label: t('attendeesServed') },
    { value: '24/7', label: t('support') },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <section style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '80px 20px 60px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '15%', right: '5%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(69,38,38,0.35) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '0%', width: '45vw', height: '45vw', background: 'radial-gradient(circle, rgba(90,50,50,0.2) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(60px)', zIndex: 0, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '30%', left: '20%', width: '30vw', height: '30vw', background: 'radial-gradient(circle, rgba(52,96,64,0.12) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none' }} />

        <div style={{ textAlign: 'center', zIndex: 1, maxWidth: '800px', animation: 'fadeIn 1s ease-out' }}>
          <span style={{ display: 'inline-block', padding: '6px 16px', borderRadius: '30px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '2px', marginBottom: '24px', border: '1px solid var(--accent)', boxShadow: 'var(--bloom-glow)' }}>
            {t('forVenues')}
          </span>
          <h1 style={{ fontSize: 'clamp(2.8rem, 6vw, 5rem)', margin: '0 0 24px 0', lineHeight: 1.1, fontWeight: 800, letterSpacing: '-2px', textShadow: 'var(--bloom-text)' }}>
            {t('fillEvery')} <br /><span style={{ color: 'var(--accent)' }}>{t('seat')}</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(1.05rem, 2vw, 1.3rem)', marginBottom: '48px', maxWidth: '600px', margin: '0 auto 48px auto', lineHeight: 1.7 }}>
            {t('venuesHeroDesc')}
          </p>

          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/claim" className="btn-primary" style={{ padding: '16px 40px', fontSize: '1.1rem', borderRadius: '30px', textDecoration: 'none' }}>
              {t('claimYourVenue')}
            </Link>
            <a href="#benefits" className="btn-secondary" style={{ padding: '16px 40px', fontSize: '1.1rem', borderRadius: '30px', textDecoration: 'none' }}>
              {t('seeFeatures')}
            </a>
          </div>
        </div>
      </section>

      <section id="benefits" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '100px 20px', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '60px', maxWidth: '600px' }}>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', margin: '0 0 16px 0', fontWeight: 700 }}>{t('yourVenueManaged')}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', margin: 0, lineHeight: 1.6 }}>
            {t('yourVenueManagedDesc')}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '28px', width: '100%', maxWidth: '1100px' }}>
          {benefits.map((b) => (
            <div
              key={b.title}
              className="glass-panel"
              style={{ padding: '36px', textAlign: 'center', transition: 'transform 0.3s cubic-bezier(0.175,0.885,0.32,1.275), box-shadow 0.3s ease', cursor: 'default' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.5), var(--bloom-glow)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = ''; }}
            >
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: `${b.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', color: b.color }}>
                {b.icon}
              </div>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1.25rem', fontWeight: 600 }}>{b.title}</h3>
              <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6, fontSize: '0.95rem' }}>{b.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ display: 'flex', justifyContent: 'center', padding: '20px 20px 80px', zIndex: 1 }}>
        <div className="glass-panel" style={{ display: 'flex', gap: '60px', padding: '48px 64px', flexWrap: 'wrap', justifyContent: 'center', borderTop: '1px solid var(--accent)' }}>
          {stats.map((s) => (
            <div key={s.label} style={{ textAlign: 'center', minWidth: '120px' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1px', textShadow: 'var(--bloom-text)' }}>{s.value}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '100px 20px 120px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '0%', left: '20%', width: '60vw', height: '40vw', background: 'radial-gradient(circle, rgba(69,38,38,0.25) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none' }} />
        <div style={{ textAlign: 'center', zIndex: 1, maxWidth: '600px' }}>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', margin: '0 0 16px 0', fontWeight: 700, textShadow: 'var(--bloom-text)' }}>
            {t('putYourVenueOnMap')}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', lineHeight: 1.6, margin: '0 0 40px 0' }}>
            {t('putYourVenueOnMapDesc')}
          </p>
          <Link to="/claim" className="btn-primary" style={{ padding: '16px 48px', fontSize: '1.15rem', borderRadius: '30px', textDecoration: 'none' }}>
            {t('claimYourVenue')}
          </Link>
        </div>
      </section>
    </div>
  );
}
