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

const Section = ({ number, title, children }: { number: number, title: string, children: React.ReactNode }) => (
  <div style={styles.section}>
    <h2 style={styles.sectionTitle}>
      <span style={styles.sectionNumber}>{number}</span>
      {title}
    </h2>
    {children}
  </div>
);

export default function Privacy() {
  const { t } = useLanguage();

  return (
    <div style={styles.wrapper}>
      <div style={styles.bloomTopRight} />
      <div style={styles.bloomBottomLeft} />

      <div style={styles.container}>
        <div style={styles.pageLabel}>{t('legal')}</div>
        <h1 style={styles.title}>{t('privacyPolicy')}</h1>
        <p style={styles.subtitle}>
          {t('privacySubtitle')}
        </p>
        <div style={styles.lastUpdated}>{t('lastUpdatedPrivacy')}</div>

        <div className="glass-panel" style={styles.panel}>
          <Section number={1} title={t('whatDataDoWeCollect')}>
            <p style={styles.text}>{t('whatDataDoWeCollectDesc1')}</p>
            <ul style={styles.list}>
              <li style={styles.listItem}>{t('whatDataDoWeCollectList1')}</li>
              <li style={styles.listItem}>{t('whatDataDoWeCollectList2')}</li>
              <li style={styles.listItem}>{t('whatDataDoWeCollectList3')}</li>
              <li style={styles.listItem}>{t('whatDataDoWeCollectList4')}</li>
            </ul>
          </Section>

          <Section number={2} title={t('howDoWeCollectData')}>
            <p style={styles.text}>{t('howDoWeCollectDataDesc1')}</p>
            <ul style={styles.list}>
              <li style={styles.listItem}>{t('howDoWeCollectDataList1')}</li>
              <li style={styles.listItem}>{t('howDoWeCollectDataList2')}</li>
              <li style={styles.listItem}>{t('howDoWeCollectDataList3')}</li>
            </ul>
          </Section>

          <Section number={3} title={t('howWillWeUseData')}>
            <p style={styles.text}>{t('howWillWeUseDataDesc1')}</p>
            <ul style={styles.list}>
              <li style={styles.listItem}>{t('howWillWeUseDataList1')}</li>
              <li style={styles.listItem}>{t('howWillWeUseDataList2')}</li>
              <li style={styles.listItem}>{t('howWillWeUseDataList3')}</li>
            </ul>
            <p style={styles.text}>{t('howWillWeUseDataDesc2')}</p>
          </Section>

          <Section number={4} title={t('howDoWeStoreData')}>
            <p style={styles.text}>{t('howDoWeStoreDataDesc1')}</p>
            <p style={styles.text}>{t('howDoWeStoreDataDesc2')}</p>
          </Section>

          <Section number={5} title={t('marketing')}>
            <p style={styles.text}>{t('marketingDesc1')}</p>
            <p style={styles.text}>{t('marketingDesc2')}</p>
            <p style={styles.text}>{t('marketingDesc3')}</p>
          </Section>

          <Section number={6} title={t('dataProtectionRights')}>
            <p style={styles.text}>{t('dataProtectionRightsDesc1')}</p>
            <ul style={styles.list}>
              <li style={styles.listItem}><span style={styles.highlight}>{t('rightToAccess')}</span> – {t('rightToAccessDesc')}</li>
              <li style={styles.listItem}><span style={styles.highlight}>{t('rightToRectification')}</span> – {t('rightToRectificationDesc')}</li>
              <li style={styles.listItem}><span style={styles.highlight}>{t('rightToErasure')}</span> – {t('rightToErasureDesc')}</li>
              <li style={styles.listItem}><span style={styles.highlight}>{t('rightToRestrictProcessing')}</span> – {t('rightToRestrictProcessingDesc')}</li>
              <li style={styles.listItem}><span style={styles.highlight}>{t('rightToObjectToProcessing')}</span> – {t('rightToObjectToProcessingDesc')}</li>
              <li style={styles.listItem}><span style={styles.highlight}>{t('rightToDataPortability')}</span> – {t('rightToDataPortabilityDesc')}</li>
            </ul>
            <p style={styles.text}>{t('dataProtectionRightsDesc2')} <a href="mailto:privacy@admit.events" style={styles.link}>privacy@admit.events</a></p>
          </Section>

          <Section number={7} title={t('whatAreCookies')}>
            <p style={styles.text}>{t('whatAreCookiesDesc1')}</p>
            <p style={styles.text}>{t('whatAreCookiesDesc2')}</p>
          </Section>

          <Section number={8} title={t('howDoWeUseCookies')}>
            <p style={styles.text}>{t('howDoWeUseCookiesDesc1')}</p>
            <ul style={styles.list}>
              <li style={styles.listItem}>{t('howDoWeUseCookiesList1')}</li>
              <li style={styles.listItem}>{t('howDoWeUseCookiesList2')}</li>
            </ul>
          </Section>

          <Section number={9} title={t('typesOfCookies')}>
            <p style={styles.text}>{t('typesOfCookiesDesc1')}</p>
            <ul style={styles.list}>
              <li style={styles.listItem}><span style={styles.highlight}>{t('functionality')}</span> – {t('functionalityDesc')}</li>
              <li style={styles.listItem}><span style={styles.highlight}>{t('advertising')}</span> – {t('advertisingDesc')}</li>
            </ul>
          </Section>

          <Section number={10} title={t('howToManageCookies')}>
            <p style={styles.text}>{t('howToManageCookiesDesc')}</p>
          </Section>

          <Section number={11} title={t('privacyPoliciesOfOtherWebsites')}>
            <p style={styles.text}>{t('privacyPoliciesOfOtherWebsitesDesc1')} <a href="https://stripe.com/privacy" style={styles.link}>stripe.com/privacy</a>.</p>
          </Section>

          <Section number={12} title={t('changesToPrivacyPolicy')}>
            <p style={styles.text}>{t('changesToPrivacyPolicyDesc')}</p>
          </Section>

          <Section number={13} title={t('howToContactUs')}>
            <p style={styles.text}>{t('howToContactUsDesc')}</p>
            <p style={styles.text}>{t('emailUsAt')}: <a href="mailto:privacy@admit.events" style={styles.link}>privacy@admit.events</a></p>
            <p style={styles.text}>{t('writeToUsAt')}: Friedrichstraße 123, 10117 Berlin, Germany</p>
          </Section>

          <Section number={14} title={t('howToContactAuthority')}>
            <p style={styles.text}>{t('howToContactAuthorityDesc')}</p>
            <p style={styles.text}>{t('email')}: <a href="mailto:mailbox@datenschutz-berlin.de" style={styles.link}>mailbox@datenschutz-berlin.de</a></p>
            <p style={styles.text}>{t('address')}: Friedrichstraße 219, 10969 Berlin, Germany</p>
          </Section>

        </div>

        <p style={styles.footer}>
          © {new Date().getFullYear()} Admit GmbH. {t('allRightsReserved')}.
        </p>
      </div>
    </div>
  );
}
