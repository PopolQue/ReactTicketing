import { useReactTicket } from './useReactTicket';
import { useMemo, useCallback, useState, useEffect } from 'react';
import { AuthService } from 'reactticket-core/services/AuthService';

const LOCKOUT_DURATION = 30 * 1000;
const FAILURE_WINDOW = 60 * 1000;
const MAX_FAILURES = 5;

export const useScanAuth = (eventId: string) => {
  const { adapter, authSession, dispatch, event } = useReactTicket();
  const authService = useMemo(() => new AuthService(adapter, event.settings), [adapter, event.settings]);

  const [failureCount, setFailureCount] = useState(0);
  const [firstFailureTimestamp, setFirstFailureTimestamp] = useState<number | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [lockedUntil, setLockedUntil] = useState<number | null>(() => {
    try {
        const stored = sessionStorage.getItem(`tf_lockout_${eventId}`);
        if (stored && parseInt(stored) > Date.now()) {
            return parseInt(stored);
        }
    } catch (e: any) { 
        console.warn(e); 
        // Can't set state in initialization, but we'll surface errors on write
    }
    return null;
  });
  const [lockRemainingSeconds, setLockRemainingSeconds] = useState(0);

  useEffect(() => {
    if (lockedUntil) {
      const interval = setInterval(() => {
        const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
        setLockRemainingSeconds(remaining);
        if (remaining <= 0) {
          setLockedUntil(null);
          setFailureCount(0);
          setFirstFailureTimestamp(null);
          try {
            sessionStorage.removeItem(`tf_lockout_${eventId}`);
          } catch(e: any) { 
             console.warn(e); 
             setAuthError("Storage access blocked");
          }
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockedUntil, eventId]);

  const login = useCallback(async (username: string, pin: string) => {
    if (lockedUntil && lockedUntil > Date.now()) {
      const msg = `Locked for ${lockRemainingSeconds} more seconds.`;
      setAuthError(msg);
      throw new Error(msg);
    }

    try {
        setAuthError(null);
        const session = await authService.loginScanAccount(eventId, username, pin);
        dispatch({ type: 'SET_AUTH_SESSION', payload: session });
        setFailureCount(0);
        setFirstFailureTimestamp(null);
    } catch (e: any) {
        setAuthError(e.message || "Invalid credentials");
        const now = Date.now();
        const newFailureCount = (firstFailureTimestamp && now - firstFailureTimestamp > FAILURE_WINDOW) ? 1 : failureCount + 1;
        
        setFailureCount(newFailureCount);

        if (newFailureCount === 1) {
            setFirstFailureTimestamp(now);
        }

        if (newFailureCount >= MAX_FAILURES) {
            const newLockedUntil = now + LOCKOUT_DURATION;
            setLockedUntil(newLockedUntil);
            setLockRemainingSeconds(LOCKOUT_DURATION / 1000);
            try {
                sessionStorage.setItem(`tf_lockout_${eventId}`, newLockedUntil.toString());
            } catch(storageErr: any) { 
                console.warn(storageErr); 
                setAuthError("Storage access blocked");
            }
        }
        throw e; // re-throw to be caught by component
    }
  }, [authService, eventId, dispatch, lockedUntil, failureCount, firstFailureTimestamp, lockRemainingSeconds]);

  const logout = useCallback(() => {
    dispatch({ type: 'SET_AUTH_SESSION', payload: null });
  }, [dispatch]);

  return {
    session: authSession,
    login,
    logout,
    isLocked: !!(lockedUntil && lockedUntil > Date.now()),
    lockRemainingSeconds,
    error: authError,
  };
};
