import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Entity } from '../../components/EntitySwitcher';
import { useToast } from '../../components/Toast';
import { useLanguage } from '../../contexts/LanguageContext';

export default function VenueSettings() {
  const { t } = useLanguage();
  const { activeEntity } = useOutletContext<{ activeEntity: Entity }>();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    image_url: '',
    city: '',
    country: '',
    capacity: 0
  });

  useEffect(() => {
    async function fetchVenue() {
      if (!activeEntity) return;

      const { data } = await supabase
        .from('venues')
        .select('*')
        .eq('id', activeEntity.id)
        .single();

      if (data) {
        setFormData({
          name: data.name || '',
          bio: data.bio || '',
          image_url: data.image_url || '',
          city: data.city || '',
          country: data.country || '',
          capacity: data.capacity || 0
        });
      }
      setLoading(false);
    }
    fetchVenue();
  }, [activeEntity]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from('venues')
      .update({
        name: formData.name,
        bio: formData.bio,
        image_url: formData.image_url,
        city: formData.city,
        country: formData.country,
        capacity: formData.capacity
      })
      .eq('id', activeEntity.id);

    if (!error) {
      showToast("Venue profile saved successfully!", 'success');
    } else {
      showToast("Error saving venue profile: " + error.message, 'error');
    }
    setSaving(false);
  };

  if (loading) return <div style={{ padding: '24px' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: '800px' }}>
      <h2 style={{ marginBottom: '24px' }}>Edit Venue Profile</h2>
      <div className="glass-panel" style={{ padding: '32px' }}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Name</label>
            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-field" required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Bio</label>
            <textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} className="input-field" rows={4} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>City</label>
              <input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="input-field" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Country</label>
              <input type="text" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} className="input-field" />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Capacity</label>
            <input type="number" value={formData.capacity} onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})} className="input-field" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Image URL</label>
            <input type="url" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} className="input-field" />
          </div>
          <button type="submit" disabled={saving} className="btn-primary" style={{ width: 'fit-content' }}>
            {saving ? 'Saving...' : 'Save Venue Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
