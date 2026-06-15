import React, { useState, useMemo } from 'react';
import { useReactTicket } from '../../hooks/useReactTicket';
import { TicketTypeEditor } from './TicketTypeEditor';
import { PromoCodeManager } from './PromoCodeManager';
import { CapacityOverview } from './CapacityOverview';
import { ScanAccountManager } from './ScanAccountManager';
import { AuthService } from 'reactticket-core/services/AuthService';
import { useScanAuth } from '../../hooks/useScanAuth';

export const AdminPanel: React.FC = () => {
  const { authSession, event, dispatch, adapter } = useReactTicket();
  const authService = useMemo(() => new AuthService(adapter, event.settings), [adapter, event.settings]);
  const { logout } = useScanAuth(event.id);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(authSession?.role === 'admin');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    setIsSubmitting(true);
    const isValid = await authService.verifyAdminKey(password);
    if (isValid) {
      setIsAuthenticated(true);
      dispatch({
        type: 'SET_AUTH_SESSION',
        payload: { isAdmin: true, role: 'admin' }
      });
    } else {
      alert('Invalid password');
      setPassword('');
    }
    setIsSubmitting(false);
  };

  const handleLogout = () => {
      logout();
      setIsAuthenticated(false);
  }

  const safeString = (val: any) => typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');

  if (!isAuthenticated) {
    return (
      <div className="admin-login" style={{padding: '20px'}} role="region" aria-label="Admin Login">
        <h2 id="admin-auth-heading">Admin Authentication</h2>
        <input
          type="password"
          placeholder="Enter admin password"
          aria-labelledby="admin-auth-heading"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isSubmitting}
          onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
        />
        <button type="button" onClick={handleLogin} disabled={isSubmitting} aria-busy={isSubmitting}>
            {isSubmitting ? 'Logging in...' : 'Login'}
        </button>
      </div>
    );
  }

  return (
    <div className="ReactTicket-root admin-panel" role="region" aria-label="Admin Panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>Admin Panel</h1>
          <button type="button" onClick={handleLogout} aria-label="Logout from Admin Panel">Logout</button>
      </div>
      <CapacityOverview />
      <TicketTypeEditor />
      <PromoCodeManager />
      <ScanAccountManager />
    </div>
  );
};
