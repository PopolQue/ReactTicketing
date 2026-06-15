import { useLanguage } from "../../contexts/LanguageContext";
import React from 'react';
export default function ThemeCustomizer({
  theme,
  setTheme,
  saveTheme,
  subscriptionTier
}: {
  theme: any;
  setTheme: any;
  saveTheme: any;
  subscriptionTier: string;
}) {
  const {
    t
  } = useLanguage();
  return <div className="glass-panel" style={{
    padding: '24px',
    opacity: subscriptionTier === 'pro' ? 1 : 0.5
  }}>
      <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px'
    }}>
        <h3>{t("proThemeCustomization")}</h3>
        {subscriptionTier !== 'pro' && <span style={{
        fontSize: '0.8rem',
        backgroundColor: '#ef4444',
        padding: '2px 8px',
        borderRadius: '12px'
      }}>{t("locked")}</span>}
      </div>

      <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
        <div>
          <label style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '0.9rem',
          color: 'var(--text-secondary)'
        }}>{t("backgroundColor")}</label>
          <input type="color" value={theme.bgColor} onChange={e => setTheme({
          ...theme,
          bgColor: e.target.value
        })} disabled={subscriptionTier !== 'pro'} style={{
          width: '100%',
          height: '40px',
          border: 'none',
          borderRadius: '4px',
          cursor: subscriptionTier === 'pro' ? 'pointer' : 'not-allowed'
        }} />
        </div>
        <div>
          <label style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '0.9rem',
          color: 'var(--text-secondary)'
        }}>{t("accentColorButtonsLinks")}</label>
          <input type="color" value={theme.accentColor} onChange={e => setTheme({
          ...theme,
          accentColor: e.target.value
        })} disabled={subscriptionTier !== 'pro'} style={{
          width: '100%',
          height: '40px',
          border: 'none',
          borderRadius: '4px',
          cursor: subscriptionTier === 'pro' ? 'pointer' : 'not-allowed'
        }} />
        </div>
        <button onClick={saveTheme} className="btn-primary" style={{
        marginTop: '8px'
      }}>{t("saveThemeColors")}</button>
      </div>
      {subscriptionTier !== 'pro' && <p style={{
      fontSize: '0.85rem',
      color: 'var(--accent)',
      marginTop: '16px',
      marginBottom: 0
    }}>{t("upgradeToProToCompletelyB")}</p>}
    </div>;
}