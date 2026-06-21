import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { ShieldCheck, RefreshCw, Palette } from 'lucide-react';
import HalftoneImage from '../../components/HalftoneImage';
import { useLanguage } from '../../contexts/LanguageContext';

const heroImages = [
  '/images/gornostai_nastya-concert-1941578_1920.jpg',
  '/images/mikewallimages-concert-3084876_1920.jpg',
  '/images/ostrovsky-festival-3466251_1920.jpg',
  '/images/thekaleidoscope-concert-3387324_1920.jpg',
];

export default function Home() {
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (currentUser) setUser(currentUser);
    }
    checkUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <div
      className="landing-page"
      style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* HERO SECTION */}
        <section
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '85vh',
            padding: '60px 20px',
            overflow: 'hidden',
          }}
        >
          {/* Background glow effects matching the new bloom aesthetic */}
          <div
            style={{
              position: 'absolute',
              top: '10%',
              left: '5%',
              width: '50vw',
              height: '50vw',
              background: 'radial-gradient(circle, rgba(69,38,38,0.3) 0%, rgba(0,0,0,0) 70%)',
              filter: 'blur(80px)',
              zIndex: 0,
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '0%',
              right: '0%',
              width: '40vw',
              height: '40vw',
              background: 'radial-gradient(circle, rgba(90,50,50,0.2) 0%, rgba(0,0,0,0) 70%)',
              filter: 'blur(60px)',
              zIndex: 0,
              pointerEvents: 'none',
            }}
          />

          {/* Horizontal Hero Image Background Halftone Carousel */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 0,
            }}
          >
            <HalftoneImage
              srcs={heroImages}
              dotSpacing={12}
              dotColor="#a2aa5c"
              intervalMs={4000} // Increased interval for more "stillness"
              transitionMs={800} // Slightly longer transition for elegance
              baseRadiusMultiplier={0.2}
              style={{ width: '100%', height: '100%', opacity: 0.8 }}
            />
          </div>

          <div
            style={{
              textAlign: 'center',
              zIndex: 1,
              maxWidth: '800px',
              animation: 'fadeIn 1s ease-out',
              position: 'relative',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                padding: '6px 16px',
                borderRadius: '30px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                fontWeight: 600,
                letterSpacing: '1px',
                marginBottom: '24px',
                border: '1px solid var(--accent)',
                boxShadow: 'var(--bloom-glow)',
              }}
            >
              {t('marketplace.home.hero.badge')}
            </span>
            <h1
              style={{
                fontSize: 'clamp(3rem, 6vw, 5.5rem)',
                margin: '0 0 24px 0',
                lineHeight: 1.1,
                fontWeight: 800,
                letterSpacing: '-2px',
                textShadow: 'var(--bloom-text)',
              }}
            >
              {t('marketplace.home.hero.title1')} <br />{' '}
              <span style={{ color: 'var(--accent)' }}>{t('marketplace.home.hero.title2')}</span>
            </h1>
            <p
              style={{
                color: 'var(--text-primary)',
                fontSize: 'clamp(1.1rem, 2vw, 1.4rem)',
                marginBottom: '48px',
                maxWidth: '700px',
                margin: '0 auto 48px auto',
                lineHeight: 1.6,
                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
              }}
            >
              {t('marketplace.home.hero.subtitle')}
            </p>

            <div
              style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}
            >
              <Link
                to="/discover"
                className="btn-primary"
                style={{
                  padding: '16px 40px',
                  fontSize: '1.2rem',
                  borderRadius: '30px',
                  transition: 'transform 0.2s',
                  boxShadow: '0 10px 30px -10px rgba(99,102,241,0.5)',
                }}
              >
                {t('marketplace.home.hero.cta.discover')}
              </Link>
              <Link
                to="/organizer"
                className="btn-secondary"
                style={{ padding: '16px 40px', fontSize: '1.2rem', borderRadius: '30px' }}
              >
                {t('marketplace.home.hero.cta.host')}
              </Link>
            </div>
          </div>
        </section>

        {/* CONTENT SECTION */}
        <section
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '80px 20px',
            zIndex: 1,
          }}
        >
          {/* Feature Highlights */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '32px',
              width: '100%',
              maxWidth: '1200px',
            }}
          >
            <div
              className="glass-panel"
              style={{ padding: '32px', textAlign: 'center', transition: 'transform 0.3s' }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-10px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
            >
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(99,102,241,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px auto',
                  color: '#6366f1',
                }}
              >
                <ShieldCheck size={32} />
              </div>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1.3rem' }}>
                {t('marketplace.home.features.1.title')}
              </h3>
              <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                {t('marketplace.home.features.1.desc')}
              </p>
            </div>
            <div
              className="glass-panel"
              style={{ padding: '32px', textAlign: 'center', transition: 'transform 0.3s' }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-10px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
            >
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(192,132,252,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px auto',
                  color: '#c084fc',
                }}
              >
                <RefreshCw size={32} />
              </div>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1.3rem' }}>
                {t('marketplace.home.features.2.title')}
              </h3>
              <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                {t('marketplace.home.features.2.desc')}
              </p>
            </div>
            <div
              className="glass-panel"
              style={{ padding: '32px', textAlign: 'center', transition: 'transform 0.3s' }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-10px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
            >
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(52,211,153,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px auto',
                  color: '#34d399',
                }}
              >
                <Palette size={32} />
              </div>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1.3rem' }}>
                {t('marketplace.home.features.3.title')}
              </h3>
              <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                {t('marketplace.home.features.3.desc')}
              </p>
            </div>
          </div>

          {/* Creator Features Section */}
          <div style={{ marginTop: '120px', width: '100%', maxWidth: '1200px', zIndex: 1 }}>
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
              <h2 style={{ fontSize: '2.5rem', margin: '0 0 16px 0' }}>
                {t('marketplace.home.creators.title')}
              </h2>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '1.2rem',
                  maxWidth: '600px',
                  margin: '0 auto',
                }}
              >
                {t('marketplace.home.creators.subtitle')}
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '32px',
              }}
            >
              <div
                className="glass-panel"
                style={{ padding: '40px', borderTop: '4px solid #6366f1' }}
              >
                <h3 style={{ fontSize: '1.5rem', marginBottom: '16px', color: 'white' }}>
                  {t('marketplace.home.creators.1.title')}
                </h3>
                <p
                  style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}
                >
                  {t('marketplace.home.creators.1.desc')}
                </p>
              </div>

              <div
                className="glass-panel"
                style={{ padding: '40px', borderTop: '4px solid #c084fc' }}
              >
                <h3 style={{ fontSize: '1.5rem', marginBottom: '16px', color: 'white' }}>
                  {t('marketplace.home.creators.2.title')}
                </h3>
                <p
                  style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}
                >
                  {t('marketplace.home.creators.2.desc')}
                </p>
              </div>

              <div
                className="glass-panel"
                style={{ padding: '40px', borderTop: '4px solid #10b981' }}
              >
                <h3 style={{ fontSize: '1.5rem', marginBottom: '16px', color: 'white' }}>
                  {t('marketplace.home.creators.3.title')}
                </h3>
                <p
                  style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}
                >
                  {t('marketplace.home.creators.3.desc')}
                </p>
                <Link
                  to="/claim"
                  className="btn-secondary"
                  style={{ display: 'inline-block', textDecoration: 'none', fontSize: '0.9rem' }}
                >
                  {t('marketplace.home.creators.3.cta')}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
