import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';
import { useAuthRedirect } from '../../hooks/useAuthRedirect';

export default function SignUpForm() {
  const { showToast } = useToast();
  const { redirectAfterSignup } = useAuthRedirect();
  const [accountType, setAccountType] = useState<'fan' | 'organizer' | 'artist'>('fan');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

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
      }

      redirectAfterSignup(accountType);
    } catch (err: any) {
      showToast("Error during signup: " + err.message, 'error');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 8px 0' }}>Create an Account</h2>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Join the future of ticketing</p>
      </div>

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
      
      {error && (
        <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#fca5a5', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {accountType === 'organizer' && (
          <input 
            required 
            type="text" 
            placeholder="Company / Organizer Name" 
            className="input-field"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        )}
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
          placeholder="Password (min 6 chars)" 
          className="input-field"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
        />

        <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '8px', width: '100%', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Please wait...' : 'Create Account'}
        </button>
      </form>
    </>
  );
}
