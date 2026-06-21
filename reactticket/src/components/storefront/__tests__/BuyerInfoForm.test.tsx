import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BuyerInfoForm } from '../BuyerInfoForm';
import { ReactTicketProvider } from '../../../context/ReactTicketContext';
import * as useReactTicketModule from '../../../hooks/useReactTicket';

vi.mock('../../../context/I18nContext', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

describe('BuyerInfoForm Component', () => {
  const mockDispatch = vi.fn();
  const mockContext = {
    event: { id: 'evt_1' },
    adapter: { name: 'memory' } as any,
    onCheckout: vi.fn(),
  } as any;

  it('renders correctly and dispatches SET_PERSONALIZATION on change', () => {
    vi.spyOn(useReactTicketModule, 'useReactTicket').mockReturnValue({
      cart: {
        items: [{ ticketTypeId: 't1', quantity: 1 }],
        personalizations: {
          t1: [{ name: '', surname: '', country: '', city: '', email: '', phone: '', zip: '' }],
        },
      },
      dispatch: mockDispatch,
      ticketTypes: [{ id: 't1', name: 'Standard' }],
    } as any);

    render(
      <ReactTicketProvider {...mockContext}>
        <BuyerInfoForm />
      </ReactTicketProvider>
    );

    expect(screen.getByText('Standard')).toBeDefined();

    const nameInput = screen.getByLabelText('Standard ticket 1 Name');
    fireEvent.change(nameInput, { target: { value: 'John' } });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_PERSONALIZATION',
      payload: {
        ticketTypeId: 't1',
        personalizations: [
          { name: 'John', surname: '', country: '', city: '', email: '', phone: '', zip: '' },
        ],
      },
    });
  });
});
