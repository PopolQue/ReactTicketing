import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { PromoBatchForm } from '../PromoBatchForm';

afterEach(cleanup);

describe('PromoBatchForm Component', () => {
  const mockNewBatch = {
    name: '',
    count: 10,
    discountType: 'percent' as const,
    discountValue: 10,
    ticketTypeId: '',
    expiresAt: ''
  };

  const ticketTypes = [
      { id: 't1', name: 'Standard' }
  ] as any;

  it('calls setNewBatch when count input changes', () => {
    const setNewBatch = vi.fn();
    render(
      <PromoBatchForm 
        newBatch={mockNewBatch} 
        setNewBatch={setNewBatch} 
        generateBatch={vi.fn()} 
        ticketTypes={ticketTypes} 
      />
    );
    
    const countInput = screen.getByLabelText('Count');
    fireEvent.change(countInput, { target: { value: '25' } });
    
    expect(setNewBatch).toHaveBeenCalledWith({ ...mockNewBatch, count: 25 });
  });

  it('calls setNewBatch when discount type changes', () => {
    const setNewBatch = vi.fn();
    render(
      <PromoBatchForm 
        newBatch={mockNewBatch} 
        setNewBatch={setNewBatch} 
        generateBatch={vi.fn()} 
        ticketTypes={ticketTypes} 
      />
    );
    
    const typeSelect = screen.getByLabelText('Discount Type');
    fireEvent.change(typeSelect, { target: { value: 'free' } });
    
    expect(setNewBatch).toHaveBeenCalledWith({ ...mockNewBatch, discountType: 'free' });
  });

  it('calls setNewBatch when expiresAt changes', () => {
    const setNewBatch = vi.fn();
    render(
      <PromoBatchForm 
        newBatch={mockNewBatch} 
        setNewBatch={setNewBatch} 
        generateBatch={vi.fn()} 
        ticketTypes={ticketTypes} 
      />
    );
    
    const expiresInput = screen.getByLabelText('Expires');
    fireEvent.change(expiresInput, { target: { value: '2026-07-01' } });
    
    expect(setNewBatch).toHaveBeenCalledWith({ ...mockNewBatch, expiresAt: '2026-07-01' });
  });

  it('calls generateBatch when clicked', () => {
    const generateBatch = vi.fn();
    render(
      <PromoBatchForm 
        newBatch={mockNewBatch} 
        setNewBatch={vi.fn()} 
        generateBatch={generateBatch} 
        ticketTypes={ticketTypes} 
      />
    );
    
    const generateButton = screen.getByLabelText('Generate promo batch');
    fireEvent.click(generateButton);
    
    expect(generateBatch).toHaveBeenCalled();
  });

  it('calls setNewBatch when Batch Name changes', () => {
    const setNewBatch = vi.fn();
    render(
      <PromoBatchForm 
        newBatch={mockNewBatch} 
        setNewBatch={setNewBatch} 
        generateBatch={vi.fn()} 
        ticketTypes={ticketTypes} 
      />
    );
    
    const nameInput = screen.getByLabelText('Batch Name');
    fireEvent.change(nameInput, { target: { value: 'Winter Sale' } });
    
    expect(setNewBatch).toHaveBeenCalledWith({ ...mockNewBatch, name: 'Winter Sale' });
  });

  it('calls setNewBatch when discount value changes', () => {
    const setNewBatch = vi.fn();
    render(
      <PromoBatchForm 
        newBatch={mockNewBatch} 
        setNewBatch={setNewBatch} 
        generateBatch={vi.fn()} 
        ticketTypes={ticketTypes} 
      />
    );
    
    const discountInput = screen.getByLabelText('Discount %');
    fireEvent.change(discountInput, { target: { value: '25' } });
    
    expect(setNewBatch).toHaveBeenCalledWith({ ...mockNewBatch, discountValue: 25 });
  });

  it('calls setNewBatch when Applies To ticket type changes for free discount', () => {
    const setNewBatch = vi.fn();
    const mockFreeBatch = { ...mockNewBatch, discountType: 'free' as const };
    render(
      <PromoBatchForm 
        newBatch={mockFreeBatch} 
        setNewBatch={setNewBatch} 
        generateBatch={vi.fn()} 
        ticketTypes={ticketTypes} 
      />
    );
    
    const ticketSelect = screen.getByLabelText('Applies To');
    fireEvent.change(ticketSelect, { target: { value: 't1' } });
    
    expect(setNewBatch).toHaveBeenCalledWith({ ...mockFreeBatch, ticketTypeId: 't1' });
  });
});
