import React from 'react';

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
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px', overflowY: 'auto' }}>
      <div className="glass-panel" style={{ padding: '40px', width: '100%', maxWidth: '800px', margin: 'auto' }}>
        <h2 style={{ marginTop: 0, marginBottom: '24px' }}>{editingBlogId ? 'Edit Blog Post' : 'Create Blog Post'}</h2>
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
      </div>
    </div>
  );
}
