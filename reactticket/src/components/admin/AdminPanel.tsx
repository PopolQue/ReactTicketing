import React, { useState } from 'react';
import { useReactTicket } from '../../hooks/useReactTicket';
import { TicketTypeEditor } from './TicketTypeEditor';
import { PromoCodeManager } from './PromoCodeManager';
import { CapacityOverview } from './CapacityOverview';
import { ScanAccountManager } from './ScanAccountManager';

export const AdminPanel: React.FC = () => {
  const { authSession, event, dispatch } = useReactTicket();
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(authSession?.role === 'admin');

  const handleLogin = () => {
    // In a real implementation, we'd bcrypt-compare this against event.settings.adminKey
    if (password === event.settings.adminKey) {
      setIsAuthenticated(true);
      dispatch({
        type: 'SET_AUTH_SESSION',
        payload: { isAdmin: true, role: 'admin' }
      });
    } else {
      alert('Invalid password');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <h2>Admin Authentication</h2>
        <input
          type="password"
          placeholder="Enter admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleLogin}>Login</button>
      </div>
    );
  }

  return (
    <div className="ReactTicket-root admin-panel">
      <h1>Admin Panel</h1>
      <CapacityOverview />
      <TicketTypeEditor />
      <PromoCodeManager />
      <ScanAccountManager />
    </div>
  );
};
