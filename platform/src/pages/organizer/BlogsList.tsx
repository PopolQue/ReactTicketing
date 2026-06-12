import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';

export default function BlogsList() {
  const { showToast } = useToast();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  async function createDemoBlog() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const title = 'New Blog Post ' + Math.floor(Math.random() * 100);
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const { error } = await supabase.from('blogs').insert([
      {
        title,
        slug,
        content: 'This is the body of the blog post...',
        excerpt: 'A short teaser...',
        published: false,
        author_id: user.id
      }
    ]);

    if (error) {
      showToast('Error creating blog post', 'error');
    } else {
      showToast('Blog created successfully', 'success');
      fetchBlogs();
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>Manage Blogs</h2>
        <button className="btn-primary" onClick={createDemoBlog}>+ Add Blog Post</button>
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
                <button className="btn-secondary">Edit Post</button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
