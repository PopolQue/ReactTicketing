import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

export default function WriterApplication() {
  console.log('DEBUG: WriterApplication component rendered');
  const { t } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    pen_name: '',
    bio: '',
    samples: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        showToast(t('marketplace.writerApplication.loginToApply'), 'error');
        navigate('/auth', { state: { from: location } });
      }
    }
    checkAuth();
  }, [navigate, t, showToast, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('DEBUG: handleSubmit triggered');
    e.preventDefault();
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session || !session.user) {
      navigate('/auth');
      return;
    }

    const { error } = await supabase.from('writer_applications').insert([
      {
        user_id: session.user.id,
        pen_name: form.pen_name,
        bio: form.bio,
        samples: form.samples,
        status: 'pending',
      },
    ]);

    if (error) {
      showToast(t('marketplace.writerApplication.errorSubmitting') + error.message, 'error');
    } else {
      setSubmitted(true);
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div
        className="claim-portal"
        style={{
          minHeight: '80vh',
          padding: '60px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          className="glass-panel"
          style={{ padding: '60px', maxWidth: '600px', textAlign: 'center' }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px auto',
              color: '#10b981',
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h2 style={{ marginBottom: '16px' }}>
            {t('marketplace.writerApplication.applicationReceived')}
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: 1.6 }}>
            {t('marketplace.writerApplication.thankYou')}
          </p>
          <Link to="/" className="btn-primary" style={{ textDecoration: 'none' }}>
            {t('marketplace.writerApplication.returnHome')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="claim-portal"
      style={{ minHeight: '80vh', padding: '60px 40px', maxWidth: '800px', margin: '0 auto' }}
    >
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>
          {t('marketplace.writerApplication.title')}
        </h1>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '1.1rem',
            maxWidth: '600px',
            margin: '0 auto',
          }}
        >
          {t('marketplace.writerApplication.subtitle')}
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '40px' }}>
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
        >
          <div>
            <label
              style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}
            >
              {t('marketplace.writerApplication.penNameLabel')}
            </label>
            <input
              required
              type="text"
              className="input-field"
              placeholder={t('marketplace.writerApplication.penNamePlaceholder')}
              value={form.pen_name}
              onChange={(e) => setForm({ ...form, pen_name: e.target.value })}
            />
          </div>

          <div>
            <label
              style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}
            >
              {t('marketplace.writerApplication.bioLabel')}
            </label>
            <textarea
              required
              rows={3}
              className="input-field"
              placeholder={t('marketplace.writerApplication.bioPlaceholder')}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </div>

          <div>
            <label
              style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}
            >
              {t('marketplace.writerApplication.samplesLabel')}
            </label>
            <textarea
              required
              rows={6}
              className="input-field"
              placeholder={t('marketplace.writerApplication.samplesPlaceholder')}
              value={form.samples}
              onChange={(e) => setForm({ ...form, samples: e.target.value })}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ padding: '16px', fontSize: '1.1rem', marginTop: '16px' }}
          >
            {loading
              ? t('marketplace.writerApplication.submitting')
              : t('marketplace.writerApplication.submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
