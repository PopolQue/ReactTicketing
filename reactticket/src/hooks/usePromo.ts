import { useReactTicket } from './useReactTicket';
import { useMemo, useCallback } from 'react';
import { PromoService } from '../services/PromoService';
import { PromoGenerateOptions } from '../types/promo.types';

export const usePromo = () => {
  const { adapter, promoCodes, dispatch } = useReactTicket();
  const promoService = useMemo(() => new PromoService(adapter), [adapter]);

  const generate = useCallback(async (options: PromoGenerateOptions) => {
    // Implement generation logic using PromoService or Adapter
    return [];
  }, []);

  const deactivate = useCallback(async (code: string) => {
    // Implement deactivation
  }, []);

  const exportCSV = useCallback((batchId?: string) => {
    return '';
  }, []);

  return {
    codes: promoCodes,
    generate,
    deactivate,
    exportCSV
  };
};
