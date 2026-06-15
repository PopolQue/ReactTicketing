import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { PricingInput } from '../PricingInput';

afterEach(cleanup);

describe('PricingInput Component', () => {
  const defaultProps = {
    valueCents: 1000,
    onChangeCents: vi.fn(),
    currency: 'EUR',
    onCurrencyChange: vi.fn(),
  };

  it('renders correctly', () => {
    render(<PricingInput {...defaultProps} />);
    expect(screen.getByRole('group', { name: 'Ticket Pricing Input' })).toBeDefined();
    expect(screen.getByLabelText('Price Amount')).toBeDefined();
  });

  it('switches modes and calculates correctly', () => {
    const onChangeCents = vi.fn();
    render(<PricingInput {...defaultProps} onChangeCents={onChangeCents} />);
    
    const modeSelect = screen.getByLabelText('Pricing Mode');
    const priceInput = screen.getByLabelText('Price Amount') as HTMLInputElement;

    // Change to 'What You Get'
    fireEvent.change(modeSelect, { target: { value: 'organizer' } });
    
    // Set organizer net amount to 10
    fireEvent.change(priceInput, { target: { value: '10' } });
    
    // Formula: C = (O + 0.80) / 0.956
    // C = (10 + 0.80) / 0.956 = 11.29707
    // Cents = 1130
    expect(onChangeCents).toHaveBeenCalledWith(1130);
  });
});
