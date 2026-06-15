import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { AdminPanel } from '../AdminPanel';
import * as useReactTicketModule from '../../../hooks/useReactTicket';
import * as useScanAuthModule from '../../../hooks/useScanAuth';
import { AuthService } from 'reactticket-core/services/AuthService';

afterEach(cleanup);

// Mock services/hooks
const mockVerifyAdminKey = vi.fn();
vi.mock('reactticket-core/services/AuthService', () => ({
  AuthService: class {
    verifyAdminKey = mockVerifyAdminKey;
  }
}));

vi.mock('../TicketTypeEditor', () => ({ TicketTypeEditor: () => <div data-testid="ticket-type-editor" /> }));
vi.mock('../PromoCodeManager', () => ({ PromoCodeManager: () => <div data-testid="promo-code-manager" /> }));
vi.mock('../CapacityOverview', () => ({ CapacityOverview: () => <div data-testid="capacity-overview" /> }));
vi.mock('../ScanAccountManager', () => ({ ScanAccountManager: () => <div data-testid="scan-account-manager" /> }));

describe('AdminPanel Component', () => {
  const mockDispatch = vi.fn();
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.stubGlobal('alert', vi.fn());

    vi.spyOn(useReactTicketModule, 'useReactTicket').mockReturnValue({
      authSession: null,
      event: { id: 'evt_1', settings: {} },
      adapter: {},
      dispatch: mockDispatch
    } as any);

    vi.spyOn(useScanAuthModule, 'useScanAuth').mockReturnValue({
        logout: mockLogout
    } as any);
  });

  it('handles login success', async () => {
    mockVerifyAdminKey.mockResolvedValue(true);
    
    render(<AdminPanel />);
    
    const input = screen.getByPlaceholderText('Enter admin password');
    fireEvent.change(input, { target: { value: 'password123' } });
    fireEvent.click(screen.getByText('Login'));
    
    await waitFor(() => {
        expect(mockVerifyAdminKey).toHaveBeenCalledWith('password123');
        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'SET_AUTH_SESSION',
            payload: { isAdmin: true, role: 'admin' }
        });
    });
  });

  it('handles logout', async () => {
    vi.spyOn(useReactTicketModule, 'useReactTicket').mockReturnValue({
      authSession: { role: 'admin' },
      event: { id: 'evt_1', settings: {} },
      adapter: {},
      dispatch: mockDispatch
    } as any);

    render(<AdminPanel />);
    
    const logoutButton = screen.getByLabelText('Logout from Admin Panel');
    fireEvent.click(logoutButton);
    
    expect(mockLogout).toHaveBeenCalled();
  });
});
