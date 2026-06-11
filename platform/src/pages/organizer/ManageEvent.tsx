import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function ManageEvent() {
  const { id } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [tiers, setTiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [tierForm, setTierForm] = useState({ name: '', price: '', capacity: '' });
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { data: eventData } = await supabase.from('events').select('*').eq('id', id).single();
      if (eventData) setEvent(eventData);

      const { data: tiersData } = await supabase.from('ticket_types').select('*').eq('event_id', id);
      if (tiersData) setTiers(tiersData);
      
      setLoading(false);
    }
    fetchData();
  }, [id]);

  const togglePublish = async () => {
    setIsPublishing(true);
    // Only allow publishing if there is at least one ticket tier
    if (!event.published && tiers.length === 0) {
      alert("You must add at least one ticket tier before publishing.");
      setIsPublishing(false);
      return;
    }

    const { error } = await supabase.from('events').update({ published: !event.published }).eq('id', id);
    if (!error) setEvent({ ...event, published: !event.published });
    setIsPublishing(false);
  };

  const handleCreateTier = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceCents = Math.round(parseFloat(tierForm.price) * 100);
    const { data, error } = await supabase.from('ticket_types').insert([{
      id: crypto.randomUUID(),
      event_id: id,
      name: tierForm.name,
      pricing: { amount: priceCents, currency: 'EUR' },
      capacity: parseInt(tierForm.capacity)
    }]).select();

    if (!error && data) {
      setTiers([...tiers, data[0]]);
      setTierForm({ name: '', price: '', capacity: '' });
    } else {
      console.error(error);
    }
  };

  if (loading) return <div style={{ padding: '24px' }}>Loading...</div>;

  return (
    <div className="manage-event-page" style={{ maxWidth: '900px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Link to="/organizer/events" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'block', marginBottom: '8px' }}>← Back to Events</Link>
          <h2 style={{ margin: 0 }}>Manage: {event?.name}</h2>
        </div>
        <button onClick={togglePublish} disabled={isPublishing} className="btn-primary" style={{ backgroundColor: event?.published ? '#10b981' : 'var(--accent)' }}>
          {isPublishing ? 'Updating...' : (event?.published ? '✓ Published (Live)' : 'Publish Event')}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Ticket Tiers Section */}
        <div className="glass-panel" style={{ padding: '24px' }}>
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
        </div>

        {/* Analytics Placeholder */}
        <div className="glass-panel" style={{ padding: '24px', height: 'fit-content' }}>
          <h3>Event Analytics</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '16px' }}>Once your event is published and tickets are sold, sales data will appear here.</p>
        </div>

      </div>
    </div>
  );
}
