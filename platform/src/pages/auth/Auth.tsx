import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';

export default function Auth() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot-password' | 'update-password'>('login');
  const [accountType, setAccountType] = useState<'fan' | 'organizer' | 'artist'>('fan');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  
  // Use location state to redirect back to the page the user came from, if available
  const { state } = useLocation();
  const from = state?.from?.pathname || '/';

  React.useEffect(() => {
    if (window.location.hash.includes('type=recovery')) {
      setAuthMode('update-password');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        // Try to fetch organizer profile to determine redirect
        const { data: user } = await supabase.auth.getUser();
        if (user.user) {
          const { data: profile } = await supabase.from('organizers').select('id').eq('claimed_by_user_id', user.user.id).limit(1).single();
          if (profile) {
             navigate('/organizer');
             return;
          }
          
          const { data: artistClaim } = await supabase.from('entity_claims').select('id').eq('user_id', user.user.id).eq('entity_type', 'artist').limit(1).single();
          if (artistClaim) {
             navigate('/artist');
             return;
          }
        }
        navigate(from === '/auth' ? '/' : from);
      } else if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        // Create Organizer Profile only if they selected 'organizer'
        if (data?.user && accountType === 'organizer') {
          const { error: profileError } = await supabase
            .from('organizers')
            .insert([
              { claimed_by_user_id: data.user.id, name: companyName || 'My Ticketing Co', is_verified: true }
            ]);
            
          if (profileError) {
             console.error("Profile creation error:", profileError);
             throw new Error("Account created, but failed to setup organizer profile. Try logging in.");
          }
          navigate('/organizer');
          return;
        }

        // Redirect artists to artist portal
        if (data?.user && accountType === 'artist') {
          navigate('/artist');
          return;
        }

        navigate(from === '/auth' ? '/' : from);
      } else if (authMode === 'forgot-password') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/auth'
        });
        if (error) throw error;
        setMessage('Check your email for the password reset link.');
      } else if (authMode === 'update-password') {
        const { error } = await supabase.auth.updateUser({
          password: password
        });
        if (error) throw error;
        setMessage('Your password has been updated successfully.');
        setAuthMode('login');
      }
    } catch (err: any) {
      showToast("Error during signup: " + err.message, 'error');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)' }}>
      <div className="glass-panel" style={{ padding: '40px', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '8px', marginTop: 0 }}>
          {authMode === 'login' ? 'Welcome Back' : 
           authMode === 'signup' ? 'Create an Account' :
           authMode === 'forgot-password' ? 'Reset Password' :
           'Update Password'}
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          {authMode === 'login' ? 'Log in to continue' : 
           authMode === 'signup' ? 'Join the future of ticketing' :
           authMode === 'forgot-password' ? 'Enter your email to receive a reset link' :
           'Enter your new password below'}
        </p>

        {authMode === 'signup' && (
          <div style={{ display: 'flex', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px', marginBottom: '24px' }}>
            <button 
              type="button"
              onClick={() => setAccountType('fan')}
              style={{ flex: 1, padding: '8px 4px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 500, transition: '0.2s', backgroundColor: accountType === 'fan' ? 'var(--accent)' : 'transparent', color: accountType === 'fan' ? 'white' : 'var(--text-secondary)' }}
            >
              Fan
            </button>
            <button 
              type="button"
              onClick={() => setAccountType('organizer')}
              style={{ flex: 1, padding: '8px 4px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 500, transition: '0.2s', backgroundColor: accountType === 'organizer' ? 'var(--accent)' : 'transparent', color: accountType === 'organizer' ? 'white' : 'var(--text-secondary)' }}
            >
              Organizer
            </button>
            <button 
              type="button"
              onClick={() => setAccountType('artist')}
              style={{ flex: 1, padding: '8px 4px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 500, transition: '0.2s', backgroundColor: accountType === 'artist' ? 'var(--accent)' : 'transparent', color: accountType === 'artist' ? 'white' : 'var(--text-secondary)' }}
            >
              Artist
            </button>
          </div>
        )}
        
        {error && (
          <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#fca5a5', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{ padding: '12px', backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#6ee7b7', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {authMode === 'signup' && accountType === 'organizer' && (
            <input 
              required 
              type="text" 
              placeholder="Company / Organizer Name" 
              className="input-field"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          )}
          {authMode !== 'update-password' && (
            <input 
              required 
              type="email" 
              placeholder="Email address" 
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}
          {authMode !== 'forgot-password' && (
            <input 
              required 
              type="password" 
              placeholder="Password (min 6 chars)" 
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
            />
          )}
          
          {authMode === 'login' && (
            <div style={{ textAlign: 'right', marginTop: '-8px' }}>
              <button 
                type="button" 
                onClick={() => setAuthMode('forgot-password')}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Forgot your password?
              </button>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '8px', width: '100%', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Please wait...' : 
             authMode === 'login' ? 'Sign In' : 
             authMode === 'signup' ? 'Create Account' : 
             authMode === 'forgot-password' ? 'Send Reset Link' :
             'Update Password'}
          </button>
        </form>

        {authMode !== 'update-password' && (
          <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-secondary)', marginBottom: 0 }}>
            {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button"
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'signup' : 'login');
                setError(null);
                setMessage(null);
              }}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0, fontSize: '1rem', fontWeight: 600 }}
            >
              {authMode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
