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
        .select('*, organizers(name)')
        .eq('slug', slug)
        .eq('published', true)
        .single();

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
      
      

      <div className="blog-content" style={{ fontSize: '1.2rem', lineHeight: '1.8', color: 'var(--text)' }}>
        {/* In a real app, you would use a markdown renderer here or dangerouslySetInnerHTML after sanitizing */}
        {blog.content.split('\n').map((paragraph: string, i: number) => (
          <p key={i} style={{ marginBottom: '24px' }}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
