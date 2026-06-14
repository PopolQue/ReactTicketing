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

export default function Terms() {
  return (
    <div style={styles.wrapper}>
      <div style={styles.bloomTopRight} />
      <div style={styles.bloomBottomLeft} />

      <div style={styles.container}>
        <div style={styles.pageLabel}>Legal</div>
        <h1 style={styles.title}>Terms of Service</h1>
        <p style={styles.subtitle}>
          Please read these terms carefully before using the Admit platform.
        </p>
        <div style={styles.lastUpdated}>Last updated: June 1, 2026</div>

        <div className="glass-panel" style={styles.panel}>
          <Section number={1} title="Acceptance of Terms">
            <p style={styles.text}>
              By accessing or using the Admit platform ("Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Platform. These Terms constitute a legally binding agreement between you and Admit GmbH.
            </p>
            <p style={styles.text}>
              We reserve the right to modify these Terms at any time. Continued use of the Platform after changes constitutes acceptance of the updated Terms. We will notify registered users of material changes via email.
            </p>
          </Section>

          <Section number={2} title="Account Registration">
            <p style={styles.text}>
              To access certain features of the Platform, you must create an account. When registering, you agree to:
            </p>
            <ul style={styles.list}>
              <li style={styles.listItem}>Provide accurate, current, and complete information during registration.</li>
              <li style={styles.listItem}>Maintain the security of your password and account credentials.</li>
              <li style={styles.listItem}>Accept responsibility for all activities that occur under your account.</li>
              <li style={styles.listItem}>Notify us immediately of any unauthorized use of your account.</li>
            </ul>
            <p style={styles.text}>
              You must be at least 16 years of age to create an account. We reserve the right to suspend or terminate accounts that violate these Terms.
            </p>
          </Section>

          <Section number={3} title="Ticket Purchases">
            <p style={styles.text}>
              When purchasing tickets through the Platform, you enter into a contract with the event organizer. Admit acts as an intermediary facilitating the transaction. Key terms:
            </p>
            <ul style={styles.list}>
              <li style={styles.listItem}>All prices are displayed in Euros (€) and include applicable taxes unless otherwise stated.</li>
              <li style={styles.listItem}>A service fee may be added at checkout, which is clearly displayed before payment.</li>
              <li style={styles.listItem}>Tickets are delivered electronically to your Admit wallet upon successful payment.</li>
              <li style={styles.listItem}>Each ticket contains a unique QR code and is non-duplicable.</li>
              <li style={styles.listItem}>Payment processing is handled securely by Stripe. Admit does not store your payment card details.</li>
            </ul>
          </Section>

          <Section number={4} title="Refunds & Cancellations">
            <p style={styles.text}>
              Refund policies are set by the event organizer and may vary. The following general rules apply:
            </p>
            <ul style={styles.list}>
              <li style={styles.listItem}>
                <span style={styles.highlight}>Event Cancellation:</span> If an event is cancelled by the organizer, you are entitled to a full refund including service fees.
              </li>
              <li style={styles.listItem}>
                <span style={styles.highlight}>Event Postponement:</span> Your ticket remains valid for the rescheduled date. Refunds may be requested within 14 days of the announcement.
              </li>
              <li style={styles.listItem}>
                <span style={styles.highlight}>Voluntary Cancellation:</span> Refunds for voluntary cancellations depend on the organizer's policy. Service fees are non-refundable.
              </li>
              <li style={styles.listItem}>
                <span style={styles.highlight}>No-Show:</span> No refunds are issued for failure to attend an event.
              </li>
            </ul>
            <p style={styles.text}>
              Refunds are processed to the original payment method within 5–10 business days.
            </p>
          </Section>

          <Section number={5} title="Resale Market">
            <p style={styles.text}>
              The Platform provides a peer-to-peer resale marketplace for tickets. The following rules apply:
            </p>
            <ul style={styles.list}>
              <li style={styles.listItem}>Tickets may only be resold through the official Admit resale marketplace.</li>
              <li style={styles.listItem}>Resale prices may not exceed the original purchase price plus a maximum markup set by the organizer.</li>
              <li style={styles.listItem}>Admit charges a resale service fee on completed transactions.</li>
              <li style={styles.listItem}>The original ticket is automatically invalidated and a new ticket is issued to the buyer.</li>
              <li style={styles.listItem}>Organizers may disable resale for specific events at their discretion.</li>
            </ul>
          </Section>

          <Section number={6} title="Prohibited Conduct">
            <p style={styles.text}>
              You agree not to engage in any of the following activities:
            </p>
            <ul style={styles.list}>
              <li style={styles.listItem}>Using the Platform for any unlawful purpose or in violation of applicable laws.</li>
              <li style={styles.listItem}>Attempting to resell tickets outside the official Admit resale marketplace.</li>
              <li style={styles.listItem}>Using bots, scripts, or automated tools to purchase tickets in bulk.</li>
              <li style={styles.listItem}>Creating false or misleading event listings.</li>
              <li style={styles.listItem}>Impersonating another person, organization, or Admit staff.</li>
              <li style={styles.listItem}>Interfering with the Platform's security features or infrastructure.</li>
              <li style={styles.listItem}>Scraping, harvesting, or collecting data from the Platform without authorization.</li>
            </ul>
            <p style={styles.text}>
              Violation of these rules may result in immediate account suspension, legal action, and reporting to law enforcement.
            </p>
          </Section>

          <Section number={7} title="Limitation of Liability">
            <p style={styles.text}>
              To the maximum extent permitted by law:
            </p>
            <ul style={styles.list}>
              <li style={styles.listItem}>Admit provides the Platform "as is" without warranties of any kind, express or implied.</li>
              <li style={styles.listItem}>Admit is not liable for event cancellations, postponements, or changes made by organizers.</li>
              <li style={styles.listItem}>Admit's total liability to you shall not exceed the amount you paid in service fees in the 12 months preceding the claim.</li>
              <li style={styles.listItem}>Admit is not liable for indirect, incidental, special, or consequential damages.</li>
            </ul>
            <p style={styles.text}>
              Nothing in these Terms limits liability for fraud, personal injury caused by negligence, or any other liability that cannot be excluded by law.
            </p>
          </Section>

          <Section number={8} title="Governing Law & Jurisdiction">
            <p style={{ ...styles.text, marginBottom: 0 }}>
              These Terms are governed by and construed in accordance with the laws of the Federal Republic of Germany, without regard to conflict of law provisions. Any disputes arising from or relating to these Terms shall be subject to the exclusive jurisdiction of the courts of Berlin, Germany. For consumers within the European Union, mandatory consumer protection provisions of your country of residence shall apply where required by law.
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
