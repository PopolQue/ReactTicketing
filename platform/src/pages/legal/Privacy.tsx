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
          This privacy policy will explain how our organization uses the personal data we collect from you when you use our website.
        </p>
        <div style={styles.lastUpdated}>Last updated: June 14, 2026</div>

        <div className="glass-panel" style={styles.panel}>

          <Section number={1} title="What data do we collect?">
            <p style={styles.text}>Admit GmbH collects the following data:</p>
            <ul style={styles.list}>
              <li style={styles.listItem}>Personal identification information (Name, email address, phone number, etc.)</li>
              <li style={styles.listItem}>Account Data (password (hashed), and profile information)</li>
              <li style={styles.listItem}>Transaction Data (billing address, payment method details processed securely via Stripe, and purchase history)</li>
              <li style={styles.listItem}>Usage Data (log data, IP address, browser type, device information, pages viewed, and interactions)</li>
            </ul>
          </Section>

          <Section number={2} title="How do we collect your data?">
            <p style={styles.text}>You directly provide Admit GmbH with most of the data we collect. We collect data and process data when you:</p>
            <ul style={styles.list}>
              <li style={styles.listItem}>Register online or place an order for any of our products or services.</li>
              <li style={styles.listItem}>Voluntarily complete a customer survey or provide feedback on any of our message boards or via email.</li>
              <li style={styles.listItem}>Use or view our website via your browser’s cookies.</li>
            </ul>
          </Section>

          <Section number={3} title="How will we use your data?">
            <p style={styles.text}>Admit GmbH collects your data so that we can:</p>
            <ul style={styles.list}>
              <li style={styles.listItem}>Process your order and manage your account.</li>
              <li style={styles.listItem}>Email you with special offers on other products and services we think you might like.</li>
              <li style={styles.listItem}>Evaluate information on your recent visits to our website and how you move around different sections of our website for analytics purposes to understand how people use our website so that we can make it more intuitive.</li>
            </ul>
            <p style={styles.text}>When Admit GmbH processes your order, it may send your data to, and also use the resulting information from, credit reference agencies to prevent fraudulent purchases.</p>
          </Section>

          <Section number={4} title="How do we store your data?">
            <p style={styles.text}>Admit GmbH securely stores your data at EU-based data centers managed by our infrastructure partner, Supabase. We implement strict access controls, encryption, and secure network configurations.</p>
            <p style={styles.text}>Admit GmbH will keep your Account Data while your account is active and for 30 days after a deletion request. Transaction Data is kept for 10 years as required by German commercial and tax law. Usage & Log Data is kept for up to 90 days. Once this time period has expired, we will delete your data by securely purging it from our primary databases and backup systems.</p>
          </Section>

          <Section number={5} title="Marketing">
            <p style={styles.text}>Admit GmbH would like to send you information about products and services of ours that we think you might like.</p>
            <p style={styles.text}>If you have agreed to receive marketing, you may always opt out at a later date.</p>
            <p style={styles.text}>You have the right at any time to stop Admit GmbH from contacting you for marketing purposes.</p>
          </Section>

          <Section number={6} title="What are your data protection rights?">
            <p style={styles.text}>Admit GmbH would like to make sure you are fully aware of all of your data protection rights. Every user is entitled to the following:</p>
            <ul style={styles.list}>
              <li style={styles.listItem}><span style={styles.highlight}>The right to access</span> – You have the right to request Admit GmbH for copies of your personal data. We may charge you a small fee for this service.</li>
              <li style={styles.listItem}><span style={styles.highlight}>The right to rectification</span> – You have the right to request that Admit GmbH correct any information you believe is inaccurate. You also have the right to request Admit GmbH to complete the information you believe is incomplete.</li>
              <li style={styles.listItem}><span style={styles.highlight}>The right to erasure</span> – You have the right to request that Admit GmbH erase your personal data, under certain conditions.</li>
              <li style={styles.listItem}><span style={styles.highlight}>The right to restrict processing</span> – You have the right to request that Admit GmbH restrict the processing of your personal data, under certain conditions.</li>
              <li style={styles.listItem}><span style={styles.highlight}>The right to object to processing</span> – You have the right to object to Admit GmbH’s processing of your personal data, under certain conditions.</li>
              <li style={styles.listItem}><span style={styles.highlight}>The right to data portability</span> – You have the right to request that Admit GmbH transfer the data that we have collected to another organization, or directly to you, under certain conditions.</li>
            </ul>
            <p style={styles.text}>If you make a request, we have one month to respond to you. If you would like to exercise any of these rights, please contact us at our email: <a href="mailto:privacy@admit.events" style={styles.link}>privacy@admit.events</a></p>
          </Section>

          <Section number={7} title="What are cookies?">
            <p style={styles.text}>Cookies are text files placed on your computer to collect standard Internet log information and visitor behavior information. When you visit our websites, we may collect information from you automatically through cookies or similar technology.</p>
            <p style={styles.text}>For further information, visit allaboutcookies.org.</p>
          </Section>

          <Section number={8} title="How do we use cookies?">
            <p style={styles.text}>Admit GmbH uses cookies in a range of ways to improve your experience on our website, including:</p>
            <ul style={styles.list}>
              <li style={styles.listItem}>Keeping you signed in</li>
              <li style={styles.listItem}>Understanding how you use our website</li>
            </ul>
          </Section>

          <Section number={9} title="What types of cookies do we use?">
            <p style={styles.text}>There are a number of different types of cookies, however, our website uses:</p>
            <ul style={styles.list}>
              <li style={styles.listItem}><span style={styles.highlight}>Functionality</span> – Admit GmbH uses these cookies so that we recognize you on our website and remember your previously selected preferences. These could include what language you prefer and location you are in. A mix of first-party and third-party cookies are used.</li>
              <li style={styles.listItem}><span style={styles.highlight}>Advertising</span> – Admit GmbH uses these cookies to collect information about your visit to our website, the content you viewed, the links you followed and information about your browser, device, and your IP address.</li>
            </ul>
          </Section>

          <Section number={10} title="How to manage cookies">
            <p style={styles.text}>You can set your browser not to accept cookies, and the above website tells you how to remove cookies from your browser. However, in a few cases, some of our website features may not function as a result.</p>
          </Section>

          <Section number={11} title="Privacy policies of other websites">
            <p style={styles.text}>The Admit GmbH website contains links to other websites. Our privacy policy applies only to our website, so if you click on a link to another website, you should read their privacy policy. Our payment processor Stripe processes your transactions securely; you can find Stripe's privacy policy at <a href="https://stripe.com/privacy" style={styles.link}>stripe.com/privacy</a>.</p>
          </Section>

          <Section number={12} title="Changes to our privacy policy">
            <p style={styles.text}>Admit GmbH keeps its privacy policy under regular review and places any updates on this web page. This privacy policy was last updated on June 14, 2026.</p>
          </Section>

          <Section number={13} title="How to contact us">
            <p style={styles.text}>If you have any questions about Admit GmbH’s privacy policy, the data we hold on you, or you would like to exercise one of your data protection rights, please do not hesitate to contact us.</p>
            <p style={styles.text}>Email us at: <a href="mailto:privacy@admit.events" style={styles.link}>privacy@admit.events</a></p>
            <p style={styles.text}>Write to us at: Friedrichstraße 123, 10117 Berlin, Germany</p>
          </Section>

          <Section number={14} title="How to contact the appropriate authority">
            <p style={styles.text}>Should you wish to report a complaint or if you feel that Admit GmbH has not addressed your concern in a satisfactory manner, you may contact the Information Commissioner’s Office or the Berliner Beauftragte für Datenschutz und Informationsfreiheit.</p>
            <p style={styles.text}>Email: <a href="mailto:mailbox@datenschutz-berlin.de" style={styles.link}>mailbox@datenschutz-berlin.de</a></p>
            <p style={styles.text}>Address: Friedrichstraße 219, 10969 Berlin, Germany</p>
          </Section>

        </div>

        <p style={styles.footer}>
          © {new Date().getFullYear()} Admit GmbH. All rights reserved.
        </p>
      </div>
    </div>
  );
}
