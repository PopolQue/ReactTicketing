import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';

export default function Profile() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setEmail(user.email || '');

    const { data, error } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('id', user.id);

    if (data && data.length > 0) setUsername(data[0].username);
  }

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Update Username
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({ id: user.id, username: username });

    // Update Email & Password (handled by Supabase Auth API)
    if (email !== user.email) {
      await supabase.auth.updateUser({ email });
    }
    if (password) {
      await supabase.auth.updateUser({ password });
    }

    if (profileError) {
      showToast('Error updating profile: ' + profileError.message, 'error');
    } else {
      showToast('Profile updated!', 'success');
      setPassword('');
      setConfirmPassword('');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '40px' }}>
      <h1>Edit Profile</h1>
      <form
        onSubmit={updateProfile}
        style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        <input
          className="input-field"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
        />
        <input
          className="input-field"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <input
          className="input-field"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New Password (optional)"
          minLength={8}
          pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':&quot;|<>?,./`~]).{8,}$"
          title="Must contain at least 8 characters, including uppercase, lowercase, numbers, and symbols"
        />
        <input
          className="input-field"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm New Password"
          minLength={8}
          pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':&quot;|<>?,./`~]).{8,}$"
          title="Must contain at least 8 characters, including uppercase, lowercase, numbers, and symbols"
        />
        <button className="btn-primary" disabled={loading}>
          {loading ? 'Updating...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
