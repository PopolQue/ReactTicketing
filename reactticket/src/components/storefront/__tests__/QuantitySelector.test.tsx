import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { QuantitySelector } from '../QuantitySelector';
import { describe, it, expect, vi, afterEach } from 'vitest';

afterEach(cleanup);

describe('QuantitySelector', () => {
  it('renders correctly', () => {
    const onChange = vi.fn();
    render(<QuantitySelector value={1} onChange={onChange} max={5} />);
    expect(screen.getByText('1')).toBeDefined();
  });
  
  it('calls onChange when incremented', () => {
    const onChange = vi.fn();
    render(<QuantitySelector value={1} onChange={onChange} max={5} />);
    fireEvent.click(screen.getByText('+'));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('calls onChange when decremented', () => {
    const onChange = vi.fn();
    render(<QuantitySelector value={1} onChange={onChange} max={5} />);
    fireEvent.click(screen.getByText('-'));
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('disables increment when max is reached', () => {
    const onChange = vi.fn();
    render(<QuantitySelector value={5} onChange={onChange} max={5} />);
    const button = screen.getByText('+') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('disables decrement when 0 is reached', () => {
    const onChange = vi.fn();
    render(<QuantitySelector value={0} onChange={onChange} max={5} />);
    const button = screen.getByText('-') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });
});
