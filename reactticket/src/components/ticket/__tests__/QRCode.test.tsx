import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { QRCode } from '../QRCode';
import { QRGenerator } from 'reactticket-core/services/QRGenerator';

afterEach(cleanup);

// Mock QRGenerator
vi.spyOn(QRGenerator, 'generate').mockReturnValue('data:image/png;base64,mocked');

describe('QRCode Component', () => {
  it('renders the QR image when dataUri is available', async () => {
    render(<QRCode payload="test-payload" />);

    await waitFor(() => {
      expect(screen.getByRole('img', { name: 'Ticket QR Code' })).toBeDefined();
    });

    const img = screen.getByRole('img', { name: 'Ticket QR Code' }) as HTMLImageElement;
    expect(img.src).toBe('data:image/png;base64,mocked');
  });
});
