import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TicketService } from '../TicketService';
import { StorageAdapter } from '../../types/adapter.types';
import { AuthService } from '../AuthService';
import { Order, TicketTypeConfig, IssuedTicket, TicketPersonalization } from '../../types/ticket.types';

describe('TicketService', () => {
  let ticketService: TicketService;
  let mockAdapter: Partial<StorageAdapter>;
  let mockAuthService: Partial<AuthService>;

  beforeEach(() => {
    mockAdapter = {
      getOrder: vi.fn(),
      getTicketTypes: vi.fn(),
      countIssuedTickets: vi.fn(),
      saveTicket: vi.fn(),
      saveTickets: vi.fn(),
      getTicket: vi.fn(),
      deliverTicket: vi.fn(),
      transferTicket: vi.fn(),
    };

    mockAuthService = {
      getSecret: vi.fn().mockReturnValue('super-secret-key'),
    };

    ticketService = new TicketService(mockAdapter as StorageAdapter, mockAuthService as AuthService);
  });

  describe('issueTickets', () => {
    it('should throw an error if order is not found', async () => {
      (mockAdapter.getOrder as any).mockResolvedValue(null);
      await expect(ticketService.issueTickets('order_1')).rejects.toThrow('Order not found');
    });

    it('should throw an error if capacity is exceeded', async () => {
      const order: Order = {
        id: 'order_1',
        eventId: 'evt_1',
        items: [{ ticketTypeId: 'tkt_type_1', quantity: 2, unitPriceBeforeDiscountCents: 1000, unitPriceCents: 1000, personalizations: [] }],
        buyerEmail: 'buyer@example.com',
        subtotalCents: 1000,
        discountCents: 0,
        totalCents: 1000,
        status: 'confirmed',
        createdAt: new Date(),
      };

      const ticketTypes: TicketTypeConfig[] = [
        { id: 'tkt_type_1', name: 'General', pricing: { kind: 'free' }, capacity: 10, transferable: true, visible: true }
      ];

      (mockAdapter.getOrder as any).mockResolvedValue(order);
      (mockAdapter.getTicketTypes as any).mockResolvedValue(ticketTypes);
      (mockAdapter.countIssuedTickets as any).mockResolvedValue(9);

      await expect(ticketService.issueTickets('order_1')).rejects.toThrow('Insufficient capacity for ticket type: General');
    });

    it('should successfully issue tickets', async () => {
      const order: Order = {
        id: 'order_1',
        eventId: 'evt_1',
        items: [{ 
          ticketTypeId: 'tkt_type_1', 
          quantity: 2, 
          unitPriceBeforeDiscountCents: 1000, 
          unitPriceCents: 1000, 
          personalizations: [
            { name: 'John', surname: 'Doe', country: 'US', city: 'NY', email: 'john@example.com' },
            { name: 'Jane', surname: 'Doe', country: 'US', city: 'NY', email: 'jane@example.com' }
          ] 
        }],
        buyerEmail: 'buyer@example.com',
        subtotalCents: 2000,
        discountCents: 0,
        totalCents: 2000,
        status: 'confirmed',
        createdAt: new Date(),
      };

      const ticketTypes: TicketTypeConfig[] = [
        { id: 'tkt_type_1', name: 'General', pricing: { kind: 'free' }, capacity: 10, transferable: true, visible: true, validFrom: new Date(), validUntil: new Date() }
      ];

      (mockAdapter.getOrder as any).mockResolvedValue(order);
      (mockAdapter.getTicketTypes as any).mockResolvedValue(ticketTypes);
      (mockAdapter.countIssuedTickets as any).mockResolvedValue(0);

      const tickets = await ticketService.issueTickets('order_1');
      
      expect(tickets.length).toBe(2);
      expect(tickets[0].eventId).toBe('evt_1');
      expect(tickets[0].ticketTypeId).toBe('tkt_type_1');
      expect(tickets[0].personalization.name).toBe('John');
      expect(tickets[1].personalization.name).toBe('Jane');
      expect(tickets[0].status).toBe('pending_delivery');
      expect(mockAdapter.saveTickets).toHaveBeenCalledTimes(1);
    });
  });

  describe('deliverTicket', () => {
    it('should throw an error if ticket not found', async () => {
      (mockAdapter.getTicket as any).mockResolvedValue(null);
      await expect(ticketService.deliverTicket('tkt_1')).rejects.toThrow('Ticket not found');
    });

    it('should throw an error if ticket is cancelled', async () => {
      (mockAdapter.getTicket as any).mockResolvedValue({ status: 'cancelled' });
      await expect(ticketService.deliverTicket('tkt_1')).rejects.toThrow('Cannot deliver cancelled ticket');
    });

    it('should successfully deliver a ticket and generate QR payload', async () => {
      // Mock crypto for test environment if running outside browser or Node 19+
      if (!globalThis.crypto) {
        globalThis.crypto = {
          subtle: {
            importKey: vi.fn().mockResolvedValue({}),
            sign: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
          }
        } as any;
      } else if (!globalThis.crypto.subtle) {
         Object.defineProperty(globalThis.crypto, 'subtle', {
            value: {
              importKey: vi.fn().mockResolvedValue({}),
              sign: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
            }
         });
      }

      const ticket: IssuedTicket = {
        id: 'tkt_1',
        eventId: 'evt_1',
        ticketTypeId: 'tkt_type_1',
        orderId: 'order_1',
        personalization: { name: 'A', surname: 'B', country: 'C', city: 'D', email: 'a@b.com' },
        buyerEmail: 'a@b.com',
        issuedAt: new Date(),
        status: 'pending_delivery',
        pricePaidCents: 1000,
      };

      (mockAdapter.getTicket as any).mockResolvedValue(ticket);

      await ticketService.deliverTicket('tkt_1');
      expect(mockAdapter.deliverTicket).toHaveBeenCalled();
      const callArgs = (mockAdapter.deliverTicket as any).mock.calls[0];
      expect(callArgs[0]).toBe('tkt_1');
      expect(callArgs[1]).toMatch(/^TF1\.evt_1\.tkt_1\..+$/);
    });
  });

  describe('transferTicket', () => {
    it('should throw an error if ticket not found', async () => {
      (mockAdapter.getTicket as any).mockResolvedValue(null);
      await expect(ticketService.transferTicket('tkt_1', 'new@email.com', {} as any)).rejects.toThrow('Ticket not found');
    });

    it('should throw an error if ticket is not pending_delivery', async () => {
      (mockAdapter.getTicket as any).mockResolvedValue({ status: 'delivered' });
      await expect(ticketService.transferTicket('tkt_1', 'new@email.com', {} as any)).rejects.toThrow('Cannot transfer a ticket that has already been delivered or cancelled.');
    });

    it('should successfully transfer a ticket', async () => {
      const ticket: IssuedTicket = {
        id: 'tkt_1',
        eventId: 'evt_1',
        ticketTypeId: 'tkt_type_1',
        orderId: 'order_1',
        personalization: { name: 'A', surname: 'B', country: 'C', city: 'D', email: 'a@b.com' },
        buyerEmail: 'a@b.com',
        issuedAt: new Date(),
        status: 'pending_delivery',
        pricePaidCents: 1000,
      };

      (mockAdapter.getTicket as any).mockResolvedValue(ticket);

      const newPersonalization: TicketPersonalization = {
        name: 'New', surname: 'User', country: 'US', city: 'LA', email: 'new@email.com'
      };

      await ticketService.transferTicket('tkt_1', 'new@email.com', newPersonalization);
      expect(mockAdapter.transferTicket).toHaveBeenCalledWith('tkt_1', 'new@email.com', newPersonalization);
    });
  });
});
