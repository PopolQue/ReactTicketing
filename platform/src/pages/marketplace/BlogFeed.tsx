import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function BlogFeed() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPublishedBlogs() {
      const { data } = await supabase
        .from('blogs')
        .select('*, author_id(company_name)')
        .eq('published', true)
        .order('created_at', { ascending: false });

      setBlogs(data || []);
      setLoading(false);
    }
    fetchPublishedBlogs();
    document.title = 'Community Blog | Ticketeer';
  }, []);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '60px 20px', minHeight: '100vh' }}>
      

      {loading ? (
        <p style={{ textAlign: 'center' }}>Loading stories...</p>
      ) : blogs.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
          <h3>No stories published yet.</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Check back soon!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {blogs.map(blog => (
            <Link key={blog.id} to={`/blogs/${blog.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <article className="glass-panel" style={{ padding: '32px', transition: 'transform 0.2s', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <h2 style={{ fontSize: '2rem', marginBottom: '16px', color: 'var(--accent)' }}>{blog.title}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '24px', lineHeight: '1.6' }}>{blog.excerpt}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <span>By {blog.author_id?.company_name || 'Anonymous'}</span>
                  <span>{new Date(blog.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
