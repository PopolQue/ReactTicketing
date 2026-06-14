import React from 'react';

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
    maxWidth: '800px',
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
  panel: {
    padding: '48px',
  },
  section: {
    marginBottom: '36px',
  },
  sectionTitle: {
    fontSize: '1.15rem',
    fontWeight: 600,
    marginBottom: '16px',
    paddingBottom: '10px',
    borderBottom: '1px solid var(--border)',
    color: 'var(--text-primary)',
  },
  text: {
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
    lineHeight: 1.8,
    margin: 0,
  },
  label: {
    color: 'var(--text-primary)',
    fontWeight: 500,
    fontSize: '0.95rem',
  },
  link: {
    color: 'var(--accent)',
    textDecoration: 'none',
    transition: 'text-shadow 0.2s ease',
  },
  divider: {
    height: '1px',
    background: 'linear-gradient(to right, transparent, var(--border), transparent)',
    margin: '36px 0',
    border: 'none',
  },
  footer: {
    textAlign: 'center' as const,
    marginTop: '32px',
    color: 'var(--text-secondary)',
    fontSize: '0.8rem',
    opacity: 0.6,
  },
};

export default function Imprint() {
  return (
    <div style={styles.wrapper}>
      <div style={styles.bloomTopRight} />
      <div style={styles.bloomBottomLeft} />

      <div style={styles.container}>
        <div style={styles.pageLabel}>Legal</div>
        <h1 style={styles.title}>Imprint</h1>
        <p style={styles.subtitle}>
          Information in accordance with § 5 TMG (German Telemedia Act)
        </p>

        <div className="glass-panel" style={styles.panel}>
          {/* Company Info */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Company Information</h2>
            <p style={styles.text}>
              <span style={styles.label}>Admit GmbH</span><br />
              Friedrichstraße 123<br />
              10117 Berlin<br />
              Germany
            </p>
          </div>

          {/* Representation */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Represented by</h2>
            <p style={styles.text}>
              <span style={styles.label}>Managing Director:</span> Max Hartmann
            </p>
          </div>

          {/* Contact */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Contact</h2>
            <p style={styles.text}>
              <span style={styles.label}>Email:</span>{' '}
              <a href="mailto:contact@admit.events" style={styles.link}>
                contact@admit.events
              </a>
              <br />
              <span style={styles.label}>Phone:</span> +49 (0) 30 123 456 78
            </p>
          </div>

          {/* Commercial Register */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Commercial Register</h2>
            <p style={styles.text}>
              <span style={styles.label}>Court of Registration:</span> Amtsgericht Charlottenburg, Berlin<br />
              <span style={styles.label}>Registration Number:</span> HRB 234567 B
            </p>
          </div>

          {/* VAT */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>VAT Identification Number</h2>
            <p style={styles.text}>
              VAT ID according to § 27a of the Value Added Tax Act:<br />
              <span style={styles.label}>DE 320 456 789</span>
            </p>
          </div>

          <hr style={styles.divider} />

          {/* Responsible for Content */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              Responsible for Content (§ 55 Abs. 2 RStV)
            </h2>
            <p style={styles.text}>
              Max Hartmann<br />
              Friedrichstraße 123<br />
              10117 Berlin, Germany
            </p>
          </div>

          {/* Dispute Resolution */}
          <div style={{ ...styles.section, marginBottom: 0 }}>
            <h2 style={styles.sectionTitle}>Dispute Resolution</h2>
            <p style={styles.text}>
              The European Commission provides a platform for online dispute
              resolution (OS):{' '}
              <a
                href="https://ec.europa.eu/consumers/odr"
                target="_blank"
                rel="noopener noreferrer"
                style={styles.link}
              >
                https://ec.europa.eu/consumers/odr
              </a>
              <br /><br />
              We are not willing or obliged to participate in dispute resolution
              proceedings before a consumer arbitration board.
            </p>
          </div>
        </div>

        <p style={styles.footer}>
          © {new Date().getFullYear()} Admit GmbH. All rights reserved.
        </p>
      </div>
    </div>
  );
}
