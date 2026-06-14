import React from 'react';
import { InviteManager } from '../../components/invites/InviteManager';

export default function AdminInviteManagerPage() {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: '0 0 8px 0' }}>Global Invites</h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Create and manage access links for Organizers, Artists, and Venues across the entire platform.</p>
      </div>
      
      <InviteManager scope="all" />
    </div>
  );
}
