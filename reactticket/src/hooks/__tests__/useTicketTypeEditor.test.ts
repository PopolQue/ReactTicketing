import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTicketTypeEditor } from '../useTicketTypeEditor';
import * as useReactTicketModule from '../useReactTicket';

describe('useTicketTypeEditor', () => {
  const mockDispatch = vi.fn();
  const mockSaveTicketType = vi.fn();
  const mockGetTicketTypes = vi.fn();
  
  const mockAdapter = {
    saveTicketType: mockSaveTicketType,
    getTicketTypes: mockGetTicketTypes,
  };

  const mockEvent = { id: 'evt_1', timezone: 'UTC' };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(useReactTicketModule, 'useReactTicket').mockReturnValue({
      ticketTypes: [],
      adapter: mockAdapter,
      event: mockEvent,
      dispatch: mockDispatch,
      cart: { items: [], personalizations: {} },
      authSession: null,
      promoDetails: null,
      scanAccounts: [],
      scanState: { isScanning: false, lastResult: null }
    } as any);
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useTicketTypeEditor());
    
    expect(result.current.newType.name).toBe('');
    expect(result.current.ticketTypes).toEqual([]);
  });

  it('adds a new ticket type', async () => {
    mockGetTicketTypes.mockResolvedValue([{ id: 'tt_1', name: 'Standard' }]);
    
    const { result } = renderHook(() => useTicketTypeEditor());
    
    act(() => {
      result.current.setNewType({
        name: 'Standard',
        price: 1000,
        currency: 'EUR',
        capacity: 100,
        visible: true,
        startDate: '',
        startTime: '00:00',
        endDate: '',
        endTime: '23:59'
      });
    });

    await act(async () => {
      await result.current.addTicketType();
    });

    expect(mockSaveTicketType).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_TICKET_TYPES', payload: [{ id: 'tt_1', name: 'Standard' }] });
  });

  it('toggles archive status', async () => {
    mockGetTicketTypes.mockResolvedValue([{ id: 'tt_1', name: 'Standard', archived: true }]);
    
    const { result } = renderHook(() => useTicketTypeEditor());
    
    await act(async () => {
      await result.current.toggleArchive({ id: 'tt_1', name: 'Standard', archived: false } as any);
    });

    expect(mockSaveTicketType).toHaveBeenCalledWith('evt_1', expect.objectContaining({ archived: true }));
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_TICKET_TYPES', payload: [{ id: 'tt_1', name: 'Standard', archived: true }] });
  });

  it('edits and saves a ticket type', async () => {
    mockGetTicketTypes.mockResolvedValue([{ id: 'tt_1', name: 'Updated' }]);
    
    const { result } = renderHook(() => useTicketTypeEditor());
    const type = { id: 'tt_1', name: 'Standard' } as any;

    act(() => {
        result.current.startEdit(type);
    });
    
    expect(result.current.editingId).toBe('tt_1');

    act(() => {
        result.current.setEditValues({ name: 'Updated' });
    });

    await act(async () => {
        await result.current.saveTicketType(type);
    });

    expect(mockSaveTicketType).toHaveBeenCalledWith('evt_1', expect.objectContaining({ name: 'Updated' }));
    expect(result.current.editingId).toBeNull();
  });

  it('formats date time for timezone', () => {
    const { result } = renderHook(() => useTicketTypeEditor());
    
    const date = new Date('2026-06-01T12:00:00Z');
    const formatted = result.current.formatDateTimeForTimezone(date);
    
    // The format is en-GB, which is DD/MM/YYYY
    expect(formatted).toBe('01/06/2026, 12:00');
    
    expect(result.current.formatDateTimeForTimezone()).toBe('-');
  });
});
