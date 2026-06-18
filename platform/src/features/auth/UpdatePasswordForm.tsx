import { useLanguage } from "../../contexts/LanguageContext";
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';
export default function UpdatePasswordForm({
  onComplete
}: {
  onComplete: () => void;
}) {
  const {
    t
  } = useLanguage();
  const {
    showToast
  } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const {
        error
      } = await supabase.auth.updateUser({
        password: password
      });
      if (error) throw error;
      showToast('Your password has been updated successfully.', 'success');
      onComplete();
    } catch (err: any) {
      showToast("Error updating password: " + err.message, 'error');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  return <>
      <div style={{
      textAlign: 'center',
      marginBottom: '24px'
    }}>
        <h2 style={{
        margin: '0 0 8px 0'
      }}>{t("updatePassword")}</h2>
        <p style={{
        margin: 0,
        color: 'var(--text-secondary)'
      }}>{t("enterYourNewPasswordBelow")}</p>
      </div>

      {error && <div style={{
      padding: '12px',
      backgroundColor: 'rgba(239, 68, 68, 0.2)',
      border: '1px solid #ef4444',
      color: '#fca5a5',
      borderRadius: '8px',
      marginBottom: '16px',
      fontSize: '0.9rem'
    }}>
          {error}
        </div>}

      <form onSubmit={handleSubmit} style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
        <input required type="password" placeholder={t("newPasswordMin8Chars")} className="input-field" value={password} onChange={e => setPassword(e.target.value)} minLength={8} pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':&quot;|<>?,./`~]).{8,}$" title="Must contain at least 8 characters, including uppercase, lowercase, numbers, and symbols" />
        <input required type="password" placeholder="Confirm new password" className="input-field" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={8} pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':&quot;|<>?,./`~]).{8,}$" title="Must contain at least 8 characters, including uppercase, lowercase, numbers, and symbols" />
        <button type="submit" disabled={loading} className="btn-primary" style={{
        marginTop: '8px',
        width: '100%',
        opacity: loading ? 0.7 : 1
      }}>
          {loading ? 'Please wait...' : 'Update Password'}
        </button>
      </form>
    </>;
}