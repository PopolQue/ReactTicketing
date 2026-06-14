import React, { useState, useEffect } from 'react';
import LoginForm from '../../features/auth/LoginForm';
import SignUpForm from '../../features/auth/SignUpForm';
import ForgotPasswordForm from '../../features/auth/ForgotPasswordForm';
import UpdatePasswordForm from '../../features/auth/UpdatePasswordForm';

export default function Auth() {
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot-password' | 'update-password'>('login');
  
  useEffect(() => {
    if (window.location.hash.includes('type=recovery')) {
      // eslint-disable-next-line
      setAuthMode('update-password');
    }
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)' }}>
      <div className="glass-panel" style={{ padding: '40px', width: '100%', maxWidth: '400px' }}>
        
        {authMode === 'login' && <LoginForm onForgotPassword={() => setAuthMode('forgot-password')} />}
        {authMode === 'signup' && <SignUpForm />}
        {authMode === 'forgot-password' && <ForgotPasswordForm />}
        {authMode === 'update-password' && <UpdatePasswordForm onComplete={() => setAuthMode('login')} />}

        {authMode !== 'update-password' && (
          <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-secondary)', marginBottom: 0 }}>
            {authMode === 'login' ? "Don't have an account? " : 
             authMode === 'signup' ? "Already have an account? " : 
             "Remember your password? "}
             
            <button 
              type="button"
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'signup' : 'login');
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
