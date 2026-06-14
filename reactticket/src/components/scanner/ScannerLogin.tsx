import React, { useState, useRef, useEffect } from 'react';
import { useScanAuth } from '../../hooks/useScanAuth';
import { useReactTicket } from '../../hooks/useReactTicket';

const MAX_PIN_LENGTH = 8;

export const ScannerLogin: React.FC = () => {
  const { event } = useReactTicket();
  const { login, isLocked, lockRemainingSeconds } = useScanAuth(event.id);
  const [username, setUsername] = useState('');
  const pinBuffer = useRef<Uint8Array>(new Uint8Array(MAX_PIN_LENGTH));
  const pinLength = useRef(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [clearSignal, setClearSignal] = useState(0); // Used to force-clear the native input

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length <= MAX_PIN_LENGTH) {
      pinLength.current = val.length;
      const encoder = new TextEncoder();
      const bytes = encoder.encode(val);
      for (let i = 0; i < MAX_PIN_LENGTH; i++) {
        pinBuffer.current[i] = i < bytes.length ? bytes[i] : 0;
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinLength.current === 0) return;
    setError('');
    setIsSubmitting(true);
    try {
      const pinAsString = new TextDecoder().decode(pinBuffer.current.slice(0, pinLength.current));
      await login(username, pinAsString);
    } catch (err: any) {
      setError(err.message || "Invalid login credentials.");
      pinBuffer.current.fill(0);
      pinLength.current = 0;
      setClearSignal(s => s + 1);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  useEffect(() => {
    return () => {
      pinBuffer.current.fill(0);
    };
  }, []);

  return (
    <div className="ReactTicket-root scanner-login">
      <h2>Scanner Login</h2>
      {error && <p className="error-message" role="alert">{error}</p>}
      {isLocked ? (
        <p aria-live="assertive">Locked — retry in {lockRemainingSeconds}s</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            aria-label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isSubmitting}
            autoComplete="username"
            required
          />
          <input
            key={clearSignal}
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="PIN"
            aria-label="PIN"
            onChange={handlePinChange}
            disabled={isSubmitting}
            maxLength={MAX_PIN_LENGTH}
            autoComplete="current-password"
            required
          />
          <button type="submit" disabled={isSubmitting || !username} aria-busy={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      )}
    </div>
  );
};
