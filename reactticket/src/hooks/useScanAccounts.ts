import { useReactTicket } from './useReactTicket';
import { useMemo, useCallback } from 'react';
import { ScanAccountService } from 'reactticket-core/services/ScanAccountService';

export const useScanAccounts = (eventId: string) => {
  const { adapter, scanAccounts, dispatch } = useReactTicket();
  const scanAccountService = useMemo(() => new ScanAccountService(adapter), [adapter]);

  const create = useCallback(async (options: any) => {
    // call ScanAccountService.createAccount
    return {} as any;
  }, []);

  const deactivate = useCallback(async (accountId: string) => { }, []);
  const reactivate = useCallback(async (accountId: string) => { }, []);
  const resetPin = useCallback(async (accountId: string, newPin: string) => { }, []);
  const remove = useCallback(async (accountId: string) => { }, []);

  return {
    accounts: scanAccounts,
    create,
    deactivate,
    reactivate,
    resetPin,
    remove,
    isLoading: false
  };
};
