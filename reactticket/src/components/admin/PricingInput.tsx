import React, { useState, useEffect } from 'react';
import { formatCurrency } from 'reactticket-core/utils/formatCurrency';

export interface PricingInputProps {
  valueCents: number;
  onChangeCents: (cents: number) => void;
  currency: string;
  onCurrencyChange: (curr: string) => void;
}

export const PricingInput: React.FC<PricingInputProps> = ({
  valueCents,
  onChangeCents,
  currency,
  onCurrencyChange,
}) => {
  const [mode, setMode] = useState<'customer' | 'organizer'>('customer');
  const [inputValue, setInputValue] = useState<string>('');

  // Constants for fees
  const FLAT_FEE_CENTS = 80; // 0.50 Admit + 0.30 Stripe proxy
  const VARIABLE_FEE_PERCENT = 4.4; // 1.5% Admit + 2.9% Stripe
  const MULTIPLIER = 1 - (VARIABLE_FEE_PERCENT / 100); // 0.956

  useEffect(() => {
    // When props change externally (or on mount), update the local input value 
    // to match the current mode, unless the user is actively typing (we can't really track typing easily here 
    // without a ref, but assuming valueCents only changes from parent when saving/cancelling or on input).
    if (valueCents === 0 && !inputValue) {
      setInputValue('');
      return;
    }

    const C = valueCents / 100;
    if (mode === 'customer') {
      // We don't want to overwrite the input value if it perfectly matches the computed C, 
      // avoiding '15.' getting truncated to '15'
      const currentC = parseFloat(inputValue);
      if (isNaN(currentC) || Math.round(currentC * 100) !== valueCents) {
        setInputValue(C ? C.toFixed(2) : '');
      }
    } else {
      const O = (C * MULTIPLIER) - (FLAT_FEE_CENTS / 100);
      const currentO = parseFloat(inputValue);
      if (isNaN(currentO) || Math.abs(currentO - O) > 0.01) {
        setInputValue(O > 0 ? O.toFixed(2) : '');
      }
    }
  }, [valueCents, mode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);

    const parsed = parseFloat(val);
    if (isNaN(parsed) || parsed < 0) {
      onChangeCents(0);
      return;
    }

    if (mode === 'customer') {
      onChangeCents(Math.round(parsed * 100));
    } else {
      // parsed is Organizer gets (O)
      // C = (O + 0.80) / 0.956
      const O = parsed;
      let C = (O + (FLAT_FEE_CENTS / 100)) / MULTIPLIER;
      if (C < 0) C = 0;
      onChangeCents(Math.round(C * 100));
    }
  };

  const getBreakdown = () => {
    const parsed = parseFloat(inputValue);
    if (isNaN(parsed) || parsed <= 0) return null;

    if (mode === 'organizer') {
      // Input is Organizer gets. What do customers pay?
      const O = parsed;
      const C = (O + (FLAT_FEE_CENTS / 100)) / MULTIPLIER;
      return `What Customers Pay: ${formatCurrency(Math.round(C * 100), currency)}`;
    } else {
      // Input is Customer pays. What do organizers get?
      const C = parsed;
      const O = (C * MULTIPLIER) - (FLAT_FEE_CENTS / 100);
      const formattedO = O > 0 ? formatCurrency(Math.round(O * 100), currency) : formatCurrency(0, currency);
      return `What You Get: ${formattedO}`;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
        <select 
          value={mode} 
          onChange={(e) => setMode(e.target.value as 'customer' | 'organizer')}
          style={{ padding: '5px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
        >
          <option value="customer">What Customers Pay</option>
          <option value="organizer">What You Get</option>
        </select>
        
        <input 
          style={{ width: '80px', padding: '5px' }} 
          type="number" 
          step="0.01"
          placeholder="Amount" 
          value={inputValue} 
          onChange={handleInputChange} 
        />
        
        <select 
          value={currency} 
          onChange={e => onCurrencyChange(e.target.value)}
          style={{ padding: '5px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
        >
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
          <option value="CAD">CAD</option>
        </select>
      </div>
      <div style={{ fontSize: '11px', color: '#64748b', maxWidth: '300px', lineHeight: '1.4' }}>
        {getBreakdown()}
      </div>
    </div>
  );
};
