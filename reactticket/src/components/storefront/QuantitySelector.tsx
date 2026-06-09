import React from 'react';

export const QuantitySelector = ({ value, onChange, max }: { value: number, onChange: (v: number) => void, max: number }) => {
  return (
    <div className="tf-quantity-selector">
      <button onClick={() => onChange(Math.max(0, value - 1))} disabled={value <= 0}>-</button>
      <span>{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}>+</button>
    </div>
  );
};
