import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <div style={{ padding: '80px 24px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '4rem', margin: '0 0 16px', color: 'var(--accent)' }}>404</h1>
      <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '32px' }}>
        {t('pageNotFound') || 'Page not found'}
      </p>
      <Link
        to="/"
        className="btn-primary"
        style={{ textDecoration: 'none', display: 'inline-block' }}
      >
        {t('backToHome') || 'Back to Home'}
      </Link>
    </div>
  );
}
