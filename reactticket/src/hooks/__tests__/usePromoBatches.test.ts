import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePromoBatches } from '../usePromoBatches';
import * as useReactTicketModule from '../useReactTicket';

describe('usePromoBatches', () => {
  const mockListPromoBatches = vi.fn();
  const mockSavePromoBatch = vi.fn();
  const mockDispatch = vi.fn();

  const mockBatch = {
    id: 'b1',
    name: 'TEST',
    codes: [
      { code: 'T1', active: true, sentAt: undefined },
      { code: 'T2', active: false, sentAt: undefined },
    ],
    expiresAt: new Date('2026-07-01'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(useReactTicketModule, 'useReactTicket').mockReturnValue({
      adapter: {
        listPromoBatches: mockListPromoBatches,
        savePromoBatch: mockSavePromoBatch,
      },
      ticketTypes: [],
      dispatch: mockDispatch,
      event: { id: 'evt_1' },
    } as any);

    mockListPromoBatches.mockResolvedValue([mockBatch]);
  });

  it('lists batches on mount', async () => {
    const { result } = renderHook(() => usePromoBatches());

    await waitFor(() => {
      expect(result.current.batches.length).toBe(1);
    });

    expect(mockListPromoBatches).toHaveBeenCalled();
  });

  it('marks code as sent', async () => {
    const { result } = renderHook(() => usePromoBatches());

    await waitFor(() => {
      expect(result.current.batches.length).toBe(1);
    });

    await act(async () => {
      await result.current.markAsSent('b1', 'T1');
    });

    expect(mockSavePromoBatch).toHaveBeenCalled();
    expect(mockSavePromoBatch.mock.calls[0][0].codes[0].sentAt).toBeDefined();
  });

  it('toggles code active status', async () => {
    const { result } = renderHook(() => usePromoBatches());

    await waitFor(() => {
      expect(result.current.batches.length).toBe(1);
    });

    await act(async () => {
      await result.current.toggleCodeActive('b1', 'T1');
    });

    expect(mockSavePromoBatch).toHaveBeenCalled();
    expect(mockSavePromoBatch.mock.calls[0][0].codes[0].active).toBe(false);
  });

  it('toggles batch archive status', async () => {
    const { result } = renderHook(() => usePromoBatches());

    await waitFor(() => {
      expect(result.current.batches.length).toBe(1);
    });

    await act(async () => {
      await result.current.toggleBatchArchive('b1');
    });

    expect(mockSavePromoBatch).toHaveBeenCalled();
    expect(mockSavePromoBatch.mock.calls[0][0].archived).toBe(true);
  });

  it('exports CSV', async () => {
    const { result } = renderHook(() => usePromoBatches());

    await waitFor(() => {
      expect(result.current.batches.length).toBe(1);
    });

    vi.stubGlobal('URL', { createObjectURL: vi.fn(), revokeObjectURL: vi.fn() });
    const mockAnchor = { href: '', download: '', click: vi.fn(), setAttribute: vi.fn() };
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
    vi.spyOn(document.body, 'appendChild').mockImplementation((() => {}) as any);
    vi.spyOn(document.body, 'removeChild').mockImplementation((() => {}) as any);

    act(() => {
      result.current.exportCSV(mockBatch as any);
    });

    expect(mockAnchor.click).toHaveBeenCalled();
  });
});
