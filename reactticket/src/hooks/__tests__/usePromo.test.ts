import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePromo } from '../usePromo';
import * as useReactTicketModule from '../useReactTicket';

describe('usePromo', () => {
  const mockAdapter = {};
  const mockDispatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(useReactTicketModule, 'useReactTicket').mockReturnValue({
      adapter: mockAdapter,
      dispatch: mockDispatch
    } as any);
  });

  it('provides placeholder methods', async () => {
    const { result } = renderHook(() => usePromo());
    
    expect(await result.current.generate({})).toEqual([]);
    expect(await result.current.deactivate('CODE')).toBeUndefined();
    expect(result.current.exportCSV()).toBe("");
  });
});
