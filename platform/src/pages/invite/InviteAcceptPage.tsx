import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInviteLink } from '../../hooks/useInviteLink';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';

export default function InviteAcceptPage() {
  const { rawToken } = useParams<{ rawToken: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { validation, isValidating, isClaiming, claim, error } = useInviteLink(rawToken || '');
  
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

  if (isValidating) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }}>
        <p>Validating your invite...</p>
      </div>
    );
  }

  if (error || !validation || !validation.valid) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }}>
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', maxWidth: '400px' }}>
          <h2>Invalid Invite</h2>
          <p style={{ color: 'var(--text-secondary)' }}>{validation?.reason || error || 'This invite link is invalid or has expired.'}</p>
        </div>
      </div>
    );
  }

  const handleClaimExisting = async () => {
    try {
      const res = await claim();
      showToast(`Successfully joined ${validation.entityName}!`, 'success');
      navigate(`/${validation.entityType}/${validation.entityId}/dashboard`);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) throw signUpError;
      
      const res = await claim();
      showToast(`Account created and linked to ${validation.entityName}!`, 'success');
      navigate(`/${validation.entityType}/${validation.entityId}/dashboard`);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }}>
      <div className="glass-panel" style={{ padding: '40px', maxWidth: '480px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ margin: '0 0 16px 0', fontSize: '1.5rem' }}>You've been invited!</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Join <strong>{validation.entityName}</strong> on Admit.</p>
        </div>

        {session ? (
          <div>
            <p style={{ textAlign: 'center', marginBottom: '24px' }}>
              You're currently signed in as <strong>{session.user.email}</strong>.
            </p>
            <button 
              className="btn-primary" 
              onClick={handleClaimExisting} 
              disabled={isClaiming}
              style={{ width: '100%', padding: '16px', fontSize: '1.1rem', marginBottom: '16px' }}
            >
              {isClaiming ? 'Linking...' : 'Accept Invite'}
            </button>
            <button 
              className="btn-secondary" 
              onClick={() => supabase.auth.signOut()} 
              style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}
            >
              Sign out & create new account
            </button>
          </div>
        ) : (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input 
              type="email" 
              required 
              placeholder="Email address" 
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              defaultValue={validation.inviteeEmail || ''}
            />
            <input 
              type="password" 
              required 
              placeholder="Password (min 12 chars)" 
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={12}
            />
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={isClaiming}
              style={{ width: '100%', padding: '16px', fontSize: '1.1rem', marginTop: '16px' }}
            >
              {isClaiming ? 'Creating account...' : 'Create Account & Join'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
