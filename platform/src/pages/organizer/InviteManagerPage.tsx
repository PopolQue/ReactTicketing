import React from 'react';
import { useParams } from 'react-router-dom';
import { InviteManager } from '../../components/invites/InviteManager';

export default function OrganizerInviteManagerPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: '0 0 8px 0' }}>Artist Invites</h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Invite artists directly to their profiles so they can manage their own pages and view their payout splits.</p>
      </div>
      
      <InviteManager scope="artist" organizerId={id} />
    </div>
  );
}
