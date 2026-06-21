import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../contexts/LanguageContext';

export default function BlogFeed() {
  const { t } = useLanguage();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPublishedBlogs() {
      const { data } = await supabase
        .from('blogs')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (data) {
        // Fetch author details manually since author_id could be an organizer or a writer
        const authorIds = [...new Set(data.map((b) => b.author_id))].filter(Boolean);

        let authorsMap: Record<string, string> = {};

        if (authorIds.length > 0) {
          const { data: orgs } = await supabase
            .from('organizer_profiles')
            .select('id, company_name')
            .in('id', authorIds);
          const { data: writers } = await supabase
            .from('writer_profiles')
            .select('id, pen_name')
            .in('id', authorIds);

          orgs?.forEach((o) => (authorsMap[o.id] = o.company_name));
          writers?.forEach((w) => (authorsMap[w.id] = w.pen_name));
        }

        const enrichedBlogs = data.map((b) => ({
          ...b,
          author_name: authorsMap[b.author_id] || 'Anonymous',
        }));

        setBlogs(enrichedBlogs);
      } else {
        setBlogs([]);
      }
      setLoading(false);
    }
    fetchPublishedBlogs();
    document.title = 'Community Blog | Ticketeer';
  }, []);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '60px 20px', minHeight: '100vh' }}>
      {loading ? (
        <p style={{ textAlign: 'center' }}>{t('marketplace.blogFeed.loading')}</p>
      ) : blogs.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
          <h3>{t('marketplace.blogFeed.noStories')}</h3>
          <p style={{ color: 'var(--text-secondary)' }}>{t('marketplace.blogFeed.checkBack')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {blogs.map((blog) => (
            <Link
              key={blog.id}
              to={`/blogs/${blog.slug}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <article
                className="glass-panel"
                style={{ padding: '32px', transition: 'transform 0.2s', cursor: 'pointer' }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <h2 style={{ fontSize: '2rem', marginBottom: '16px', color: 'var(--accent)' }}>
                  {blog.title}
                </h2>
                <p
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '1.1rem',
                    marginBottom: '24px',
                    lineHeight: '1.6',
                  }}
                >
                  {blog.excerpt}
                </p>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem',
                  }}
                >
                  <span>
                    {t('marketplace.blogFeed.by')}
                    {blog.author_name}
                  </span>
                  <span>
                    {new Date(blog.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
