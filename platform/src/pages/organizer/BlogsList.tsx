import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';

export default function BlogsList() {
  const { showToast } = useToast();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', excerpt: '', content: '', published: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBlogs();
  }, []);

  async function fetchBlogs() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      showToast('Error loading blogs: ' + error.message, 'error');
    } else {
      setBlogs(data || []);
    }
    setLoading(false);
  }

  const openCreateModal = () => {
    setEditingBlogId(null);
    setFormData({ title: '', excerpt: '', content: '', published: false });
    setIsModalOpen(true);
  };

  const openEditModal = (blog: any) => {
    setEditingBlogId(blog.id);
    setFormData({ title: blog.title, excerpt: blog.excerpt || '', content: blog.content || '', published: blog.published });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    if (editingBlogId) {
      const { error } = await supabase
        .from('blogs')
        .update({ title: formData.title, slug, excerpt: formData.excerpt, content: formData.content, published: formData.published })
        .eq('id', editingBlogId);

      if (error) showToast('Error updating blog: ' + error.message, 'error');
      else {
        showToast('Blog updated successfully', 'success');
        setIsModalOpen(false);
        fetchBlogs();
      }
    } else {
      const { error } = await supabase.from('blogs').insert([
        {
          title: formData.title,
          slug,
          excerpt: formData.excerpt,
          content: formData.content,
          published: formData.published,
          author_id: user.id
        }
      ]);

      if (error) showToast('Error creating blog: ' + error.message, 'error');
      else {
        showToast('Blog created successfully', 'success');
        setIsModalOpen(false);
        fetchBlogs();
      }
    }
    setSaving(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>Manage Blogs</h2>
        <button className="btn-primary" onClick={openCreateModal}>+ Add Blog Post</button>
      </div>

      {loading ? <p>Loading blogs...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {blogs.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)' }}>You haven't written any blog posts yet.</p>
            </div>
          ) : (
            blogs.map(blog => (
              <div key={blog.id} className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0' }}>{blog.title}</h3>
                  <p style={{ margin: '0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Status: <span style={{ color: blog.published ? '#4ade80' : '#facc15' }}>{blog.published ? 'Published' : 'Draft'}</span>
                  </p>
                </div>
                <button onClick={() => openEditModal(blog)} className="btn-secondary">Edit Post</button>
              </div>
            ))
          )}
        </div>
      )}

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px', overflowY: 'auto' }}>
          <div className="glass-panel" style={{ padding: '40px', width: '100%', maxWidth: '800px', margin: 'auto' }}>
            <h2 style={{ marginTop: 0, marginBottom: '24px' }}>{editingBlogId ? 'Edit Blog Post' : 'Create Blog Post'}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary" style={{ flex: 1 }}>
                  {saving ? 'Saving...' : 'Save Blog Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
