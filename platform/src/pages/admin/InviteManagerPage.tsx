import React from 'react';
import { InviteManager } from '../../components/invites/InviteManager';
import { useLanguage } from '../../contexts/LanguageContext';

export default function AdminInviteManagerPage() {
  const { t } = useLanguage();
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: '0 0 8px 0' }}>{t('invite_manager_title')}</h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{t('invite_manager_desc')}</p>
      </div>
      
      <InviteManager scope="all" />
    </div>
  );
}
