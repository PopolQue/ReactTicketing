import React from 'react';
import Modal from '../Modal';

export default function BlogFormModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  editingBlogId,
  saving
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: any;
  setFormData: any;
  editingBlogId: string | null;
  saving: boolean;
}) {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={editingBlogId ? 'Edit Blog Post' : 'Create Blog Post'}
      maxWidth="800px"
    >
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Title</label>
            <input 
              type="text" 
              className="input-field" 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})} 
              required 
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Excerpt</label>
            <textarea 
              className="input-field" 
              rows={2}
              value={formData.excerpt} 
              onChange={e => setFormData({...formData, excerpt: e.target.value})} 
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Content (Markdown Supported)</label>
            <textarea 
              className="input-field" 
              rows={10}
              value={formData.content} 
              onChange={e => setFormData({...formData, content: e.target.value})} 
              required
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            <input 
              type="checkbox" 
              id="published_status"
              checked={formData.published}
              onChange={e => setFormData({...formData, published: e.target.checked})}
            />
            <label htmlFor="published_status" style={{ color: 'var(--text-primary)' }}>Publish immediately</label>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary" style={{ flex: 1 }}>
              {saving ? 'Saving...' : 'Save Blog Post'}
            </button>
          </div>
      </form>
    </Modal>
  );
}
