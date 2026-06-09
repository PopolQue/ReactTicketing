import { useReactTicket } from './useReactTicket';
import { useCallback } from 'react';

export const useAnalytics = (eventId: string) => {
  const { dispatch } = useReactTicket();

  const refresh = useCallback(async () => {
    // Implement refresh
  }, []);

  return {
    data: {} as any,
    refresh,
    isLoading: false
  };
};
