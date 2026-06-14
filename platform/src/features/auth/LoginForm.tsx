import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';
import { useAuthRedirect } from '../../hooks/useAuthRedirect';

export default function LoginForm({ onForgotPassword }: { onForgotPassword?: () => void }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [otpMode, setOtpMode] = useState(false);
  const [token, setToken] = useState('');

  const handleSSO = async (provider: 'google' | 'apple') => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } });
      if (error) throw error;
    } catch (err: any) {
      showToast("Error during SSO: " + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (otpMode) {
        const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
        if (error) throw error;
        // The listener in Navbar or App handles redirect on auth state change
      } else {
        const { error } = await supabase.auth.signInWithOtp({ phone });
        if (error) throw error;
        setOtpMode(true);
        showToast("SMS sent! Enter the code.", 'success');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 style={{ margin: '0 0 8px 0' }}>Typo-Proof Login</h2>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Use your existing accounts or phone number to ensure your tickets never get lost in a misspelled inbox.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
        <button onClick={() => handleSSO('apple')} disabled={loading} className="btn-secondary" style={{ width: '100%', padding: '16px', fontSize: '1.1rem', backgroundColor: '#000', color: '#fff', borderColor: '#333' }}>
           Continue with Apple
        </button>
        <button onClick={() => handleSSO('google')} disabled={loading} className="btn-secondary" style={{ width: '100%', padding: '16px', fontSize: '1.1rem', backgroundColor: '#fff', color: '#000' }}>
          G Continue with Google
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', color: 'var(--text-secondary)' }}>
        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
        <span style={{ padding: '0 16px', fontSize: '0.9rem' }}>OR PHONE NUMBER</span>
        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
      </div>

      <form onSubmit={handlePhoneSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {!otpMode ? (
          <input 
            required 
            type="tel" 
            placeholder="+1 234 567 8900" 
            className="input-field"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        ) : (
          <input 
            required 
            type="text" 
            placeholder="Enter 6-digit SMS code" 
            className="input-field"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        )}

        <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}>
          {loading ? 'Please wait...' : (otpMode ? 'Verify SMS Code' : 'Send SMS Code')}
        </button>
      </form>
    </>
  );
}
