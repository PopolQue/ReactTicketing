import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';

export default function ContactSupport() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    email: '',
    subject: '',
    message: '',
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUser(data.user);
        setFormData((prev) => ({ ...prev, email: data.user.email || '' }));
      }
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('support_tickets').insert([
      {
        user_id: user?.id || null,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
        status: 'open',
      },
    ]);

    setLoading(false);

    if (error) {
      showToast('Failed to submit ticket. Please try again.', 'error');
      console.error(error);
    } else {
      showToast('Support ticket submitted successfully! We will email you shortly.', 'success');
      setFormData({ email: user?.email || '', subject: '', message: '' });
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '60px auto', padding: '0 20px' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Contact Support</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
        Having trouble with an event or ticket? Let us know and our team will get back to you as
        soon as possible.
      </p>

      <form
        onSubmit={handleSubmit}
        className="glass-panel"
        style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}
      >
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
            Email Address
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="input-field"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
            Subject
          </label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
            className="input-field"
            placeholder="e.g. Can't access my VIP ticket"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
            Message
          </label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            className="input-field"
            rows={6}
            placeholder="Please describe your issue in detail..."
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
          style={{ marginTop: '12px' }}
        >
          {loading ? 'Submitting...' : 'Submit Support Ticket'}
        </button>
      </form>
    </div>
  );
}
