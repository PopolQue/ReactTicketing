import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PromoCodeInput } from '../PromoCodeInput';
import * as useVoucherModule from '../../../hooks/useVoucher';

vi.mock('../../../context/I18nContext', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'store.promo.label': 'Promo code',
        'store.promo.apply': 'Apply',
      };
      return translations[key] || key;
    },
  }),
}));

describe('PromoCodeInput Component', () => {
  it('renders correctly and calls applyVoucher on click', async () => {
    const mockApplyVoucher = vi.fn().mockResolvedValue(true);
    vi.spyOn(useVoucherModule, 'useVoucher').mockReturnValue({
      applyVoucher: mockApplyVoucher,
      isLoading: false,
      error: null
    } as any);

    render(<PromoCodeInput />);

    const input = screen.getByPlaceholderText('Promo code');
    const button = screen.getByText('Apply');

    fireEvent.change(input, { target: { value: 'SAVE20' } });
    fireEvent.click(button);

    expect(mockApplyVoucher).toHaveBeenCalledWith('SAVE20');
  });
});
