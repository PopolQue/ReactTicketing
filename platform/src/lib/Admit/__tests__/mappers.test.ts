import { describe, it, expect } from 'vitest';
import { 
  mapDbRowToTicketTypeConfig, 
  mapTicketTypeConfigToRow, 
  mapDbRowToScanAccount, 
  mapScanAccountToRow,
  mapScanAccountPatchToRow,
  mapDbRowToOrder,
  mapOrderToRow,
  mapDbRowToTicket,
  mapTicketToRow,
  mapDbRowToScanEvent,
  mapScanEventToRow,
  mapDbRowToPromoBatch,
  mapPromoBatchToRow,
  mapEventToAdmitConfig
} from '../mappers';
import type { TicketTypeConfig, ScanAccount } from 'reactticket-core';

describe('Admit Mappers', () => {
  it('UT-SA-02: mapDbRowToTicketTypeConfig and mapTicketTypeConfigToRow are bidirectional', () => {
    const config: TicketTypeConfig = {
      id: 'tt_1',
      name: 'General Admission',
      description: 'Standard entry',
      pricing: { amount: 1000, currency: 'EUR' },
      capacity: 500,
      maxPerOrder: 4,
      saleStartDate: new Date('2026-06-01T00:00:00.000Z'),
      saleEndDate: new Date('2026-06-10T00:00:00.000Z'),
      validFrom: new Date('2026-06-12T18:00:00.000Z'),
      validUntil: new Date('2026-06-13T02:00:00.000Z'),
      transferable: true,
      visible: true,
      archived: false,
    };

    const eventId = 'ev_123';
    
    // Config -> Row
    const row = mapTicketTypeConfigToRow(eventId, config);
    expect(row).toEqual({
      id: 'tt_1',
      event_id: 'ev_123',
      name: 'General Admission',
      description: 'Standard entry',
      pricing: { amount: 1000, currency: 'EUR' },
      capacity: 500,
      max_per_order: 4,
      sale_start_date: '2026-06-01T00:00:00.000Z',
      sale_end_date: '2026-06-10T00:00:00.000Z',
      valid_from: '2026-06-12T18:00:00.000Z',
      valid_until: '2026-06-13T02:00:00.000Z',
      transferable: true,
      visible: true,
      archived: false,
    });

    // Row -> Config
    // Note that the mapper drops eventId if we strictly compare to config, because TicketTypeConfig doesn't usually have eventId
    // Oh wait, TicketTypeConfig doesn't have event_id in reactticket-core interface? Wait, it might.
    // In mappers.ts we defined eventId: row.event_id.
    const mappedBack = mapDbRowToTicketTypeConfig(row);
    expect(mappedBack).toEqual({ ...config, eventId: 'ev_123' });
  });

  it('mapDbRowToScanAccount and mapScanAccountToRow are bidirectional', () => {
    const account: ScanAccount = {
      id: 'sa_1',
      eventId: 'ev_123',
      username: 'scan_crew',
      pinHash: 'hash',
      pinSalt: 'salt',
      credentialVersion: 1,
      active: true,
      createdAt: new Date('2026-06-01T00:00:00.000Z'),
      createdByAdmin: true,
      assignedLocation: 'Main Gate',
      lastLoginAt: new Date('2026-06-12T18:00:00.000Z'),
    };

    const row = mapScanAccountToRow(account);
    const mappedBack = mapDbRowToScanAccount(row);
    
    expect(mappedBack).toEqual(account);
  });

  it('mapScanAccountPatchToRow maps patches correctly', () => {
    const patch = {
      username: 'new_name',
      active: false,
      assignedLocation: 'Backstage',
    };
    const row = mapScanAccountPatchToRow(patch);
    expect(row).toEqual({
      username: 'new_name',
      active: false,
      assigned_location: 'Backstage',
    });
  });

  it('mapDbRowToOrder and mapOrderToRow are bidirectional', () => {
    const order = {
      id: 'o_1',
      eventId: 'ev_123',
      items: [{ ticketTypeId: 'tt_1', quantity: 2, unitPriceBeforeDiscountCents: 1000, unitPriceCents: 1000, personalizations: [] }],
      buyerEmail: 'buyer@email.com',
      promoCode: 'DISCOUNT',
      subtotalCents: 2000,
      discountCents: 200,
      totalCents: 1800,
      status: 'confirmed' as const,
      createdAt: new Date('2026-06-01T00:00:00.000Z'),
    };
    const row = mapOrderToRow(order);
    const mappedBack = mapDbRowToOrder(row);
    expect(mappedBack).toEqual(order);
  });

  it('mapDbRowToTicket and mapTicketToRow are bidirectional', () => {
    const ticket = {
      id: 't_1',
      eventId: 'ev_123',
      ticketTypeId: 'tt_1',
      orderId: 'o_1',
      personalization: { name: 'John', surname: 'Doe', email: 'john@doe.com', country: 'US', city: 'NY' },
      buyerEmail: 'buyer@email.com',
      issuedAt: new Date('2026-06-01T00:00:00.000Z'),
      validFrom: new Date('2026-06-01T00:00:00.000Z'),
      validUntil: new Date('2026-06-02T00:00:00.000Z'),
      status: 'pending_delivery' as const,
      qrPayload: 'qr_payload_string',
      pricePaidCents: 1000,
      transferHistory: [],
      ownerId: 'owner_123'
    };
    const row = mapTicketToRow(ticket);
    const mappedBack = mapDbRowToTicket(row);
    expect(mappedBack).toEqual(ticket);
  });

  it('mapDbRowToScanEvent and mapScanEventToRow are bidirectional', () => {
    const scan = {
      id: 's_1',
      ticketId: 't_1',
      scannedAt: new Date('2026-06-01T00:00:00.000Z'),
      scannedByAccountId: 'sa_1',
      scannedByAccountName: 'scan_crew',
      result: 'admitted' as const,
      payload: 'qr_payload',
      clockSkewSeconds: 2,
      location: 'Gate A'
    };
    const row = mapScanEventToRow(scan);
    const mappedBack = mapDbRowToScanEvent(row);
    expect(mappedBack).toEqual(scan);
  });

  it('mapDbRowToPromoBatch and mapPromoBatchToRow are bidirectional', () => {
    const batch = {
      id: 'pb_1',
      eventId: 'ev_123',
      config: { type: 'percent', value: 10, maxUsages: 100 } as any,
      codes: ['CODE1', 'CODE2'],
      createdAt: new Date('2026-06-01T00:00:00.000Z'),
    };
    const row = mapPromoBatchToRow(batch);
    const mappedBack = mapDbRowToPromoBatch(row);
    expect(mappedBack).toEqual(batch);
  });

  it('mapEventToAdmitConfig maps DB event payload to Admit configuration model', () => {
    const event = {
      id: 'ev_1',
      name: 'Gig',
      description: 'Music event',
      location_name: 'Main Stage',
      start_time: '2026-06-12T18:00:00.000Z',
      end_time: '2026-06-13T02:00:00.000Z',
      images: ['logo_url'],
      organizers: { name: 'Admit Org' },
      timezone: 'GMT',
      settings: { maxOrderSize: 5 },
      theme_customization: { bgColor: '#000', accentColor: '#fff', textColor: '#ccc', cardColor: '#222' }
    };
    const config = mapEventToAdmitConfig(event);
    expect(config).toEqual({
      id: 'ev_1',
      name: 'Gig',
      description: 'Music event',
      venue: 'Main Stage',
      startDate: new Date('2026-06-12T18:00:00.000Z'),
      endDate: new Date('2026-06-13T02:00:00.000Z'),
      logoUrl: 'logo_url',
      organizerName: 'Admit Org',
      timezone: 'GMT',
      ticketTypes: [],
      settings: {
        maxOrderSize: 5,
        requireBuyerEmail: true,
        adminKey: '',
      },
      theme: {
        bgColor: '#000',
        accentColor: '#fff',
        textColor: '#ccc',
        cardColor: '#222'
      }
    });
  });
});
