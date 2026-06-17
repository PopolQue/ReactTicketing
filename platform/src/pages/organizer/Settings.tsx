import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Entity } from '../../components/EntitySwitcher';
import { useToast } from '../../components/Toast';
import { useLanguage } from '../../contexts/LanguageContext';

export default function Settings() {
  const { t } = useLanguage();
  const { activeEntity } = useOutletContext<{ activeEntity: Entity }>();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    image_url: '',
    stripe_account_id: ''
  });

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
        setFormData({
          name: data.name || '',
          bio: data.bio || '',
          image_url: data.image_url || '',
          stripe_account_id: data.stripe_account_id || ''
        });
      }
      setLoading(false);
    }
    fetchProfile();
  }, [activeEntity]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from('organizers')
      .update({
        name: formData.name,
        bio: formData.bio,
        image_url: formData.image_url,
        stripe_account_id: formData.stripe_account_id
      })
      .eq('id', activeEntity.id);

    if (!error) {
      showToast("Profile saved successfully!", 'success');
    } else {
      showToast("Error saving profile: " + error.message, 'error');
    }
    setSaving(false);
  };

  if (loading) return <div style={{ padding: '24px' }}>{t("organizer.settings.loading")}</div>;

  return (
    <div className="settings-page" style={{ maxWidth: '800px' }}>
      <h2 style={{ marginBottom: '24px', margin: 0 }}>{t("organizer.settings.title")}</h2>
      
      <div className="glass-panel" style={{ padding: '32px' }}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Name</label>
            <input 
              type="text" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              className="input-field" 
              required 
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Bio</label>
            <textarea 
              value={formData.bio} 
              onChange={e => setFormData({...formData, bio: e.target.value})} 
              className="input-field" 
              rows={4}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Image URL</label>
            <input 
              type="url" 
              value={formData.image_url} 
              onChange={e => setFormData({...formData, image_url: e.target.value})} 
              className="input-field" 
            />
          </div>
          <h4 style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', marginBottom: '16px' }}>{t("organizer.settings.stripeConnect")}</h4>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5' }}>{t("organizer.settings.stripeDesc")}</p>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t("organizer.settings.stripeLabel")}</label>
            <input 
              type="text" 
              value={formData.stripe_account_id} 
              onChange={e => setFormData({...formData, stripe_account_id: e.target.value})} 
              className="input-field" 
              placeholder={t("organizer.settings.stripePlaceholder")}
            />
          </div>
          <button type="submit" disabled={saving} className="btn-primary" style={{ width: 'fit-content' }}>
            {saving ? t("organizer.settings.saving") : "Save Profile & Settings"}
          </button>
        </form>
      </div>
    </div>
  );
}
