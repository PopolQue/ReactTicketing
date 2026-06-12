import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';

export default function ArtistsList() {
  const { showToast } = useToast();
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  async function createDemoArtist() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('artists').insert([
      {
        name: 'New Artist ' + Math.floor(Math.random() * 100),
        bio: 'An amazing upcoming talent.',
        created_by: user.id
      }
    ]);

    if (error) {
      showToast('Error creating artist', 'error');
    } else {
      showToast('Artist created successfully', 'success');
      fetchArtists();
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>Manage Artists</h2>
        <button className="btn-primary" onClick={createDemoArtist}>+ Add Artist</button>
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
                  <button className="btn-secondary" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>Edit</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
