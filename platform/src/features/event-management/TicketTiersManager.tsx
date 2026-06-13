import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';

export default function TicketTiersManager({ event, eventId, tiers, setTiers, updateEvent }: { event: any, eventId: string, tiers: any[], setTiers: any, updateEvent: any }) {
  const { showToast } = useToast();
  const [tierForm, setTierForm] = useState({ name: '', price: '', capacity: '' });

  const handleExternalUrlUpdate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    updateEvent({ external_ticket_url: newUrl });
  };

  const saveExternalUrl = async () => {
    const { error } = await supabase.from('events').update({ external_ticket_url: event.external_ticket_url }).eq('id', eventId);
    if (error) showToast("Failed to update URL", "error");
    else showToast("External URL updated successfully", "success");
  };

  const handleCreateTier = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceCents = Math.round(parseFloat(tierForm.price) * 100);
    const { data, error } = await supabase.from('ticket_types').insert([{
      id: crypto.randomUUID(),
      event_id: eventId,
      name: tierForm.name,
      pricing: { amount: priceCents, currency: 'EUR' },
      capacity: parseInt(tierForm.capacity)
    }]).select();

    if (!error && data) {
      setTiers([...tiers, data[0]]);
      setTierForm({ name: '', price: '', capacity: '' });
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      {event?.is_external ? (
        <div>
          <h3>External Event Link</h3>
          <p style={{ color: 'var(--text-secondary)' }}>This event links to an external ticketing platform.</p>
          <div style={{ marginTop: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Ticket URL</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input 
                type="url" 
                className="input-field" 
                value={event?.external_ticket_url || ''} 
                onChange={handleExternalUrlUpdate}
                placeholder="https://..." 
              />
              <button onClick={saveExternalUrl} className="btn-secondary">Save URL</button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <h3>Ticket Tiers</h3>
          <div style={{ margin: '20px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {tiers.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No tickets added yet.</p> : tiers.map(tier => (
              <div key={tier.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <div>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>{tier.name}</strong>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Capacity: {tier.capacity}</div>
                </div>
                <div style={{ fontWeight: 600, color: 'var(--accent)' }}>
                  €{((tier.pricing?.amount || 0) / 100).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <h4 style={{ marginTop: '32px', marginBottom: '16px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>Add New Tier</h4>
          <form onSubmit={handleCreateTier} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input required type="text" placeholder="Tier Name (e.g. VIP)" className="input-field" value={tierForm.name} onChange={e => setTierForm({...tierForm, name: e.target.value})} />
            <div style={{ display: 'flex', gap: '12px' }}>
              <input required type="number" step="0.01" min="0" placeholder="Price (€)" className="input-field" value={tierForm.price} onChange={e => setTierForm({...tierForm, price: e.target.value})} />
              <input required type="number" min="1" placeholder="Capacity" className="input-field" value={tierForm.capacity} onChange={e => setTierForm({...tierForm, capacity: e.target.value})} />
            </div>
            <button type="submit" className="btn-secondary" style={{ marginTop: '8px' }}>+ Add Ticket Tier</button>
          </form>
        </>
      )}
    </div>
  );
}
