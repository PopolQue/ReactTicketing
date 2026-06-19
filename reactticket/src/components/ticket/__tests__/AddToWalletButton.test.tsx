import React from 'react';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AddToWalletButton } from '../AddToWalletButton';
import * as useReactTicketModule from '../../../hooks/useReactTicket';

describe('AddToWalletButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(useReactTicketModule, 'useReactTicket').mockReturnValue({
      adapter: {}
    } as any);

    // Mock global fetch
    global.fetch = vi.fn();
  });

  afterEach(() => {
      cleanup();
  });

  it('renders button and handles successful generation', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ passUrl: 'test-url' })
    });

    render(<AddToWalletButton ticketId="ticket_123" />);
    
    const button = screen.getByText('Add to Wallet');
    expect(button).toBeTruthy();

    await act(async () => {
      fireEvent.click(button);
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/generate-wallet-pass', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId: 'ticket_123' })
    });
  });

  it('handles generation error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: 'Internal Server Error' })
    });

    render(<AddToWalletButton ticketId="ticket_123" />);
    
    const button = screen.getByText('Add to Wallet');
    
    await act(async () => {
      fireEvent.click(button);
    });

    expect(consoleSpy).toHaveBeenCalledWith('Error generating wallet pass:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('handles fetch exception', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    render(<AddToWalletButton ticketId="ticket_123" />);
    
    const button = screen.getByText('Add to Wallet');
    
    await act(async () => {
      fireEvent.click(button);
    });

    expect(consoleSpy).toHaveBeenCalledWith('Error generating wallet pass:', expect.any(Error));
    consoleSpy.mockRestore();
  });
});
