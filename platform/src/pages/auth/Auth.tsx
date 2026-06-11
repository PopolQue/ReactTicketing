import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
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
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        navigate('/organizer');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        // If signup is successful, we immediately create their Organizer Profile
        // This is required before they can create events because of our foreign key constraint.
        if (data?.user) {
          const { error: profileError } = await supabase
            .from('organizer_profiles')
            .insert([
              { id: data.user.id, company_name: companyName || 'My Ticketing Co' }
            ]);
            
          if (profileError) {
             console.error("Profile creation error:", profileError);
             throw new Error("Account created, but failed to setup organizer profile. Try logging in.");
          }
        }

        navigate('/organizer');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)' }}>
      <div className="glass-panel" style={{ padding: '40px', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '24px', marginTop: 0 }}>
          {isLogin ? 'Organizer Login' : 'Organizer Sign Up'}
        </h2>
        
        {error && (
          <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#fca5a5', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!isLogin && (
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
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-secondary)', marginBottom: 0 }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0, fontSize: '1rem', fontWeight: 600 }}
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
}
