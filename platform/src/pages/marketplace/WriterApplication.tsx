import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';
import { useNavigate, Link } from 'react-router-dom';

export default function WriterApplication() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    pen_name: '',
    bio: '',
    samples: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showToast("You must be logged in to apply.", "error");
      navigate('/auth');
      return;
    }

    const { error } = await supabase.from('writer_applications').insert([{
      user_id: user.id,
      pen_name: form.pen_name,
      bio: form.bio,
      samples: form.samples,
      status: 'pending'
    }]);

    if (error) {
      showToast("Error submitting application: " + error.message, "error");
    } else {
      setSubmitted(true);
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="claim-portal" style={{ minHeight: '80vh', padding: '60px 40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ padding: '60px', maxWidth: '600px', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', color: '#10b981' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <h2 style={{ marginBottom: '16px' }}>Application Received</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: 1.6 }}>
            Thank you for applying to become a verified Writer on Admit. Our editorial team will review your samples shortly.
          </p>
          <Link to="/" className="btn-primary" style={{ textDecoration: 'none' }}>Return Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="claim-portal" style={{ minHeight: '80vh', padding: '60px 40px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Become a Writer</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          Join the Admit editorial team. Share your voice, review events, and shape the culture.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '40px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Pen Name / Display Name</label>
            <input 
              required
              type="text" 
              className="input-field" 
              placeholder="e.g. Alex The Critic"
              value={form.pen_name}
              onChange={e => setForm({...form, pen_name: e.target.value})}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Short Bio</label>
            <textarea 
              required
              rows={3}
              className="input-field" 
              placeholder="Tell us about yourself and what you love to write about."
              value={form.bio}
              onChange={e => setForm({...form, bio: e.target.value})}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Writing Samples</label>
            <textarea 
              required
              rows={6}
              className="input-field" 
              placeholder="Paste links to your previous work, or paste a short writing sample directly here."
              value={form.samples}
              onChange={e => setForm({...form, samples: e.target.value})}
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
            style={{ padding: '16px', fontSize: '1.1rem', marginTop: '16px' }}
          >
            {loading ? 'Submitting Application...' : 'Submit Application'}
          </button>
          
        </form>
      </div>
    </div>
  );
}
