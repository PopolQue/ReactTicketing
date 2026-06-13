import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDebouncedSearch } from './useDebouncedSearch';
import { supabase } from '../lib/supabase';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  }
}));

const mockSelect = vi.fn();
const mockIlike = vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({ limit: mockSelect }) });
const mockFrom = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ ilike: mockIlike }) });

describe('useDebouncedSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.mocked(supabase.from).mockImplementation(mockFrom as any);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('delays fetching by the debounce interval', async () => {
    mockSelect.mockResolvedValueOnce({ data: [{ id: '1', name: 'Venue A' }], error: null });

    const { result, rerender } = renderHook(
      ({ query }) => useDebouncedSearch(query, 'venues', 'name', 'is_verified', 300),
      { initialProps: { query: '' } }
    );

    // Initial query is empty
    expect(result.current.results.length).toBe(0);
    expect(result.current.loading).toBe(false);

    // Start typing
    rerender({ query: 'Venue' });

    // Should not have fetched immediately
    expect(mockSelect).not.toHaveBeenCalled();

    // Advance 100ms, still no fetch
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(mockSelect).not.toHaveBeenCalled();

    // Advance remaining 200ms
    await act(async () => {
      vi.advanceTimersByTime(200);
      await Promise.resolve(); // flush microtasks for the async fetch
    });

    // Should fetch now
    expect(mockSelect).toHaveBeenCalledOnce();

    expect(result.current.loading).toBe(false);
    expect(result.current.results[0].name).toBe('Venue A');
  });

  it('skips fetching if skipCondition returns true', () => {
    const skipFn = () => true;
    const { result, rerender } = renderHook(
      ({ query }) => useDebouncedSearch(query, 'venues', 'name', 'is_verified', 300, skipFn),
      { initialProps: { query: '' } }
    );

    rerender({ query: 'Venue' });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Should never fetch
    expect(mockSelect).not.toHaveBeenCalled();
    expect(result.current.results.length).toBe(0);
  });

  it('skips fetching if query is empty', () => {
    const { result, rerender } = renderHook(
      ({ query }) => useDebouncedSearch(query, 'venues', 'name', 'is_verified', 300),
      { initialProps: { query: 'Initial' } }
    );

    rerender({ query: '' });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(mockSelect).not.toHaveBeenCalled();
    expect(result.current.results.length).toBe(0);
  });
});
