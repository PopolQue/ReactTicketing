import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Entity } from '../../components/EntitySwitcher';
import { useToast } from '../../components/Toast';

export default function Settings() {
  const { activeEntity } = useOutletContext<{ activeEntity: Entity }>();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [stripeAccountId, setStripeAccountId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      if (!activeEntity) return;

      const { data } = await supabase
        .from('organizers')
        .select('*')
        .eq('id', activeEntity.id)
        .single();

      if (data) {
        setProfile(data);
        setStripeAccountId(data.stripe_account_id || '');
      }
      setLoading(false);
    }
    fetchProfile();
  }, [activeEntity]);

  const handleSaveStripe = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from('organizers')
      .update({ stripe_account_id: stripeAccountId })
      .eq('id', profile.id);

    if (!error) {
      showToast("Stripe Account ID saved successfully! Payouts will now be routed automatically.", 'success');
    } else {
      showToast("Error saving Stripe Account: " + error.message, 'error');
    }
    setSaving(false);
  };

  if (loading) return <div style={{ padding: '24px' }}>Loading Settings...</div>;

  return (
    <div className="settings-page" style={{ maxWidth: '800px' }}>
      <h2 style={{ marginBottom: '24px', margin: 0 }}>Settings & Payouts</h2>
      
      <div className="glass-panel" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginRight: '16px' }}>
            {profile.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px 0' }}>{profile.name}</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Plan: <strong style={{ color: 'var(--accent)', textTransform: 'uppercase' }}>{profile.subscription_tier}</strong>
            </p>
          </div>
        </div>

        <h4 style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', marginBottom: '16px' }}>Stripe Connect (Payouts)</h4>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5' }}>
          Connect your Stripe account to automatically receive payouts for ticket sales minus the platform application fee. 
          Enter your Stripe Connected Account ID (starts with `acct_`).
        </p>
        
        <form onSubmit={handleSaveStripe} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Stripe Account ID</label>
            <input 
              type="text" 
              value={stripeAccountId} 
              onChange={e => setStripeAccountId(e.target.value)} 
              className="input-field" 
              placeholder="acct_123456789"
              required 
            />
          </div>
          <button type="submit" disabled={saving} className="btn-primary" style={{ width: 'fit-content' }}>
            {saving ? 'Saving...' : 'Save Stripe Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
