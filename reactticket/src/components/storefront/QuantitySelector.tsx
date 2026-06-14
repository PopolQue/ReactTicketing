import React from 'react';

export const QuantitySelector = ({ value, onChange, max, itemName }: { value: number, onChange: (v: number) => void, max: number, itemName?: string }) => {
  return (
    <div className="tf-quantity-selector" role="group" aria-label={itemName ? `Quantity selector for ${itemName}` : 'Quantity selector'}>
      <button type="button" onClick={() => onChange(Math.max(0, value - 1))} disabled={value <= 0} aria-label={`Decrease quantity${itemName ? ` for ${itemName}` : ''}`}>-</button>
      <span aria-live="polite" aria-atomic="true">{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={`Increase quantity${itemName ? ` for ${itemName}` : ''}`}>+</button>
    </div>
  );
};
