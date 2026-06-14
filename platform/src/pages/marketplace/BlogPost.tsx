import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function BlogPost() {
  const { slug } = useParams();
  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBlog() {
      const { data } = await supabase
        .from('blogs')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .single();

      if (data && data.author_id) {
        const { data: org } = await supabase.from('organizer_profiles').select('company_name').eq('id', data.author_id).single();
        const { data: writer } = await supabase.from('writer_profiles').select('pen_name').eq('id', data.author_id).single();
        
        data.author_name = org?.company_name || writer?.pen_name || 'Anonymous';
      }

      setBlog(data);
      setLoading(false);
      if (data) document.title = `${data.title} | Ticketeer Blog`;
    }
    fetchBlog();
  }, [slug]);

  if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}>Loading...</div>;

  if (!blog) return (
    <div style={{ padding: '100px', textAlign: 'center' }}>
      <h1>Post Not Found</h1>
      <Link to="/blogs" className="btn-secondary">Back to Blog</Link>
    </div>
  );

  return (
    <article style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 20px', minHeight: '100vh' }}>
      <Link to="/blogs" className="btn-nav" style={{ padding: '8px 0', color: 'var(--accent)', marginBottom: '32px', display: 'inline-block' }}>
        &larr; Back to all stories
      </Link>
      <h1 style={{ fontSize: '3rem', marginBottom: '16px', color: 'var(--text-primary)' }}>{blog.title}</h1>
      <div style={{ marginBottom: '32px', color: 'var(--text-secondary)' }}>
        By <span style={{ color: 'var(--accent)' }}>{blog.author_name}</span> | {new Date(blog.created_at).toLocaleDateString()}
      </div>

      <div className="blog-content" style={{ fontSize: '1.2rem', lineHeight: '1.8', color: 'var(--text)' }}>
        {/* In a real app, you would use a markdown renderer here or dangerouslySetInnerHTML after sanitizing */}
        {blog.content.split('\n').map((paragraph: string, i: number) => (
          <p key={i} style={{ marginBottom: '24px' }}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
