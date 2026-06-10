import React, { useState, useRef, useEffect } from 'react';
import { useScanAuth } from '../../hooks/useScanAuth';
import { useReactTicket } from '../../hooks/useReactTicket';

const MAX_PIN_LENGTH = 8;

export const ScannerLogin: React.FC = () => {
  const { event } = useReactTicket();
  const { login, isLocked, lockRemainingSeconds } = useScanAuth(event.id);
  const [username, setUsername] = useState('');
  const [displayPin, setDisplayPin] = useState('');
  const pinBuffer = useRef<Uint8Array>(new Uint8Array(MAX_PIN_LENGTH));
  const pinLength = useRef(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isSubmitting) return;

    if (e.key === 'Backspace') {
      e.preventDefault();
      if (pinLength.current > 0) {
        pinLength.current--;
        pinBuffer.current[pinLength.current] = 0;
        setDisplayPin('●'.repeat(pinLength.current));
      }
    } else if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      if (pinLength.current < MAX_PIN_LENGTH) {
        const encoder = new TextEncoder();
        const byte = encoder.encode(e.key)[0];
        pinBuffer.current[pinLength.current] = byte;
        pinLength.current++;
        setDisplayPin('●'.repeat(pinLength.current));
      }
    } else if (e.key === 'Enter') {
        // Form submit will handle this
    } else {
        // Ignore other keys
        if (e.key.length === 1) e.preventDefault();
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
      setDisplayPin('');
      pinBuffer.current.fill(0);
      pinLength.current = 0;
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
      {error && <p className="error-message">{error}</p>}
      {isLocked ? (
        <p>Locked — retry in {lockRemainingSeconds}s</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isSubmitting}
          />
          <input
            type="text"
            inputMode="numeric"
            placeholder="PIN"
            value={displayPin}
            onKeyDown={handleKeyDown}
            onChange={() => {}} // Controlled component needs this
            disabled={isSubmitting}
            maxLength={MAX_PIN_LENGTH}
          />
          <button type="submit" disabled={isSubmitting || !username || pinLength.current === 0}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      )}
    </div>
  );
};
