import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';
import { useAuthRedirect } from '../../hooks/useAuthRedirect';

export default function LoginForm({ onForgotPassword }: { onForgotPassword: () => void }) {
  const { showToast } = useToast();
  const { redirectAfterLogin } = useAuthRedirect();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await redirectAfterLogin();
    } catch (err: any) {
      showToast("Error during sign in: " + err.message, 'error');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 8px 0' }}>Welcome Back</h2>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Log in to continue</p>
      </div>

      {error && (
        <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#fca5a5', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <input 
          required 
          type="email" 
          placeholder="Email address" 
          className="input-field"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input 
          required 
          type="password" 
          placeholder="Password" 
          className="input-field"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        
        <div style={{ textAlign: 'right', marginTop: '-8px' }}>
          <button 
            type="button" 
            onClick={onForgotPassword}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            Forgot your password?
          </button>
        </div>

        <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Please wait...' : 'Sign In'}
        </button>
      </form>
    </>
  );
}
