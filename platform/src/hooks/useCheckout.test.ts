import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCheckout } from './useCheckout';
import { supabase } from '../lib/supabase';
import { ToastProvider } from '../components/Toast';
import React from 'react';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn()
    },
    rpc: vi.fn()
  }
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  React.createElement(ToastProvider, null, children)
);

const mockSelect = vi.fn();
const mockEq = vi.fn().mockReturnValue({ order: mockSelect });
const mockFrom = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ eq: mockEq }) });

describe('useCheckout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.from).mockImplementation(mockFrom as any);
  });

  const mockTiers = [
    { id: 'tier-1', name: 'General Admission', pricing: { amount: 2000 } }, // 20 EUR
    { id: 'tier-2', name: 'VIP', pricing: { amount: 5000 } }, // 50 EUR
  ];

  it('builds ticket forms from cart correctly and calculates subtotal', async () => {
    // Return empty checkout fields
    mockSelect.mockResolvedValueOnce({ data: [], error: null });

    const mockCart = {
      'tier-1': 2,
      'tier-2': 1
    };

    const { result } = renderHook(() => useCheckout({ eventId: 'event-123', tiers: mockTiers, cart: mockCart }), { wrapper });
    
    // Initially loading is true
    expect(result.current.loading).toBe(true);

    // Wait for the async useEffect to finish
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // 2 GA tickets + 1 VIP ticket = 3 forms
    expect(result.current.ticketForms.length).toBe(3);
    
    const gaForms = result.current.ticketForms.filter(t => t.tier.id === 'tier-1');
    const vipForms = result.current.ticketForms.filter(t => t.tier.id === 'tier-2');
    
    expect(gaForms.length).toBe(2);
    expect(vipForms.length).toBe(1);

    // Subtotal: 2 * 2000 + 1 * 5000 = 9000
    expect(result.current.subtotalCents).toBe(9000);
  });

  it('validates forms correctly based on required fields', async () => {
    // Return a required checkout field
    mockSelect.mockResolvedValueOnce({ 
      data: [{ id: 'field-1', label: 'First Name', is_required: true, field_type: 'TEXT' }], 
      error: null 
    });

    const mockCart = { 'tier-1': 1 };
    const { result } = renderHook(() => useCheckout({ eventId: 'event-123', tiers: mockTiers, cart: mockCart, guestEmail: 'test@example.com' }), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.ticketForms.length).toBe(1);

    // Should fail validation initially because the required field is empty
    expect(result.current.validateForms()).toBe(false);

    // Simulate user filling out the form
    act(() => {
      result.current.handleAnswerChange(result.current.ticketForms[0].id, 'field-1', 'John Doe');
    });

    // Should now pass validation
    expect(result.current.validateForms()).toBe(true);
  });

  it('executes purchase transaction successfully', async () => {
    mockSelect.mockResolvedValueOnce({ data: [], error: null });
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: { id: 'user-123', email: 'user@email.com' } }
    } as any);
    const mockRpc = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.rpc).mockImplementation(mockRpc);

    const mockCart = { 'tier-1': 1 };
    const { result } = renderHook(() => useCheckout({ eventId: 'event-123', tiers: mockTiers, cart: mockCart, guestEmail: 'test@example.com' }), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const successMock = vi.fn();
    const errorMock = vi.fn();

    await act(async () => {
      await result.current.executePurchase({
        finalTotalCents: 2000,
        onSuccess: successMock,
        onError: errorMock
      });
    });

    expect(mockRpc).toHaveBeenCalled();
    expect(successMock).toHaveBeenCalled();
    expect(errorMock).not.toHaveBeenCalled();
  });

  it('does nothing if user is not logged in during purchase', async () => {
    mockSelect.mockResolvedValueOnce({ data: [], error: null });
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: null }
    } as any);

    const mockCart = { 'tier-1': 1 };
    // Explicitly NO guestEmail
    const { result } = renderHook(() => useCheckout({ eventId: 'event-123', tiers: mockTiers, cart: mockCart }), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const successMock = vi.fn();
    await act(async () => {
      await result.current.executePurchase({
        finalTotalCents: 2000,
        onSuccess: successMock,
        onError: vi.fn()
      });
    });

    expect(successMock).not.toHaveBeenCalled();
  });
});
