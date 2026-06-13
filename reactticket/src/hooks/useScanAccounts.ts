import { useReactTicket } from './useReactTicket';
import { useMemo, useCallback, useState, useEffect } from 'react';
import { ScanAccountService } from 'reactticket-core/services/ScanAccountService';

export const useScanAccounts = (eventId: string) => {
  const { adapter } = useReactTicket();
  const scanAccountService = useMemo(() => new ScanAccountService(adapter), [adapter]);
  
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await scanAccountService.list(eventId);
      setAccounts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [eventId, scanAccountService]);

  useEffect(() => {
    if (eventId) {
      fetchAccounts();
    }
  }, [eventId, fetchAccounts]);

  const create = useCallback(async (options: { username: string; pin: string; assignedLocation?: string }) => {
    const acc = await scanAccountService.createAccount(eventId, options.username, options.pin, options.assignedLocation);
    await fetchAccounts();
    return acc;
  }, [eventId, scanAccountService, fetchAccounts]);

  const deactivate = useCallback(async (accountId: string) => {
    await scanAccountService.deactivate(accountId);
    await fetchAccounts();
  }, [scanAccountService, fetchAccounts]);

  const reactivate = useCallback(async (accountId: string) => {
    await scanAccountService.reactivate(accountId);
    await fetchAccounts();
  }, [scanAccountService, fetchAccounts]);

  const resetPin = useCallback(async (accountId: string, newPin: string) => {
    await scanAccountService.resetPin(accountId, newPin);
    await fetchAccounts();
  }, [scanAccountService, fetchAccounts]);

  const remove = useCallback(async (accountId: string) => {
    await scanAccountService.delete(accountId);
    await fetchAccounts();
  }, [scanAccountService, fetchAccounts]);

  return {
    accounts,
    create,
    deactivate,
    reactivate,
    resetPin,
    remove,
    isLoading
  };
};
