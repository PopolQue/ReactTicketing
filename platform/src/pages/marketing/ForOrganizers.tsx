import { Link } from 'react-router-dom';
import { Layers, Tag, ScanLine, Palette } from 'lucide-react';

const benefits = [
  {
    icon: <Layers size={32} />,
    color: '#6366f1',
    title: 'Custom Ticket Tiers',
    description: 'Create unlimited ticket types — from early-bird specials to VIP packages. Set individual pricing, capacity limits, and sale windows for each tier.',
  },
  {
    icon: <Tag size={32} />,
    color: '#c084fc',
    title: 'Promo Codes',
    description: 'Drive sales with percentage or fixed-amount discount codes. Create early-bird campaigns, influencer partnerships, and exclusive access offers.',
  },
  {
    icon: <ScanLine size={32} />,
    color: '#34d399',
    title: 'Real-Time Scan Analytics',
    description: 'Track check-ins as they happen with live attendance dashboards. See scan rates, peak entry times, and gate-by-gate breakdowns in real time.',
  },
  {
    icon: <Palette size={32} />,
    color: '#f472b6',
    title: 'Theme Customization',
    description: 'Brand your event pages with custom colors, cover images, and layouts. Create a cohesive visual experience that matches your event\u0027s identity.',
  },
];

const stats = [
  { value: '2K+', label: 'Events Hosted' },
  { value: '98%', label: 'Satisfaction' },
  { value: '<5min', label: 'Setup Time' },
];

export default function ForOrganizers() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* HERO */}
      <section style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '80px 20px 60px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '0%', left: '10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(69,38,38,0.35) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '0%', right: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(90,50,50,0.2) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(60px)', zIndex: 0, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '60%', left: '50%', width: '20vw', height: '20vw', background: 'radial-gradient(circle, rgba(52,96,64,0.15) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none' }} />

        <div style={{ textAlign: 'center', zIndex: 1, maxWidth: '800px', animation: 'fadeIn 1s ease-out' }}>
          <span style={{ display: 'inline-block', padding: '6px 16px', borderRadius: '30px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '2px', marginBottom: '24px', border: '1px solid var(--accent)', boxShadow: 'var(--bloom-glow)' }}>
            FOR ORGANIZERS
          </span>
          <h1 style={{ fontSize: 'clamp(2.8rem, 6vw, 5rem)', margin: '0 0 24px 0', lineHeight: 1.1, fontWeight: 800, letterSpacing: '-2px', textShadow: 'var(--bloom-text)' }}>
            Run Events <br /><span style={{ color: 'var(--accent)' }}>Your Way</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(1.05rem, 2vw, 1.3rem)', marginBottom: '48px', maxWidth: '600px', margin: '0 auto 48px auto', lineHeight: 1.7 }}>
            Full control over ticketing, real-time analytics, and audience engagement — everything you need to create unforgettable events, your way.
          </p>

          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/organizer" className="btn-primary" style={{ padding: '16px 40px', fontSize: '1.1rem', borderRadius: '30px', textDecoration: 'none' }}>
              Start Organizing
            </Link>
            <a href="#benefits" className="btn-secondary" style={{ padding: '16px 40px', fontSize: '1.1rem', borderRadius: '30px', textDecoration: 'none' }}>
              See Features
            </a>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section id="benefits" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '100px 20px', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '60px', maxWidth: '600px' }}>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', margin: '0 0 16px 0', fontWeight: 700 }}>Powerful Tools, Zero Hassle</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', margin: 0, lineHeight: 1.6 }}>
            From ticket creation to door scanning, our platform handles the complexity so you can focus on creating incredible experiences.
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

      {/* STATS */}
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

      {/* CTA */}
      <section style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '100px 20px 120px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '0%', left: '20%', width: '60vw', height: '40vw', background: 'radial-gradient(circle, rgba(69,38,38,0.25) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none' }} />
        <div style={{ textAlign: 'center', zIndex: 1, maxWidth: '600px' }}>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', margin: '0 0 16px 0', fontWeight: 700, textShadow: 'var(--bloom-text)' }}>
            Launch Your Next Event Today
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', lineHeight: 1.6, margin: '0 0 40px 0' }}>
            Set up your event in minutes, not days. Our streamlined tools get you from idea to ticket sales faster than any other platform.
          </p>
          <Link to="/organizer" className="btn-primary" style={{ padding: '16px 48px', fontSize: '1.15rem', borderRadius: '30px', textDecoration: 'none' }}>
            Create Your Event
          </Link>
        </div>
      </section>
    </div>
  );
}
