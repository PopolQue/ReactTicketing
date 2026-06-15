import React from 'react';
import BlogsList from '../organizer/BlogsList';
import { useLanguage } from '../../contexts/LanguageContext';

export default function WriterDashboard() {
  const { t } = useLanguage();
  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: '0 0 8px 0' }}>{t('writer_dash_title')}</h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          {t('writer_dash_desc')}
        </p>
      </div>
      <BlogsList />
    </div>
  );
}
