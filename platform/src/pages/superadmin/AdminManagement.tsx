import React, { useState } from 'react';
import { useAdminData } from '../../hooks/useAdminData';
import AdminUsersTable from '../../components/superadmin/AdminUsersTable';

export default function AdminManagement() {
  const { admins, loading, promoteUser, removeRole } = useAdminData();
  const [emailToPromote, setEmailToPromote] = useState('');

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await promoteUser(emailToPromote);
    if (success) {
      setEmailToPromote('');
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

      <AdminUsersTable admins={admins} onRemoveRole={removeRole} />
    </div>
  );
}
