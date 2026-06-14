import { Link } from 'react-router-dom';

const footerLinkGroups = [
  {
    title: 'Platform',
    links: [
      { label: 'For Artists', to: '/for-artists' },
      { label: 'For Fans', to: '/for-fans' },
      { label: 'For Organizers', to: '/for-organizers' },
      { label: 'For Venues', to: '/for-venues' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Imprint', to: '/imprint' },
      { label: 'Privacy', to: '/privacy' },
      { label: 'Terms', to: '/terms' },
      { label: 'Sitemap', to: '/sitemap' },
    ],
  },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      style={{
        position: 'relative',
        borderTop: '1px solid var(--border)',
        background: 'linear-gradient(180deg, transparent 0%, rgba(1, 15, 20, 0.95) 40%)',
        overflow: 'hidden',
      }}
    >
      {/* Subtle bloom glow behind the footer */}
      <div
        style={{
          position: 'absolute',
          top: '-60px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '60vw',
          height: '120px',
          background:
            'radial-gradient(ellipse at center, rgba(69,38,38,0.25) 0%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '64px 40px 40px',
          display: 'grid',
          gridTemplateColumns: 'minmax(200px, 1.4fr) repeat(2, minmax(140px, 1fr))',
          gap: '48px',
        }}
      >
        {/* Brand column */}
        <div>
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h3
              style={{
                margin: '0 0 12px 0',
                fontSize: '1.4rem',
                letterSpacing: '-0.5px',
                fontWeight: 700,
              }}
            >
              Admit{' '}
              <span style={{ color: 'var(--accent)' }}>Marketplace</span>
            </h3>
          </Link>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              lineHeight: 1.6,
              margin: '0 0 20px 0',
              maxWidth: '280px',
            }}
          >
            The future of event ticketing. Discover, buy, and resell tickets on the
            world's most elegant marketplace.
          </p>
        </div>

        {/* Link columns */}
        {footerLinkGroups.map((group) => (
          <div key={group.title}>
            <h4
              style={{
                margin: '0 0 20px 0',
                fontSize: '0.8rem',
                fontWeight: 700,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                color: 'var(--text-secondary)',
              }}
            >
              {group.title}
            </h4>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {group.links.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    style={{
                      color: 'var(--text-secondary)',
                      textDecoration: 'none',
                      fontSize: '0.95rem',
                      transition: 'color 0.2s, text-shadow 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--text-primary)';
                      e.currentTarget.style.textShadow = 'var(--bloom-text)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-secondary)';
                      e.currentTarget.style.textShadow = 'none';
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '20px 40px',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <span
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.85rem',
          }}
        >
          © {currentYear} Admit. All rights reserved.
        </span>
        <span
          style={{
            color: 'rgba(255,255,255,0.15)',
            fontSize: '0.8rem',
            letterSpacing: '0.5px',
          }}
        >
          admit.events
        </span>
      </div>
    </footer>
  );
}
