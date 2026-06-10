import { useReactTicket } from './useReactTicket';
import { useCallback, useState, useEffect, useMemo } from 'react';
import { AnalyticsSummary } from 'reactticket-core/types/scan.types';
import { ScanService } from 'reactticket-core/services/ScanService';
import { AuthService } from 'reactticket-core/services/AuthService';

export const useAnalytics = (eventId: string) => {
  const { adapter, event } = useReactTicket();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authService = useMemo(() => new AuthService(adapter, event.settings), [adapter, event.settings]);
  const scanService = useMemo(() => new ScanService(adapter, authService), [adapter, authService]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await scanService.getAnalytics(eventId);
      setSummary(data);
    } catch (e: any) {
      setError(e.message || "Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  }, [scanService, eventId]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [refresh]);

  return {
    summary,
    refresh,
    isLoading,
    error
  };
};
