import React from 'react';
import { useOutletContext } from 'react-router-dom';
import type { Entity } from '../../components/EntitySwitcher';
import VenueSelector from '../../components/VenueSelector';
import Dropdown from '../../components/Dropdown';
import { useEventForm } from '../../hooks/useEventForm';
import { useLanguage } from '../../contexts/LanguageContext';

export default function CreateEvent() {
  const { t } = useLanguage();
  const { activeEntity } = useOutletContext<{ activeEntity: Entity }>();
  const { formData, handleChange, handleVenueChange, createEvent, loading, error } = useEventForm(activeEntity);

  return (
    <div className="create-event-page" style={{ maxWidth: '800px' }}>
      <h2 style={{ margin: '0 0 24px 0' }}>{t("organizer.createEvent.title")}</h2>
      
      {error && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', padding: '16px', borderRadius: '8px', marginBottom: '24px', color: '#fca5a5' }}>
          <strong>{t("organizer.createEvent.error")}</strong> {error}
        </div>
      )}

      <div className="glass-panel" style={{ padding: '24px' }}>
        <form onSubmit={createEvent} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>{t("organizer.createEvent.eventTitle")}</label>
              <input required type="text" name="title" value={formData.title} onChange={handleChange} className="input-field" placeholder={t("organizer.createEvent.eventTitlePlaceholder")} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>{t("organizer.createEvent.category")}</label>
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
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>{t("organizer.createEvent.dateTime")}</label>
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
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>{t("organizer.createEvent.city")}</label>
              <input required type="text" name="city" value={formData.city} onChange={handleChange} className="input-field" placeholder={t("organizer.createEvent.cityPlaceholder")} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>{t("organizer.createEvent.country")}</label>
              <input required type="text" name="country" value={formData.country} onChange={handleChange} className="input-field" placeholder={t("organizer.createEvent.countryPlaceholder")} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>{t("organizer.createEvent.description")}</label>
            <textarea required name="description" value={formData.description} onChange={handleChange} className="input-field" rows={4} placeholder={t("organizer.createEvent.descriptionPlaceholder")}></textarea>
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
                <strong style={{ display: 'block', color: 'white' }}>{t("organizer.createEvent.isExternal")}</strong>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t("organizer.createEvent.isExternalDesc")}</span>
              </div>
            </label>
            
            {formData.is_external && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>{t("organizer.createEvent.externalLink")}</label>
                <input 
                  required={formData.is_external} 
                  type="url" 
                  name="external_ticket_url" 
                  value={formData.external_ticket_url} 
                  onChange={handleChange} 
                  className="input-field" 
                  placeholder={t("organizer.createEvent.externalLinkPlaceholder")} 
                />
              </div>
            )}
          </div>
          
          <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '12px', alignSelf: 'flex-start', opacity: loading ? 0.7 : 1 }}>
            {loading ? t("organizer.createEvent.saving") : t("organizer.createEvent.saveContinue")}
          </button>
        </form>
      </div>
    </div>
  );
}
