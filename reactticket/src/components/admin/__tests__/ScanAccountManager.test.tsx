import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { ScanAccountManager } from '../ScanAccountManager';
import { ReactTicketProvider } from '../../../context/ReactTicketContext';
import * as useReactTicketModule from '../../../hooks/useReactTicket';
import { ScanAccountService } from 'reactticket-core/services/ScanAccountService';

afterEach(cleanup);

// Mock ScanAccountService
const mockCreateAccount = vi.fn();
const mockDeactivate = vi.fn();
const mockReactivate = vi.fn();
const mockDelete = vi.fn();
const mockResetPin = vi.fn();

vi.mock('reactticket-core/services/ScanAccountService', () => ({
  ScanAccountService: class {
    createAccount = mockCreateAccount;
    deactivate = mockDeactivate;
    reactivate = mockReactivate;
    delete = mockDelete;
    resetPin = mockResetPin;
  },
}));

describe('ScanAccountManager Component', () => {
  const mockAdapter = {
    listScanAccounts: vi.fn(),
    saveScanAccount: vi.fn().mockResolvedValue(true),
  };
  const mockEvent = { id: 'evt_1' };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
    vi.stubGlobal('alert', vi.fn());

    vi.spyOn(useReactTicketModule, 'useReactTicket').mockReturnValue({
      adapter: mockAdapter,
      event: mockEvent,
    } as any);

    mockAdapter.listScanAccounts.mockResolvedValue([
      { id: 'sa1', username: 'crew1', assignedLocation: 'Gate A', active: true },
    ]);
  });

  it('successfully creates account', async () => {
    render(
      <ReactTicketProvider
        event={mockEvent as any}
        adapter={mockAdapter as any}
        onCheckout={vi.fn()}
      >
        <ScanAccountManager />
      </ReactTicketProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('crew1')).toBeDefined();
    });

    fireEvent.change(screen.getByLabelText('New Account Username'), { target: { value: 'crew2' } });
    fireEvent.change(screen.getByLabelText('New Account PIN'), { target: { value: '1234' } });
    fireEvent.click(screen.getByText('Create Account'));

    await waitFor(() => {
      expect(mockCreateAccount).toHaveBeenCalledWith('evt_1', 'crew2', '1234', '');
    });
  });

  it('successfully updates account', async () => {
    render(
      <ReactTicketProvider
        event={mockEvent as any}
        adapter={mockAdapter as any}
        onCheckout={vi.fn()}
      >
        <ScanAccountManager />
      </ReactTicketProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('crew1')).toBeDefined();
    });

    fireEvent.click(screen.getByLabelText('Edit account crew1'));

    const locationInput = screen.getByLabelText('Edit assigned location for crew1');
    fireEvent.change(locationInput, { target: { value: 'Gate B' } });
    fireEvent.click(screen.getByLabelText('Save changes for crew1'));

    await waitFor(() => {
      expect(mockAdapter.saveScanAccount).toHaveBeenCalled();
    });
  });

  it('successfully deletes account', async () => {
    render(
      <ReactTicketProvider
        event={mockEvent as any}
        adapter={mockAdapter as any}
        onCheckout={vi.fn()}
      >
        <ScanAccountManager />
      </ReactTicketProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('crew1')).toBeDefined();
    });

    fireEvent.click(screen.getByLabelText('Delete account crew1'));

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith('sa1');
    });
  });

  it('successfully resets PIN', async () => {
    render(
      <ReactTicketProvider
        event={mockEvent as any}
        adapter={mockAdapter as any}
        onCheckout={vi.fn()}
      >
        <ScanAccountManager />
      </ReactTicketProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('crew1')).toBeDefined();
    });

    fireEvent.click(screen.getByLabelText('Reset PIN for account crew1'));

    const pinInput = screen.getByLabelText('New PIN');
    fireEvent.change(pinInput, { target: { value: '9999' } });
    fireEvent.click(screen.getByText('Save New PIN'));

    await waitFor(() => {
      expect(mockResetPin).toHaveBeenCalledWith('sa1', '9999');
    });
  });
});
