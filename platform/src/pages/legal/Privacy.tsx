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
    marginBottom: '12px',
    lineHeight: 1.6,
  },
  lastUpdated: {
    display: 'inline-block',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    background: 'rgba(255, 255, 255, 0.04)',
    padding: '6px 14px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    marginBottom: '40px',
  },
  panel: {
    padding: '48px',
  },
  section: {
    marginBottom: '40px',
  },
  sectionNumber: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: 'rgba(52, 96, 64, 0.15)',
    border: '1px solid rgba(52, 96, 64, 0.3)',
    color: 'var(--accent)',
    fontSize: '0.8rem',
    fontWeight: 700,
    marginRight: '12px',
    flexShrink: 0,
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
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
    margin: '0 0 12px 0',
  },
  list: {
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
    lineHeight: 1.8,
    paddingLeft: '20px',
    margin: '12px 0',
  },
  listItem: {
    marginBottom: '6px',
  },
  highlight: {
    color: 'var(--text-primary)',
    fontWeight: 500,
  },
  link: {
    color: 'var(--accent)',
    textDecoration: 'none',
  },
  footer: {
    textAlign: 'center' as const,
    marginTop: '32px',
    color: 'var(--text-secondary)',
    fontSize: '0.8rem',
    opacity: 0.6,
  },
};

interface SectionProps {
  number: number;
  title: string;
  children: React.ReactNode;
}

function Section({ number, title, children }: SectionProps) {
  return (
    <div style={styles.section}>
      <h2 style={styles.sectionTitle}>
        <span style={styles.sectionNumber}>{number}</span>
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function Privacy() {
  return (
    <div style={styles.wrapper}>
      <div style={styles.bloomTopRight} />
      <div style={styles.bloomBottomLeft} />

      <div style={styles.container}>
        <div style={styles.pageLabel}>Legal</div>
        <h1 style={styles.title}>Privacy Policy</h1>
        <p style={styles.subtitle}>
          How we collect, use, and protect your personal data.
        </p>
        <div style={styles.lastUpdated}>Last updated: June 1, 2026</div>

        <div className="glass-panel" style={styles.panel}>
          <Section number={1} title="Data Controller">
            <p style={styles.text}>
              The data controller responsible for the processing of your personal data on this platform is:
            </p>
            <p style={styles.text}>
              <span style={styles.highlight}>Admit GmbH</span><br />
              Friedrichstraße 123, 10117 Berlin, Germany<br />
              Email:{' '}
              <a href="mailto:privacy@admit.events" style={styles.link}>
                privacy@admit.events
              </a>
            </p>
          </Section>

          <Section number={2} title="Data We Collect">
            <p style={styles.text}>
              We collect personal data that you provide directly when using our platform:
            </p>
            <ul style={styles.list}>
              <li style={styles.listItem}>
                <span style={styles.highlight}>Account Data:</span> Name, email address, password (hashed), and profile information when you register an account.
              </li>
              <li style={styles.listItem}>
                <span style={styles.highlight}>Transaction Data:</span> Billing address, payment method details (processed securely via Stripe), and purchase history.
              </li>
              <li style={styles.listItem}>
                <span style={styles.highlight}>Usage Data:</span> Log data, IP address, browser type, device information, pages viewed, and interactions with the platform.
              </li>
              <li style={styles.listItem}>
                <span style={styles.highlight}>Communication Data:</span> Messages sent through our support system and feedback provided.
              </li>
            </ul>
          </Section>

          <Section number={3} title="Cookies & Tracking">
            <p style={styles.text}>
              We use cookies and similar technologies to maintain your session, remember your preferences, and analyze platform usage. The following types of cookies are used:
            </p>
            <ul style={styles.list}>
              <li style={styles.listItem}>
                <span style={styles.highlight}>Essential Cookies:</span> Required for the platform to function properly, including authentication and security.
              </li>
              <li style={styles.listItem}>
                <span style={styles.highlight}>Functional Cookies:</span> Remember your preferences such as language and display settings.
              </li>
              <li style={styles.listItem}>
                <span style={styles.highlight}>Analytics Cookies:</span> Help us understand how visitors interact with our platform to improve user experience.
              </li>
            </ul>
            <p style={styles.text}>
              You can manage cookie preferences through your browser settings. Disabling essential cookies may affect platform functionality.
            </p>
          </Section>

          <Section number={4} title="Third-Party Services">
            <p style={styles.text}>
              We rely on trusted third-party services to operate our platform:
            </p>
            <ul style={styles.list}>
              <li style={styles.listItem}>
                <span style={styles.highlight}>Supabase:</span> Provides our backend infrastructure including authentication, database, and file storage. Data is processed in EU-based data centers. Supabase complies with GDPR requirements.
              </li>
              <li style={styles.listItem}>
                <span style={styles.highlight}>Stripe:</span> Handles all payment processing. We never store your full credit card details on our servers. Stripe is PCI DSS Level 1 certified. For more information, see{' '}
                <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" style={styles.link}>
                  Stripe's Privacy Policy
                </a>.
              </li>
            </ul>
          </Section>

          <Section number={5} title="Your Rights">
            <p style={styles.text}>
              Under GDPR and applicable data protection laws, you have the following rights:
            </p>
            <ul style={styles.list}>
              <li style={styles.listItem}>
                <span style={styles.highlight}>Right of Access:</span> Request a copy of the personal data we hold about you.
              </li>
              <li style={styles.listItem}>
                <span style={styles.highlight}>Right to Rectification:</span> Request correction of inaccurate personal data.
              </li>
              <li style={styles.listItem}>
                <span style={styles.highlight}>Right to Erasure:</span> Request deletion of your personal data ("right to be forgotten").
              </li>
              <li style={styles.listItem}>
                <span style={styles.highlight}>Right to Restrict Processing:</span> Request limitation on how we use your data.
              </li>
              <li style={styles.listItem}>
                <span style={styles.highlight}>Right to Data Portability:</span> Receive your data in a structured, commonly used format.
              </li>
              <li style={styles.listItem}>
                <span style={styles.highlight}>Right to Object:</span> Object to the processing of your data for certain purposes.
              </li>
            </ul>
            <p style={styles.text}>
              To exercise any of these rights, contact us at{' '}
              <a href="mailto:privacy@admit.events" style={styles.link}>
                privacy@admit.events
              </a>. We will respond within 30 days.
            </p>
          </Section>

          <Section number={6} title="Data Retention">
            <p style={styles.text}>
              We retain your personal data only for as long as necessary to fulfill the purposes for which it was collected:
            </p>
            <ul style={styles.list}>
              <li style={styles.listItem}>
                <span style={styles.highlight}>Account Data:</span> Retained while your account is active and for 30 days after deletion request.
              </li>
              <li style={styles.listItem}>
                <span style={styles.highlight}>Transaction Data:</span> Retained for 10 years as required by German commercial and tax law (§ 147 AO, § 257 HGB).
              </li>
              <li style={styles.listItem}>
                <span style={styles.highlight}>Usage & Log Data:</span> Retained for up to 90 days for security and debugging purposes.
              </li>
              <li style={styles.listItem}>
                <span style={styles.highlight}>Support Data:</span> Retained for 2 years after ticket resolution.
              </li>
            </ul>
          </Section>

          <Section number={7} title="Contact & Complaints">
            <p style={{ ...styles.text, marginBottom: 0 }}>
              If you have questions about this privacy policy or wish to file a complaint, you can reach our Data Protection Officer at{' '}
              <a href="mailto:dpo@admit.events" style={styles.link}>
                dpo@admit.events
              </a>.
              You also have the right to lodge a complaint with the Berlin Commissioner for Data Protection and Freedom of Information
              (Berliner Beauftragte für Datenschutz und Informationsfreiheit).
            </p>
          </Section>
        </div>

        <p style={styles.footer}>
          © {new Date().getFullYear()} Admit GmbH. All rights reserved.
        </p>
      </div>
    </div>
  );
}
