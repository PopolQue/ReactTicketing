import React from 'react';
import { useScanAuth } from '../../hooks/useScanAuth';
import { useReactTicket } from '../../hooks/useReactTicket';

export const ScanAccountBadge: React.FC = () => {
  const { event, authSession } = useReactTicket();
  const { logout } = useScanAuth(event.id);
  
  if (authSession?.role !== 'scan') return null;

  return (
    <div className="ReactTicket-root scan-account-badge">
       <span>{authSession.accountUsername}</span>
       <button onClick={logout}>Log out</button>
    </div>
  );
};
