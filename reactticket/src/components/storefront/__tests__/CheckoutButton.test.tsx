import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { CheckoutButton } from '../CheckoutButton';
import { ReactTicketProvider } from '../../../context/ReactTicketContext';
import * as useCartModule from '../../../hooks/useCart';

afterEach(cleanup);

vi.mock('../../../hooks/useCart', () => ({
  useCart: vi.fn()
}));

vi.mock('../../../context/I18nContext', () => ({
  useI18n: () => ({
    t: (key: string) => key
  })
}));

describe('CheckoutButton Component', () => {
  const mockContext = {
    event: { id: 'evt_1' },
    adapter: { name: 'memory' } as any,
    onCheckout: vi.fn(),
  } as any;

  it('renders correctly', () => {
    vi.spyOn(useCartModule, 'useCart').mockReturnValue({ checkout: vi.fn() } as any);
    render(
      <ReactTicketProvider {...mockContext}>
        <CheckoutButton />
      </ReactTicketProvider>
    );
    expect(screen.getByRole('button')).toBeDefined();
  });

  it('calls checkout on click', async () => {
    const mockCheckout = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(useCartModule, 'useCart').mockReturnValue({ checkout: mockCheckout } as any);
    
    render(
      <ReactTicketProvider {...mockContext}>
        <CheckoutButton />
      </ReactTicketProvider>
    );
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockCheckout).toHaveBeenCalled();
  });
});
