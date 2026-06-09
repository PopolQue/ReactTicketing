import { useReactTicket } from './useReactTicket';
import { useMemo, useCallback, useState } from 'react';
import { AuthService } from '../services/AuthService';

export const useScanAuth = (eventId: string) => {
  const { adapter, authSession, dispatch, event } = useReactTicket();
  const authService = useMemo(() => new AuthService(adapter, event.settings.scanSessionSecret), [adapter, event.settings.scanSessionSecret]);
  const [isLocked, setIsLocked] = useState(false);

  const login = useCallback(async (username: string, pin: string) => {
    try {
        const session = await authService.loginScanAccount(eventId, username, pin);
        dispatch({ type: 'SET_AUTH_SESSION', payload: session });
    } catch (e) {
        alert("Invalid login");
    }
  }, [authService, eventId, dispatch]);

  const logout = useCallback(() => {
    dispatch({ type: 'SET_AUTH_SESSION', payload: null });
  }, [dispatch]);

  return {
    session: authSession,
    login,
    logout,
    isLocked,
    lockRemainingSeconds: 0
  };
};
