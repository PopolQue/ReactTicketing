import React from 'react';

export default function ArtistFormModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  editingArtistId,
  saving
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: any;
  setFormData: any;
  editingArtistId: string | null;
  saving: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
      <div className="glass-panel" style={{ padding: '40px', width: '100%', maxWidth: '500px' }}>
        <h2 style={{ marginTop: 0, marginBottom: '24px' }}>{editingArtistId ? 'Edit Artist' : 'Create Artist'}</h2>
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary" style={{ flex: 1 }}>
              {saving ? 'Saving...' : 'Save Artist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
