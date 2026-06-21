import React from 'react';
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
  lastUpdated: {
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
    marginBottom: '32px',
    fontStyle: 'italic',
  },
  panel: {
    padding: '48px',
  },
  section: {
    marginBottom: '36px',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    marginBottom: '16px',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  sectionNumber: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: 'rgba(52, 96, 64, 0.15)',
    color: 'var(--accent)',
    fontSize: '0.85rem',
    fontWeight: 700,
  },
  text: {
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
    lineHeight: 1.8,
    marginBottom: '16px',
  },
  list: {
    margin: '0 0 16px 0',
    paddingLeft: '24px',
    color: 'var(--text-secondary)',
  },
  listItem: {
    fontSize: '0.95rem',
    lineHeight: 1.8,
    marginBottom: '8px',
  },
  highlight: {
    color: 'var(--text-primary)',
    fontWeight: 500,
  },
  footer: {
    textAlign: 'center' as const,
    marginTop: '32px',
    color: 'var(--text-secondary)',
    fontSize: '0.8rem',
    opacity: 0.6,
  },
};

const Section = ({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) => (
  <div style={styles.section}>
    <h2 style={styles.sectionTitle}>
      <span style={styles.sectionNumber}>{number}</span>
      {title}
    </h2>
    {children}
  </div>
);

export default function Terms() {
  const { t } = useLanguage();

  return (
    <div style={styles.wrapper}>
      <div style={styles.bloomTopRight} />
      <div style={styles.bloomBottomLeft} />

      <div style={styles.container}>
        <div style={styles.pageLabel}>{t('legal')}</div>
        <h1 style={styles.title}>{t('termsOfService')}</h1>
        <p style={styles.subtitle}>{t('termsSubtitle')}</p>
        <div style={styles.lastUpdated}>{t('lastUpdatedTerms')}</div>

        <div className="glass-panel" style={styles.panel}>
          <Section number={1} title={t('acceptanceOfTerms')}>
            <p style={styles.text}>{t('acceptanceOfTermsDesc1')}</p>
            <p style={styles.text}>{t('acceptanceOfTermsDesc2')}</p>
          </Section>

          <Section number={2} title={t('accountRegistration')}>
            <p style={styles.text}>{t('accountRegistrationDesc1')}</p>
            <ul style={styles.list}>
              <li style={styles.listItem}>{t('accountRegistrationList1')}</li>
              <li style={styles.listItem}>{t('accountRegistrationList2')}</li>
              <li style={styles.listItem}>{t('accountRegistrationList3')}</li>
              <li style={styles.listItem}>{t('accountRegistrationList4')}</li>
            </ul>
            <p style={styles.text}>{t('accountRegistrationDesc2')}</p>
          </Section>

          <Section number={3} title={t('ticketPurchases')}>
            <p style={styles.text}>{t('ticketPurchasesDesc1')}</p>
            <ul style={styles.list}>
              <li style={styles.listItem}>{t('ticketPurchasesList1')}</li>
              <li style={styles.listItem}>{t('ticketPurchasesList2')}</li>
              <li style={styles.listItem}>{t('ticketPurchasesList3')}</li>
              <li style={styles.listItem}>{t('ticketPurchasesList4')}</li>
              <li style={styles.listItem}>{t('ticketPurchasesList5')}</li>
            </ul>
          </Section>

          <Section number={4} title={t('refundsAndCancellations')}>
            <p style={styles.text}>{t('refundsAndCancellationsDesc1')}</p>
            <ul style={styles.list}>
              <li style={styles.listItem}>
                <span style={styles.highlight}>{t('eventCancellation')}:</span>{' '}
                {t('eventCancellationDesc')}
              </li>
              <li style={styles.listItem}>
                <span style={styles.highlight}>{t('eventPostponement')}:</span>{' '}
                {t('eventPostponementDesc')}
              </li>
              <li style={styles.listItem}>
                <span style={styles.highlight}>{t('voluntaryCancellation')}:</span>{' '}
                {t('voluntaryCancellationDesc')}
              </li>
              <li style={styles.listItem}>
                <span style={styles.highlight}>{t('noShow')}:</span> {t('noShowDesc')}
              </li>
            </ul>
            <p style={styles.text}>{t('refundsAndCancellationsDesc2')}</p>
          </Section>

          <Section number={5} title={t('resaleMarket')}>
            <p style={styles.text}>{t('resaleMarketDesc1')}</p>
            <ul style={styles.list}>
              <li style={styles.listItem}>{t('resaleMarketList1')}</li>
              <li style={styles.listItem}>{t('resaleMarketList2')}</li>
              <li style={styles.listItem}>{t('resaleMarketList3')}</li>
              <li style={styles.listItem}>{t('resaleMarketList4')}</li>
              <li style={styles.listItem}>{t('resaleMarketList5')}</li>
            </ul>
          </Section>

          <Section number={6} title={t('prohibitedConduct')}>
            <p style={styles.text}>{t('prohibitedConductDesc1')}</p>
            <ul style={styles.list}>
              <li style={styles.listItem}>{t('prohibitedConductList1')}</li>
              <li style={styles.listItem}>{t('prohibitedConductList2')}</li>
              <li style={styles.listItem}>{t('prohibitedConductList3')}</li>
              <li style={styles.listItem}>{t('prohibitedConductList4')}</li>
              <li style={styles.listItem}>{t('prohibitedConductList5')}</li>
              <li style={styles.listItem}>{t('prohibitedConductList6')}</li>
              <li style={styles.listItem}>{t('prohibitedConductList7')}</li>
            </ul>
            <p style={styles.text}>{t('prohibitedConductDesc2')}</p>
          </Section>

          <Section number={7} title={t('limitationOfLiability')}>
            <p style={styles.text}>{t('limitationOfLiabilityDesc1')}</p>
            <ul style={styles.list}>
              <li style={styles.listItem}>{t('limitationOfLiabilityList1')}</li>
              <li style={styles.listItem}>{t('limitationOfLiabilityList2')}</li>
              <li style={styles.listItem}>{t('limitationOfLiabilityList3')}</li>
              <li style={styles.listItem}>{t('limitationOfLiabilityList4')}</li>
            </ul>
            <p style={styles.text}>{t('limitationOfLiabilityDesc2')}</p>
          </Section>

          <Section number={8} title={t('governingLaw')}>
            <p style={{ ...styles.text, marginBottom: 0 }}>{t('governingLawDesc')}</p>
          </Section>
        </div>

        <p style={styles.footer}>
          © {new Date().getFullYear()} Admit GmbH. {t('allRightsReserved')}.
        </p>
      </div>
    </div>
  );
}
