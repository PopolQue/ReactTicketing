import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { QuantitySelector } from '../QuantitySelector';

afterEach(cleanup);

describe('QuantitySelector Component', () => {
  it('renders correctly', () => {
    render(<QuantitySelector value={1} onChange={vi.fn()} max={5} />);
    expect(screen.getByText('1')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Decrease quantity' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Increase quantity' })).toBeDefined();
  });

  it('calls onChange with decremented value', () => {
    const onChange = vi.fn();
    render(<QuantitySelector value={1} onChange={onChange} max={5} />);
    
    fireEvent.click(screen.getByRole('button', { name: 'Decrease quantity' }));
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('calls onChange with incremented value', () => {
    const onChange = vi.fn();
    render(<QuantitySelector value={1} onChange={onChange} max={5} />);
    
    fireEvent.click(screen.getByRole('button', { name: 'Increase quantity' }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('disables decrease button when value is 0', () => {
    render(<QuantitySelector value={0} onChange={vi.fn()} max={5} />);
    
    const decreaseButton = screen.getByRole('button', { name: 'Decrease quantity' }) as HTMLButtonElement;
    expect(decreaseButton.disabled).toBe(true);
  });

  it('disables increase button when max is reached', () => {
    render(<QuantitySelector value={5} onChange={vi.fn()} max={5} />);
    
    const increaseButton = screen.getByRole('button', { name: 'Increase quantity' }) as HTMLButtonElement;
    expect(increaseButton.disabled).toBe(true);
  });
});
