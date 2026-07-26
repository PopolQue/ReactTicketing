import { describe, it, expect, vi } from 'vitest';
import { WaitlistService } from '../WaitlistService';
import { StorageAdapter } from '../../types/adapter.types';

describe('WaitlistService', () => {
  const mockAdapter: StorageAdapter = {
    name: 'MockAdapter',
    getTicketTypes: vi.fn(),
    saveTicketType: vi.fn(),
    deleteTicketType: vi.fn(),
    createOrder: vi.fn(),
    getOrder: vi.fn(),
    updateOrderStatus: vi.fn(),
    getTicket: vi.fn(),
    getTicketsByOrder: vi.fn(),
    getIssuedTickets: vi.fn(),
    saveTicket: vi.fn(),
    saveTickets: vi.fn(),
    updateTicketStatus: vi.fn(),
    deliverTicket: vi.fn(),
    transferTicket: vi.fn(),
    countIssuedTickets: vi.fn(),
    returnTicket: vi.fn(),
    buyResaleTicket: vi.fn(),
    getPromoCode: vi.fn(),
    savePromoBatch: vi.fn(),
    listPromoBatches: vi.fn(),
    incrementPromoUsage: vi.fn(),
    saveScanEvent: vi.fn(),
    getScanEvents: vi.fn(),
    getQueuedScanEvents: vi.fn(),
    queueScanEvent: vi.fn(),
    clearQueuedScanEvents: vi.fn(),
    getScanAccount: vi.fn(),
    getScanAccountByUsername: vi.fn(),
    listScanAccounts: vi.fn(),
    saveScanAccount: vi.fn(),
    updateScanAccount: vi.fn(),
    deleteScanAccount: vi.fn(),
    incrementScanAccountLoginTimestamp: vi.fn(),
    createFriendship: vi.fn(),
    updateFriendshipStatus: vi.fn(),
    getFriends: vi.fn(),
    createTransfer: vi.fn(),
    finalizeTransfer: vi.fn(),
    createPost: vi.fn(),
    joinWaitlist: vi.fn().mockImplementation(async (entry) => ({
      id: 'wl_123',
      ...entry,
      status: 'pending',
      createdAt: new Date(),
    })),
    getWaitlistEntries: vi.fn().mockResolvedValue([
      {
        id: 'wl_123',
        eventId: 'event_1',
        ticketTypeId: 'tier_1',
        userEmail: 'waitlist@example.com',
        quantity: 2,
        status: 'pending',
        createdAt: new Date(),
      },
    ]),
    updateWaitlistStatus: vi.fn().mockResolvedValue(undefined),
  };

  const waitlistService = new WaitlistService(mockAdapter);

  it('joins waitlist successfully with valid email', async () => {
    const entry = await waitlistService.joinWaitlist('event_1', 'tier_1', 'user@example.com', 'Jane', 2);
    expect(entry).toBeDefined();
    expect(entry.userEmail).toBe('user@example.com');
    expect(entry.quantity).toBe(2);
    expect(mockAdapter.joinWaitlist).toHaveBeenCalled();
  });

  it('throws error for invalid email', async () => {
    await expect(
      waitlistService.joinWaitlist('event_1', 'tier_1', 'invalid-email')
    ).rejects.toThrow('Invalid email address');
  });

  it('notifies next in line when tickets become available', async () => {
    const notified = await waitlistService.notifyNextInLine('event_1', 'tier_1');
    expect(notified).toBeDefined();
    expect(notified?.status).toBe('notified');
    expect(mockAdapter.updateWaitlistStatus).toHaveBeenCalledWith('wl_123', 'notified');
  });
});
