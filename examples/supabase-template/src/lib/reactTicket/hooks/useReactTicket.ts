import { useContext } from 'react';
import { ReactTicketContext, ReactTicketContextValue } from '../context/ReactTicketContext';

export const useReactTicket = (): ReactTicketContextValue => {
  const context = useContext(ReactTicketContext);
  if (!context) {
    throw new Error('useReactTicket must be used within a ReactTicketProvider');
  }
  return context;
};
