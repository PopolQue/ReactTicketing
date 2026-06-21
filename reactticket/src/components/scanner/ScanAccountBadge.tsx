import React from 'react';
import { useScanAuth } from '../../hooks/useScanAuth';
import { useReactTicket } from '../../hooks/useReactTicket';

export const ScanAccountBadge: React.FC = () => {
  const { event, authSession } = useReactTicket();
  const { logout } = useScanAuth(event.id);

  if (authSession?.role !== 'scan') return null;

  return (
    <div
      className="ReactTicket-root scan-account-badge"
      role="region"
      aria-label="Scan Account Info"
    >
      <span>{authSession.accountUsername}</span>
      <button onClick={logout} aria-label="Log out scan session">
        Log out
      </button>
    </div>
  );
};
