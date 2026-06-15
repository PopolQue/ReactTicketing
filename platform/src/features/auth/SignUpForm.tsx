import { useLanguage } from "../../contexts/LanguageContext";
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';
export default function SignUpForm({
  onSwitchToLogin
}: {
  onSwitchToLogin: () => void;
}) {
  const {
    t
  } = useLanguage();
  const {
    showToast
  } = useToast();
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [otpMode, setOtpMode] = useState(false);
  const [token, setToken] = useState('');
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
        const {
          error
        } = await supabase.auth.verifyOtp({
          phone,
          token,
          type: 'sms'
        });
        if (error) throw error;
        // The listener in Navbar or App handles redirect on auth state change
      } else {
        const {
          error
        } = await supabase.auth.signInWithOtp({
          phone
        });
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
  return <>
      <div style={{
      textAlign: 'center',
      marginBottom: '32px'
    }}>
        <h2 style={{
        margin: '0 0 8px 0'
      }}>{t("typoProofSignUp")}</h2>
        <p style={{
        margin: 0,
        color: 'var(--text-secondary)'
      }}>{t("forgetManualPasswordsSecur")}</p>
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
      }}>{t("orPhoneNumber")}</span>
        <div style={{
        flex: 1,
        height: '1px',
        backgroundColor: 'var(--border)'
      }} />
      </div>

      <form onSubmit={handlePhoneSubmit} style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
        {!otpMode ? <input required type="tel" placeholder="+1 234 567 8900" className="input-field" value={phone} onChange={e => setPhone(e.target.value)} /> : <input required type="text" placeholder={t("enter6DigitSmsCode")} className="input-field" value={token} onChange={e => setToken(e.target.value)} />}

        <button type="submit" disabled={loading} className="btn-primary" style={{
        width: '100%',
        padding: '16px',
        fontSize: '1.1rem'
      }}>
          {loading ? 'Please wait...' : otpMode ? 'Verify SMS Code' : 'Send SMS Code'}
        </button>
      </form>

      <div style={{
      textAlign: 'center',
      marginTop: '24px',
      fontSize: '0.9rem'
    }}>
        <span style={{
        color: 'var(--text-secondary)'
      }}>{t("alreadyHaveAnAccount")}</span>
        <button onClick={onSwitchToLogin} style={{
        background: 'none',
        border: 'none',
        color: 'var(--accent)',
        cursor: 'pointer',
        fontWeight: 'bold'
      }}>{t("logIn")}</button>
      </div>
    </>;
}