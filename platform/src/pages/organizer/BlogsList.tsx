import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Entity } from '../../components/EntitySwitcher';
import { useToast } from '../../components/Toast';
import BlogFormModal from '../../components/modals/BlogFormModal';
import { useLanguage } from '../../contexts/LanguageContext';

export default function BlogsList() {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const { activeEntity } = useOutletContext<{ activeEntity: Entity }>();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', excerpt: '', content: '', published: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBlogs();
  }, [activeEntity]);

  async function fetchBlogs() {
    if (!activeEntity) return;

    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('author_id', activeEntity.id)
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
        <h2>{t("organizer.blogs.title")}</h2>
        <button className="btn-primary" onClick={openCreateModal}>{t("organizer.blogs.addPost")}</button>
      </div>

      {loading ? <p>{t("organizer.blogs.loading")}</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {blogs.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)' }}>{t("organizer.blogs.noBlogs")}</p>
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
                <button onClick={() => openEditModal(blog)} className="btn-secondary">{t("organizer.blogs.editPost")}</button>
              </div>
            ))
          )}
        </div>
      )}

      <BlogFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        editingBlogId={editingBlogId}
        saving={saving}
      />
    </div>
  );
}
