import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: '100vh',
    padding: '80px 20px 60px',
    position: 'relative',
    overflow: 'hidden',
  },
  bloomTopRight: {
    position: 'absolute',
    top: '-120px',
    right: '-80px',
    width: '500px',
    height: '500px',
    background: 'radial-gradient(circle, rgba(69, 38, 38, 0.25) 0%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  bloomBottomLeft: {
    position: 'absolute',
    bottom: '-100px',
    left: '-60px',
    width: '400px',
    height: '400px',
    background: 'radial-gradient(circle, rgba(52, 96, 64, 0.15) 0%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
    position: 'relative',
    zIndex: 1,
  },
  pageLabel: {
    display: 'inline-block',
    fontSize: '0.75rem',
    fontWeight: 600,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: 'var(--accent)',
    marginBottom: '12px',
    padding: '4px 12px',
    borderRadius: '20px',
    border: '1px solid rgba(52, 96, 64, 0.3)',
    background: 'rgba(52, 96, 64, 0.08)',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 700,
    marginBottom: '8px',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '1.05rem',
    marginBottom: '40px',
    lineHeight: 1.6,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '24px',
  },
  card: {
    padding: '32px',
    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
  },
  cardIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    marginBottom: '16px',
    fontSize: '1.2rem',
  },
  cardTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    marginBottom: '4px',
    color: 'var(--text-primary)',
  },
  cardCount: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    marginBottom: '20px',
    opacity: 0.7,
  },
  linkList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  linkItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    borderRadius: '8px',
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    fontSize: '0.9rem',
    transition: 'all 0.2s ease',
    border: '1px solid transparent',
  },
  linkItemHover: {
    background: 'rgba(255, 255, 255, 0.04)',
    color: 'var(--text-primary)',
    textShadow: '0 0 8px rgba(255, 255, 255, 0.8), 0 0 16px rgba(69, 38, 38, 0.8), 0 0 24px rgba(69, 38, 38, 0.6)',
    border: '1px solid var(--border)',
  },
  linkDot: {
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    background: 'var(--accent)',
    flexShrink: 0,
  },
  footer: {
    textAlign: 'center' as const,
    marginTop: '48px',
    color: 'var(--text-secondary)',
    fontSize: '0.8rem',
    opacity: 0.6,
  },
};

function SitemapLink({ label, to }: { label: string; to: string }) {
  const [hovered, setHovered] = useState(false);

  return (
    <li>
      <Link
        to={to}
        style={{
          ...styles.linkItem,
          ...(hovered ? styles.linkItemHover : {}),
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <span style={styles.linkDot} />
        {label}
      </Link>
    </li>
  );
}

export default function Sitemap() {
  const { t } = useLanguage();

  const categories = [
    {
      title: t('marketplace'),
      icon: '🎫',
      iconBg: 'rgba(99, 102, 241, 0.15)',
      links: [
        { label: t('home'), to: '/' },
        { label: t('discoverEvents'), to: '/discover' },
        { label: t('resaleMarket_nav'), to: '/resale' },
        { label: t('blog'), to: '/blogs' },
        { label: t('myWallet'), to: '/wallet' },
        { label: t('claimPortal'), to: '/claim' },
      ],
    },
    {
      title: t('organizerPortal'),
      icon: '📋',
      iconBg: 'rgba(52, 96, 64, 0.15)',
      links: [
        { label: t('dashboard'), to: '/organizer' },
        { label: t('myEvents'), to: '/organizer/events' },
        { label: t('createEvent'), to: '/organizer/events/new' },
        { label: t('scanTickets'), to: '/organizer/scan' },
        { label: t('artists_nav'), to: '/organizer/artists' },
        { label: t('blogPosts'), to: '/organizer/blogs' },
        { label: t('marketingAnalytics'), to: '/organizer/marketing' },
        { label: t('settings'), to: '/organizer/settings' },
      ],
    },
    {
      title: t('artistPortal'),
      icon: '🎤',
      iconBg: 'rgba(236, 72, 153, 0.15)',
      links: [
        { label: t('dashboard'), to: '/artist' },
        { label: t('editProfile'), to: '/artist/edit' },
      ],
    },
    {
      title: t('venuePortal'),
      icon: '🏟️',
      iconBg: 'rgba(245, 158, 11, 0.15)',
      links: [
        { label: t('dashboard'), to: '/venue' },
      ],
    },
    {
      title: t('supportAdmin'),
      icon: '🛡️',
      iconBg: 'rgba(14, 165, 233, 0.15)',
      links: [
        { label: t('contactSupport'), to: '/support' },
        { label: t('loginRegister'), to: '/auth' },
        { label: t('adminPortal'), to: '/admin' },
        { label: t('eventReview'), to: '/admin/events' },
        { label: t('supportDesk'), to: '/admin/support' },
        { label: t('entityClaims'), to: '/admin/claims' },
      ],
    },
    {
      title: t('legal_nav'),
      icon: '⚖️',
      iconBg: 'rgba(139, 92, 246, 0.15)',
      links: [
        { label: t('imprint_nav'), to: '/imprint' },
        { label: t('privacyPolicy_nav'), to: '/privacy' },
        { label: t('termsOfService_nav'), to: '/terms' },
        { label: t('sitemap_nav'), to: '/sitemap' },
      ],
    },
  ];

  return (
    <div style={styles.wrapper}>
      <div style={styles.bloomTopRight} />
      <div style={styles.bloomBottomLeft} />

      <div style={styles.container}>
        <div style={styles.pageLabel}>{t('navigation')}</div>
        <h1 style={styles.title}>{t('sitemapTitle')}</h1>
        <p style={styles.subtitle}>
          {t('sitemapSubtitle')}
        </p>

        <div style={styles.grid}>
          {categories.map((cat) => (
            <div key={cat.title} className="glass-panel" style={styles.card}>
              <div style={{ ...styles.cardIcon, background: cat.iconBg }}>
                {cat.icon}
              </div>
              <h2 style={styles.cardTitle}>{cat.title}</h2>
              <p style={styles.cardCount}>
                {cat.links.length} {t('page')}{cat.links.length !== 1 ? 's' : ''}
              </p>
              <ul style={styles.linkList}>
                {cat.links.map((link) => (
                  <SitemapLink key={link.to} label={link.label} to={link.to} />
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p style={styles.footer}>
          © {new Date().getFullYear()} Admit GmbH. {t('allRightsReserved')}.
        </p>
      </div>
    </div>
  );
}
