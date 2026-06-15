import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TicketTypeEditor } from '../TicketTypeEditor';
import { ReactTicketProvider } from '../../../context/ReactTicketContext';
import { useTicketTypeEditor } from '../../../hooks/useTicketTypeEditor';

// Mock the hook
vi.mock('../../../hooks/useTicketTypeEditor', () => ({
  useTicketTypeEditor: vi.fn(),
}));

describe('TicketTypeEditor Component', () => {
  it('renders correctly', async () => {
    (useTicketTypeEditor as any).mockReturnValue({
      ticketTypes: [
        { id: 'tt1', name: 'Standard', pricing: { kind: 'paid', priceInCents: 1000, currency: 'EUR' }, capacity: 100, archived: false, visible: true },
      ],
      newType: { name: '', price: 0 },
      setNewType: vi.fn(),
      editingId: null,
      editValues: {},
      setEditValues: vi.fn(),
      editTimes: {},
      setEditTimes: vi.fn(),
      showArchived: false,
      setShowArchived: vi.fn(),
      toggleArchive: vi.fn(),
      startEdit: vi.fn(),
      saveTicketType: vi.fn(),
      addTicketType: vi.fn(),
      formatDateTimeForTimezone: vi.fn()
    });

    render(
      <ReactTicketProvider event={{ id: 'evt_1' }} adapter={{ name: 'memory' } as any} onCheckout={vi.fn()}>
        <TicketTypeEditor />
      </ReactTicketProvider>
    );
    
    expect(screen.getByText('Ticket Types Configuration')).toBeDefined();
    expect(screen.getByText('Standard')).toBeDefined();
  });
});
