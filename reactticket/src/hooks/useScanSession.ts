import { useReactTicket } from './useReactTicket';
import { useMemo, useCallback } from 'react';
import { ScanService } from '../services/ScanService';
import { AuthService } from '../services/AuthService';

export const useScanSession = (eventId: string) => {
  const { adapter, scanState, dispatch, authSession, event } = useReactTicket();
  const authService = useMemo(() => new AuthService(adapter, event.settings.scanSessionSecret), [adapter, event.settings.scanSessionSecret]);
  const scanService = useMemo(() => new ScanService(adapter, authService), [adapter, authService]);

  const startCamera = useCallback(async () => {
    dispatch({ type: 'SET_SCANNING', payload: true });
  }, [dispatch]);

  const stopCamera = useCallback(() => {
    dispatch({ type: 'SET_SCANNING', payload: false });
  }, [dispatch]);

  const scanManual = useCallback(async (payload: string) => {
    // We need an account ID here, which we can get from authSession
    if (!authSession || !('accountId' in authSession)) {
      throw new Error('Not authenticated');
    }
    const accountId = (authSession as any).accountId;
    const { result, ticket } = await scanService.checkTicket(payload);
    if (result === 'admitted' && ticket) {
        await scanService.admitTicket(ticket.id, accountId);
    }
    return result;
  }, [scanService, authSession]);

  return {
    isScanning: scanState.isScanning,
    lastResult: scanState.lastResult,
    startCamera,
    stopCamera,
    scanManual,
    authService
  };
};
