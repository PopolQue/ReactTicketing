import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { VoucherDetails } from '../VoucherDetails';
import * as useVoucherModule from '../../../hooks/useVoucher';
import * as useCartModule from '../../../hooks/useCart';
import * as useReactTicketModule from '../../../hooks/useReactTicket';

afterEach(cleanup);

// Mock reactticket-core utility
vi.mock('reactticket-core/utils/formatCurrency', () => ({
  formatCurrency: (cents: number) => `$${(cents / 100).toFixed(2)}`,
}));

vi.mock('../../../context/I18nContext', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: 'en-US',
  }),
}));

describe('VoucherDetails Component', () => {
  it('renders voucher details correctly and calls removeVoucher', () => {
    const mockRemoveVoucher = vi.fn();

    vi.spyOn(useVoucherModule, 'useVoucher').mockReturnValue({
      promoDetails: {
        code: 'SUMMER20',
        discount: { kind: 'percent_off', percent: 20 },
      },
      removeVoucher: mockRemoveVoucher,
    } as any);

    vi.spyOn(useCartModule, 'useCart').mockReturnValue({
      totals: { discountCents: 500 },
    } as any);

    vi.spyOn(useReactTicketModule, 'useReactTicket').mockReturnValue({
      ticketTypes: [{ pricing: { kind: 'paid', currency: 'USD' } }],
    } as any);

    render(<VoucherDetails />);

    expect(screen.getByText('SUMMER20')).toBeDefined();
    expect(screen.getByText('20% off')).toBeDefined();
    expect(screen.getByText('Discount: $5.00')).toBeDefined();

    const removeButton = screen.getByRole('button', { name: 'Remove voucher' });
    fireEvent.click(removeButton);
    expect(mockRemoveVoucher).toHaveBeenCalledOnce();
  });
});
