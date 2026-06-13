import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';

export default function ArtistsList() {
  const { showToast } = useToast();
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArtistId, setEditingArtistId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', bio: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchArtists();
  }, []);

  async function fetchArtists() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      showToast('Error loading artists: ' + error.message, 'error');
    } else {
      setArtists(data || []);
    }
    setLoading(false);
  }

  const openCreateModal = () => {
    setEditingArtistId(null);
    setFormData({ name: '', bio: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (artist: any) => {
    setEditingArtistId(artist.id);
    setFormData({ name: artist.name, bio: artist.bio || '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (editingArtistId) {
      const { error } = await supabase
        .from('artists')
        .update({ name: formData.name, bio: formData.bio })
        .eq('id', editingArtistId);
        
      if (error) showToast('Error updating artist', 'error');
      else {
        showToast('Artist updated successfully', 'success');
        setIsModalOpen(false);
        fetchArtists();
      }
    } else {
      const { error } = await supabase.from('artists').insert([
        {
          name: formData.name,
          bio: formData.bio,
          created_by: user.id
        }
      ]);

      if (error) showToast('Error creating artist', 'error');
      else {
        showToast('Artist created successfully', 'success');
        setIsModalOpen(false);
        fetchArtists();
      }
    }
    setSaving(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>Manage Artists</h2>
        <button className="btn-primary" onClick={openCreateModal}>+ Add Artist</button>
      </div>

      {loading ? <p>Loading artists...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
          {artists.length === 0 ? (
            <div className="glass-panel" style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)' }}>You haven't added any artists yet.</p>
            </div>
          ) : (
            artists.map(artist => (
              <div key={artist.id} className="glass-panel" style={{ padding: '20px' }}>
                <h3 style={{ margin: '0 0 8px 0' }}>{artist.name}</h3>
                <p style={{ margin: '0 0 16px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{artist.bio}</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => openEditModal(artist)} className="btn-secondary" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>Edit</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
          <div className="glass-panel" style={{ padding: '40px', width: '100%', maxWidth: '500px' }}>
            <h2 style={{ marginTop: 0, marginBottom: '24px' }}>{editingArtistId ? 'Edit Artist' : 'Create Artist'}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Artist Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  required 
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Biography</label>
                <textarea 
                  className="input-field" 
                  rows={4}
                  value={formData.bio} 
                  onChange={e => setFormData({...formData, bio: e.target.value})} 
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary" style={{ flex: 1 }}>
                  {saving ? 'Saving...' : 'Save Artist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
