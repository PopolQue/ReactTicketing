import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function CreateEvent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    start_date: '',
    venue: '',
    city: '',
    country: '',
    description: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Get the currently logged-in user (Organizer)
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Authentication Required: You must be logged in as an Organizer to create an event.");
      }

      // Fetch organizer name to satisfy the legacy NOT NULL constraint
      const { data: profile } = await supabase.from('organizer_profiles').select('company_name').eq('id', user.id).maybeSingle();
      
      let companyName = profile?.company_name;
      if (!profile) {
        companyName = 'Independent Organizer';
        // Auto-repair: create the profile if it's completely missing
        await supabase.from('organizer_profiles').insert([{ id: user.id, company_name: companyName }]);
      }

      // 2. Insert the event into Supabase
      const { data, error: insertError } = await supabase
        .from('events')
        .insert([
          {
            id: crypto.randomUUID(), // Legacy schema expects TEXT id
            name: formData.title,    // Legacy schema expects 'name' instead of 'title'
            organizer_name: companyName,
            start_date: new Date(formData.start_date).toISOString(),
            venue: formData.venue,
            city: formData.city,
            country: formData.country,
            description: formData.description,
            organizer_id: user.id,
            timezone_id: 'gmt1_berlin', // Must be a valid seed from the timezones table
            published: false
          }
        ])
        .select();

      if (insertError) throw insertError;

      // 3. Navigate back to events list on success
      navigate('/organizer/events');
      
    } catch (err: any) {
      console.error('Error creating event:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-event-page" style={{ maxWidth: '800px' }}>
      <h2 style={{ margin: '0 0 24px 0' }}>Create New Event</h2>
      
      {error && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', padding: '16px', borderRadius: '8px', marginBottom: '24px', color: '#fca5a5' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="glass-panel" style={{ padding: '24px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Event Title</label>
            <input required type="text" name="title" value={formData.title} onChange={handleChange} className="input-field" placeholder="e.g. Neon Nights Vol. 4" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Date & Time</label>
              <input required type="datetime-local" name="start_date" value={formData.start_date} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Venue</label>
              <input required type="text" name="venue" value={formData.venue} onChange={handleChange} className="input-field" placeholder="Club XYZ" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>City</label>
              <input required type="text" name="city" value={formData.city} onChange={handleChange} className="input-field" placeholder="Berlin" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Country</label>
              <input required type="text" name="country" value={formData.country} onChange={handleChange} className="input-field" placeholder="Germany" />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Description</label>
            <textarea required name="description" value={formData.description} onChange={handleChange} className="input-field" rows={4} placeholder="Describe your event..."></textarea>
          </div>
          
          <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '12px', alignSelf: 'flex-start', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Saving...' : 'Save & Continue to Ticketing'}
          </button>
        </form>
      </div>
    </div>
  );
}
