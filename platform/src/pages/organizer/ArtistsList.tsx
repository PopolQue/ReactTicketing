import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Entity } from '../../components/EntitySwitcher';
import { useToast } from '../../components/Toast';
import ArtistFormModal from '../../components/modals/ArtistFormModal';

export default function ArtistsList() {
  const { showToast } = useToast();
  const { activeEntity } = useOutletContext<{ activeEntity: Entity }>();
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArtistId, setEditingArtistId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', bio: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchArtists();
  }, [activeEntity]);

  async function fetchArtists() {
    if (!activeEntity) return;

    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .eq('created_by', activeEntity.id)
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
        <div>
          <h2 style={{ margin: '0 0 8px 0' }}>Manage Artists</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
            Create stub pages for artists on your lineup. Once an artist claims their page, they will take over management.
          </p>
        </div>
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
                  {artist.claimed_by_user_id ? (
                    <span style={{ fontSize: '0.85rem', color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                      ✓ Verified & Managed by Artist
                    </span>
                  ) : (
                    <button onClick={() => openEditModal(artist)} className="btn-secondary" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>Edit Stub</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <ArtistFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        editingArtistId={editingArtistId}
        saving={saving}
      />
    </div>
  );
}
