import React from 'react';
import { useOutletContext } from 'react-router-dom';
import type { Entity } from '../../components/EntitySwitcher';
import VenueSelector from '../../components/VenueSelector';
import Dropdown from '../../components/Dropdown';
import { useEventForm } from '../../hooks/useEventForm';

export default function CreateEvent() {
  const { activeEntity } = useOutletContext<{ activeEntity: Entity }>();
  const { formData, handleChange, handleVenueChange, createEvent, loading, error } = useEventForm(activeEntity);

  return (
    <div className="create-event-page" style={{ maxWidth: '800px' }}>
      <h2 style={{ margin: '0 0 24px 0' }}>Create New Event</h2>
      
      {error && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', padding: '16px', borderRadius: '8px', marginBottom: '24px', color: '#fca5a5' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="glass-panel" style={{ padding: '24px' }}>
        <form onSubmit={createEvent} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Event Title</label>
              <input required type="text" name="title" value={formData.title} onChange={handleChange} className="input-field" placeholder="e.g. Neon Nights Vol. 4" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Category</label>
              <Dropdown 
                value={formData.category} 
                onChange={(val) => handleChange({ target: { name: 'category', value: val } } as any)}
                options={[
                  { value: 'clubnight', label: 'Clubnight' },
                  { value: 'concert', label: 'Concert' },
                  { value: 'festival', label: 'Festival' },
                  { value: 'workshop', label: 'Workshop' },
                  { value: 'other', label: 'Other' }
                ]}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Date & Time</label>
              <input required type="datetime-local" name="start_date" value={formData.start_date} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <VenueSelector 
                selectedVenueId={formData.venue_id} 
                onVenueChange={handleVenueChange} 
              />
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
          
          <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '12px' }}>
              <input 
                type="checkbox" 
                name="is_external" 
                checked={formData.is_external} 
                onChange={handleChange}
                style={{ width: '20px', height: '20px', accentColor: 'var(--accent)' }}
              />
              <div>
                <strong style={{ display: 'block', color: 'white' }}>This is an external event</strong>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Check this if you are selling tickets on another platform (like Resident Advisor) but want fans to discover it here.</span>
              </div>
            </label>
            
            {formData.is_external && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>External Ticket Link</label>
                <input 
                  required={formData.is_external} 
                  type="url" 
                  name="external_ticket_url" 
                  value={formData.external_ticket_url} 
                  onChange={handleChange} 
                  className="input-field" 
                  placeholder="https://ra.co/events/..." 
                />
              </div>
            )}
          </div>
          
          <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '12px', alignSelf: 'flex-start', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Saving...' : 'Save & Continue to Ticketing'}
          </button>
        </form>
      </div>
    </div>
  );
}
