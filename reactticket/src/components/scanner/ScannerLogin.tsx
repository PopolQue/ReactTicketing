import React, { useState } from 'react';
import { useScanAuth } from '../../hooks/useScanAuth';
import { useReactTicket } from '../../hooks/useReactTicket';

export const ScannerLogin: React.FC = () => {
  const { event } = useReactTicket();
  const { login, isLocked, lockRemainingSeconds } = useScanAuth(event.id);
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(username, pin);
  };

  return (
    <div className="ReactTicket-root scanner-login">
      <h2>Scanner Login</h2>
      {isLocked ? (
        <p>Locked — retry in {lockRemainingSeconds}s</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
          <button type="submit">Sign in</button>
        </form>
      )}
    </div>
  );
};
