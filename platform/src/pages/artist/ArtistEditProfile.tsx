import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../contexts/LanguageContext';

export default function ArtistEditProfile() {
  const { t } = useLanguage();
  const { claim } = useOutletContext<{ claim: any }>();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bio: '',
    image_url: '',
    spotify_url: '',
    instagram_url: '',
    soundcloud_url: ''
  });

  useEffect(() => {
    if (claim?.artists) {
      // eslint-disable-next-line
      setFormData({
        bio: claim.artists.bio || '',
        image_url: claim.artists.image_url || '',
        spotify_url: claim.artists.spotify_url || '',
        instagram_url: claim.artists.instagram_url || '',
        soundcloud_url: claim.artists.soundcloud_url || ''
      });
    }
  }, [claim]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claim?.artist_id) return;
    
    setLoading(true);
    await supabase.from('artists').update(formData).eq('id', claim.artist_id);
    setLoading(false);
    alert('Profile updated successfully!');
  };

  if (!claim || claim.status !== 'approved') {
    return <p>{t('artist_edit_must_have_claim')}</p>;
  }

  return (
    <div className="glass-panel" style={{ padding: '32px' }}>
      <h2 style={{ margin: '0 0 24px 0' }}>{t('artist_edit_public_profile')}</h2>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>{t('artist_edit_artist_bio')}</label>
          <textarea 
            className="input-field" 
            rows={5} 
            value={formData.bio}
            onChange={e => setFormData({...formData, bio: e.target.value})}
            placeholder="Tell your fans about yourself..."
          ></textarea>
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>{t('artist_edit_profile_image')}</label>
          <input 
            type="url" 
            className="input-field" 
            value={formData.image_url}
            onChange={e => setFormData({...formData, image_url: e.target.value})}
            placeholder="https://example.com/photo.jpg"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>{t('artist_edit_spotify_artist')}</label>
          <input 
            type="url" 
            className="input-field" 
            value={formData.spotify_url}
            onChange={e => setFormData({...formData, spotify_url: e.target.value})}
            placeholder="https://open.spotify.com/artist/..."
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>{t('artist_edit_instagram')}</label>
          <input 
            type="url" 
            className="input-field" 
            value={formData.instagram_url}
            onChange={e => setFormData({...formData, instagram_url: e.target.value})}
            placeholder="https://instagram.com/..."
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>{t('artist_edit_soundcloud')}</label>
          <input 
            type="url" 
            className="input-field" 
            value={formData.soundcloud_url}
            onChange={e => setFormData({...formData, soundcloud_url: e.target.value})}
            placeholder="https://soundcloud.com/..."
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '16px', alignSelf: 'flex-start' }}>
          {loading ? 'Saving...' : 'Save Profile Changes'}
        </button>
      </form>
    </div>
  );
}
