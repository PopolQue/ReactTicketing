import { describe, it, expect } from 'vitest';
import { 
  mapDbRowToTicketTypeConfig, 
  mapTicketTypeConfigToRow, 
  mapDbRowToScanAccount, 
  mapScanAccountToRow 
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
});
