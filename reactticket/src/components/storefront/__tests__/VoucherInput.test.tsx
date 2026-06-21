import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { VoucherInput } from '../VoucherInput';
import { ReactTicketProvider } from '../../../context/ReactTicketContext';
import * as useVoucherModule from '../../../hooks/useVoucher';

afterEach(cleanup);

vi.mock('../../../hooks/useVoucher', () => ({
  useVoucher: vi.fn(),
}));

vi.mock('../../../context/I18nContext', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'store.voucher.label': 'Voucher code',
        'store.voucher.apply': 'Apply',
        'store.voucher.applying': 'Applying...',
      };
      return translations[key] || key;
    },
  }),
}));

describe('VoucherInput Component', () => {
  const mockContext = {
    event: { id: 'evt_1' },
    adapter: { name: 'memory' } as any,
    onCheckout: vi.fn(),
  } as any;

  it('renders correctly', () => {
    vi.spyOn(useVoucherModule, 'useVoucher').mockReturnValue({
      applyVoucher: vi.fn(),
      isLoading: false,
      error: null,
    } as any);
    render(
      <ReactTicketProvider {...mockContext}>
        <VoucherInput />
      </ReactTicketProvider>
    );
    // Use role and name to be more specific, avoiding placeholder issues
    expect(screen.getByRole('textbox', { name: 'Voucher code' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDefined();
  });

  it('calls applyVoucher on click', async () => {
    const mockApply = vi.fn().mockResolvedValue(true);
    vi.spyOn(useVoucherModule, 'useVoucher').mockReturnValue({
      applyVoucher: mockApply,
      isLoading: false,
      error: null,
    } as any);

    render(
      <ReactTicketProvider {...mockContext}>
        <VoucherInput />
      </ReactTicketProvider>
    );
    const input = screen.getByRole('textbox', { name: 'Voucher code' });
    const button = screen.getByRole('button', { name: 'Apply' });

    fireEvent.change(input, { target: { value: 'SUMMER20' } });
    fireEvent.click(button);

    expect(mockApply).toHaveBeenCalledWith('SUMMER20');
  });
});
