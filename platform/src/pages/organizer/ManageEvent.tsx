import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';

export default function ManageEvent() {
  const { showToast } = useToast();
  const { id } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [tiers, setTiers] = useState<any[]>([]);
  const [subscriptionTier, setSubscriptionTier] = useState('free');
  const [loading, setLoading] = useState(true);
  
  const [tierForm, setTierForm] = useState({ name: '', price: '', capacity: '' });
  const [isPublishing, setIsPublishing] = useState(false);

  // New states for Images & Theme
  const [uploadingImage, setUploadingImage] = useState(false);
  const [theme, setTheme] = useState({ bgColor: '#0f1115', accentColor: '#6366f1' });

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('organizer_profiles').select('subscription_tier').eq('id', user.id).single();
        if (profile) setSubscriptionTier(profile.subscription_tier);
      }

      const { data: eventData } = await supabase.from('events').select('*').eq('id', id).single();
      if (eventData) {
        setEvent(eventData);
        if (eventData.theme_customization) {
          setTheme({
            bgColor: eventData.theme_customization.bgColor || '#0f1115',
            accentColor: eventData.theme_customization.accentColor || '#6366f1'
          });
        }
      }

      const { data: tiersData } = await supabase.from('ticket_types').select('*').eq('event_id', id);
      if (tiersData) setTiers(tiersData);
      
      setLoading(false);
    }
    fetchData();
  }, [id]);

  const togglePublish = async () => {
    setIsPublishing(true);
    if (!event.published && tiers.length === 0) {
      showToast("You must add at least one ticket tier before publishing.", 'error');
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
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxImages = subscriptionTier === 'pro' ? 10 : 3;
    const currentImages = event.images || [];

    if (currentImages.length >= maxImages) {
      showToast(`Your ${subscriptionTier} tier allows a maximum of ${maxImages} images.`, 'error');
      return;
    }

    setUploadingImage(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${id}_${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from('event_images').upload(fileName, file);

    if (uploadError) {
      showToast('Error uploading image: ' + uploadError.message, 'error');
      setUploadingImage(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from('event_images').getPublicUrl(fileName);
    const newImageUrl = publicUrlData.publicUrl;

    const updatedImages = [...currentImages, newImageUrl];
    const { error: updateError } = await supabase.from('events').update({ images: updatedImages }).eq('id', id);

    if (!updateError) {
      setEvent({ ...event, images: updatedImages });
    }
    setUploadingImage(false);
  };

  const saveTheme = async () => {
    const { error } = await supabase.from('events').update({ theme_customization: theme }).eq('id', id);
    if (!error) showToast("Theme saved successfully!", 'success');
  };

  if (loading) return <div style={{ padding: '24px' }}>Loading...</div>;

  const currentImages = event?.images || [];
  const maxImages = subscriptionTier === 'pro' ? 10 : 3;

  return (
    <div className="manage-event-page" style={{ maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Link to="/organizer/events" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'block', marginBottom: '8px' }}>← Back to Events</Link>
          <h2 style={{ margin: 0 }}>Manage: {event?.name}</h2>
          <span style={{ fontSize: '0.8rem', backgroundColor: subscriptionTier === 'pro' ? '#8b5cf6' : '#4b5563', padding: '2px 8px', borderRadius: '12px', marginTop: '8px', display: 'inline-block' }}>
            {subscriptionTier.toUpperCase()} PLAN
          </span>
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Images Section */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Event Images</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{currentImages.length} / {maxImages} uploaded</span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '16px', marginBottom: '16px' }}>
              {currentImages.map((img: string, idx: number) => (
                <img key={idx} src={img} alt={`Event ${idx}`} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '8px' }} />
              ))}
              {currentImages.length < maxImages && (
                <label style={{ width: '100%', aspectRatio: '1', border: '2px dashed var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: 'rgba(0,0,0,0.1)' }}>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} disabled={uploadingImage} />
                  <span style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>{uploadingImage ? '...' : '+'}</span>
                </label>
              )}
            </div>
            {subscriptionTier === 'free' && (
              <p style={{ fontSize: '0.85rem', color: 'var(--accent)', margin: 0 }}>Upgrade to Pro to upload up to 10 images!</p>
            )}
          </div>

          {/* Theme Customization Section */}
          <div className="glass-panel" style={{ padding: '24px', opacity: subscriptionTier === 'pro' ? 1 : 0.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Pro Theme Customization</h3>
              {subscriptionTier !== 'pro' && <span style={{ fontSize: '0.8rem', backgroundColor: '#ef4444', padding: '2px 8px', borderRadius: '12px' }}>LOCKED</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Background Color</label>
                <input 
                  type="color" 
                  value={theme.bgColor} 
                  onChange={e => setTheme({...theme, bgColor: e.target.value})}
                  disabled={subscriptionTier !== 'pro'}
                  style={{ width: '100%', height: '40px', border: 'none', borderRadius: '4px', cursor: subscriptionTier === 'pro' ? 'pointer' : 'not-allowed' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Accent Color (Buttons, Links)</label>
                <input 
                  type="color" 
                  value={theme.accentColor} 
                  onChange={e => setTheme({...theme, accentColor: e.target.value})}
                  disabled={subscriptionTier !== 'pro'}
                  style={{ width: '100%', height: '40px', border: 'none', borderRadius: '4px', cursor: subscriptionTier === 'pro' ? 'pointer' : 'not-allowed' }}
                />
              </div>
              <button 
                onClick={saveTheme} 
                disabled={subscriptionTier !== 'pro'} 
                className="btn-primary" 
                style={{ marginTop: '8px' }}
              >
                Save Theme
              </button>
            </div>
            {subscriptionTier !== 'pro' && (
               <p style={{ fontSize: '0.85rem', color: 'var(--accent)', marginTop: '16px', marginBottom: 0 }}>Upgrade to Pro to completely brand your event page!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
