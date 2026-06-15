import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CheckoutSummary from './CheckoutSummary';
import { LanguageProvider } from '../../contexts/LanguageContext';

describe('CheckoutSummary Component', () => {
  const mockTicketForms = [
    { id: '1', tier: { name: 'Early Bird', pricing: { amount: 1500 } } },
    { id: '2', tier: { name: 'General Admission', pricing: { amount: 2500 } } }
  ];

  it('renders correctly with subtotals and enables Proceed to Payment for >0 totals', () => {
    const onProceedMock = vi.fn();
    
    render(
      <LanguageProvider>
        <CheckoutSummary
          ticketForms={mockTicketForms}
          subtotalCents={4000}
          finalTotalCents={4000}
          promoCode=""
          setPromoCode={vi.fn()}
          appliedPromo={null}
          promoError=""
          onApplyPromo={vi.fn()}
          onRemovePromo={vi.fn()}
          onCancel={vi.fn()}
          onProceed={onProceedMock}
        />
      </LanguageProvider>
    );

    // Verify ticket lines are rendered
    expect(screen.getByText('Early Bird')).toBeInTheDocument();
    expect(screen.getByText('General Admission')).toBeInTheDocument();
    
    // Verify math formatting (4000 cents = €40.00)
    expect(screen.getByText('€15.00')).toBeInTheDocument();
    expect(screen.getByText('€25.00')).toBeInTheDocument();
    
    // Total should display €40.00 twice (once in subtotal, once in total)
    const totals = screen.getAllByText('€40.00');
    expect(totals.length).toBe(2);

    // Verify button says "Proceed to Payment"
    const proceedBtn = screen.getByRole('button', { name: /Proceed to Payment/i });
    expect(proceedBtn).toBeInTheDocument();

    // Verify callback
    fireEvent.click(proceedBtn);
    expect(onProceedMock).toHaveBeenCalledOnce();
  });

  it('shows Complete Order button when total is free and displays discount line', () => {
    render(
      <LanguageProvider>
        <CheckoutSummary
          ticketForms={mockTicketForms}
          subtotalCents={4000}
          finalTotalCents={0}
          promoCode=""
          setPromoCode={vi.fn()}
          appliedPromo={{ code: 'FREEBIE' }}
          promoError=""
          onApplyPromo={vi.fn()}
          onRemovePromo={vi.fn()}
          onCancel={vi.fn()}
          onProceed={vi.fn()}
        />
      </LanguageProvider>
    );

    // Verify discount line
    expect(screen.getByText('Discount (FREEBIE)')).toBeInTheDocument();
    expect(screen.getByText('-€40.00')).toBeInTheDocument();
    
    // Final total is €0.00
    expect(screen.getByText('€0.00')).toBeInTheDocument();

    // Button should now say "Complete Order"
    expect(screen.getByRole('button', { name: /Complete Order/i })).toBeInTheDocument();
  });

  it('displays promo error message if provided', () => {
    render(
      <LanguageProvider>
        <CheckoutSummary
          ticketForms={mockTicketForms}
          subtotalCents={4000}
          finalTotalCents={4000}
          promoCode="INVALID"
          setPromoCode={vi.fn()}
          appliedPromo={null}
          promoError="Invalid or expired promo code"
          onApplyPromo={vi.fn()}
          onRemovePromo={vi.fn()}
          onCancel={vi.fn()}
          onProceed={vi.fn()}
        />
      </LanguageProvider>
    );

    expect(screen.getByText('Invalid or expired promo code')).toBeInTheDocument();
  });
});
