import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ScannerLogin } from '../ScannerLogin';
import * as useScanAuthModule from '../../../hooks/useScanAuth';
import * as useReactTicketModule from '../../../hooks/useReactTicket';

afterEach(cleanup);

describe('ScannerLogin', () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(useReactTicketModule, 'useReactTicket').mockReturnValue({
      event: { id: 'evt_1' },
      adapter: {} as any,
      authService: {} as any,
      scanService: {} as any,
      ticketService: {} as any,
    } as any);

    vi.spyOn(useScanAuthModule, 'useScanAuth').mockReturnValue({
      login: mockLogin,
      logout: vi.fn(),
      isLocked: false,
      lockRemainingSeconds: 0,
      session: null,
      error: null,
    } as any);
  });

  it('renders login form correctly', () => {
    render(<ScannerLogin />);
    expect(screen.getByPlaceholderText('Username')).toBeDefined();
    expect(screen.getByPlaceholderText('PIN')).toBeDefined();
    expect((screen.getByRole('button', { name: 'Sign in' }) as HTMLButtonElement).disabled).toBe(
      true
    );
  });

  it('updates username and pin correctly', () => {
    render(<ScannerLogin />);

    const usernameInput = screen.getByPlaceholderText('Username') as HTMLInputElement;
    fireEvent.change(usernameInput, { target: { value: 'scanner1' } });
    expect(usernameInput.value).toBe('scanner1');

    const pinInput = screen.getByPlaceholderText('PIN') as HTMLInputElement;
    fireEvent.change(pinInput, { target: { value: '1234' } });

    expect(pinInput.value).toBe('1234');

    const button = screen.getByRole('button', { name: 'Sign in' }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });

  it('calls login on submit', async () => {
    render(<ScannerLogin />);

    const usernameInput = screen.getByPlaceholderText('Username');
    fireEvent.change(usernameInput, { target: { value: 'scanner1' } });

    const pinInput = screen.getByPlaceholderText('PIN');
    fireEvent.change(pinInput, { target: { value: '5678' } });

    const form = screen.getByRole('button', { name: 'Sign in' }).closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('scanner1', '5678');
    });
  });

  it('shows error message on failed login', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));
    render(<ScannerLogin />);

    const usernameInput = screen.getByPlaceholderText('Username');
    fireEvent.change(usernameInput, { target: { value: 'scanner1' } });

    const pinInput = screen.getByPlaceholderText('PIN');
    fireEvent.change(pinInput, { target: { value: '00' } });

    const form = screen.getByRole('button', { name: 'Sign in' }).closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe('Invalid credentials');
    });
  });

  it('shows locked state when locked out', () => {
    vi.spyOn(useScanAuthModule, 'useScanAuth').mockReturnValue({
      login: mockLogin,
      logout: vi.fn(),
      isLocked: true,
      lockRemainingSeconds: 30,
      session: null,
      error: null,
    } as any);

    render(<ScannerLogin />);
    expect(screen.getByText('Locked — retry in 30s')).toBeDefined();
    expect(screen.queryByPlaceholderText('Username')).toBeNull();
  });
});
