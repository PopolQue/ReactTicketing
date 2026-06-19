import { useLanguage } from "../../contexts/LanguageContext";
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';
import { useAuthRedirect } from '../../hooks/useAuthRedirect';
import { usePostHog } from '@posthog/react';
export default function LoginForm({
  onForgotPassword
}: {
  onForgotPassword?: () => void;
}) {
  const {
    t
  } = useLanguage();
  const {
    showToast
  } = useToast();
  const { redirectAfterLogin } = useAuthRedirect();
  const posthog = usePostHog();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSSO = async (provider: 'google' | 'apple') => {
    setLoading(true);
    try {
      const {
        error
      } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
      posthog?.capture('user_logged_in', { method: provider });
    } catch (err: any) {
      showToast("Error during SSO: " + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
        posthog?.identify(data.user.id, { email: data.user.email });
        posthog?.capture('user_logged_in', { method: 'email' });
        showToast("Logged in successfully!", 'success');
        await redirectAfterLogin();
    } catch (err: any) {
        showToast(err.message, 'error');
    } finally {
        setLoading(false);
    }
  };

  return <>
      <div style={{
      textAlign: 'center',
      marginBottom: '32px'
    }}>
        <h2 style={{
        margin: '0 0 8px 0'
      }}>{t("typoProofLogin")}</h2>
        <p style={{
        margin: 0,
        color: 'var(--text-secondary)'
      }}>{t("useYourExistingAccountsOr")}</p>
      </div>

      <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      marginBottom: '32px'
    }}>
        <button onClick={() => handleSSO('apple')} disabled={loading} className="btn-secondary" style={{
        width: '100%',
        padding: '16px',
        fontSize: '1.1rem',
        backgroundColor: '#000',
        color: '#fff',
        borderColor: '#333'
      }}>{t("ContinueWithApple")}</button>
        <button onClick={() => handleSSO('google')} disabled={loading} className="btn-secondary" style={{
        width: '100%',
        padding: '16px',
        fontSize: '1.1rem',
        backgroundColor: '#fff',
        color: '#000'
      }}>{t("gContinueWithGoogle")}</button>
      </div>

      <div style={{
      display: 'flex',
      alignItems: 'center',
      margin: '24px 0',
      color: 'var(--text-secondary)'
    }}>
        <div style={{
        flex: 1,
        height: '1px',
        backgroundColor: 'var(--border)'
      }} />
        <span style={{
        padding: '0 16px',
        fontSize: '0.9rem'
      }}>{t("orEmail")}</span>
        <div style={{
        flex: 1,
        height: '1px',
        backgroundColor: 'var(--border)'
      }} />
      </div>

      <form onSubmit={handleEmailSubmit} style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
        <input required type="email" placeholder="Email" className="input-field" value={email} onChange={e => setEmail(e.target.value)} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <input required type="password" placeholder="Password" className="input-field" value={password} onChange={e => setPassword(e.target.value)} />
          <button
            type="button"
            onClick={onForgotPassword}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              textAlign: 'right',
              padding: '4px 0'
            }}
          >
            Forgot password?
          </button>
        </div>

        <button type="submit" disabled={loading} className="btn-primary" style={{
        width: '100%',
        padding: '16px',
        fontSize: '1.1rem'
      }}>
          {loading ? 'Please wait...' : 'Log In'}
        </button>
      </form>
    </>;
}