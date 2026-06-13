import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';

export default function AdminManagement() {
  const { showToast } = useToast();
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Notice: Inviting an admin securely requires Supabase Admin API.
  // For demo purposes, we allow promoting an existing user by email
  const [emailToPromote, setEmailToPromote] = useState('');

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    // Note: To get emails of other users, we'd normally need a secure edge function or view.
    // For this prototype, we'll list the user_roles table.
    const { data } = await supabase
      .from('user_roles')
      .select('id, user_id, role, created_at');
    
    if (data) setAdmins(data);
    setLoading(false);
  };

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailToPromote) return;

    const { data, error } = await supabase.rpc('promote_admin_by_email', { target_email: emailToPromote });
    
    if (error) {
      showToast(error.message || "Failed to promote user.", "error");
    } else {
      showToast("User promoted to admin successfully!", "success");
      setEmailToPromote('');
      fetchAdmins();
    }
  };

  const removeRole = async (id: string, role: string) => {
    if (role === 'superadmin') {
      showToast("Cannot remove a superadmin.", "error");
      return;
    }
    
    const { error } = await supabase.from('user_roles').delete().eq('id', id);
    if (error) {
      showToast('Error removing admin', 'error');
    } else {
      showToast('Admin access revoked', 'success');
      fetchAdmins();
    }
  };

  if (loading) return <div>Loading admins...</div>;

  return (
    <div style={{ maxWidth: '800px' }}>
      <h1 style={{ marginBottom: '24px' }}>Admin Management</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
        View and manage Admit employee accounts.
      </p>

      <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px' }}>
        <h3 style={{ marginBottom: '16px' }}>Promote User to Admin</h3>
        <form onSubmit={handlePromote} style={{ display: 'flex', gap: '12px' }}>
          <input 
            type="email" 
            placeholder="User's email address" 
            value={emailToPromote} 
            onChange={e => setEmailToPromote(e.target.value)} 
            className="input-field" 
            required 
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn-primary" style={{ backgroundColor: '#c084fc' }}>Grant Admin Access</button>
        </form>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
          * User must already have created an account on Admit.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 500 }}>User ID</th>
              <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 500 }}>Role</th>
              <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 500 }}>Promoted On</th>
              <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 500 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map(admin => (
              <tr key={admin.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '16px 24px', fontFamily: 'monospace', fontSize: '0.85rem' }}>{admin.user_id}</td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ 
                    backgroundColor: admin.role === 'superadmin' ? '#c084fc' : '#6366f1', 
                    padding: '2px 8px', 
                    borderRadius: '12px', 
                    fontSize: '0.75rem', 
                    color: 'white' 
                  }}>
                    {admin.role.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{new Date(admin.created_at).toLocaleDateString()}</td>
                <td style={{ padding: '16px 24px' }}>
                  {admin.role !== 'superadmin' && (
                    <button 
                      onClick={() => removeRole(admin.id, admin.role)}
                      style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {admins.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>No roles defined.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
