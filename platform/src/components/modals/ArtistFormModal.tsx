import React from 'react';
import Modal from '../Modal';

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
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={editingArtistId ? 'Edit Artist' : 'Create Artist'}
      maxWidth="500px"
    >
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
    </Modal>
  );
}
