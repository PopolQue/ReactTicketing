import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { TicketDownload } from '../TicketDownload';
import { PDFRenderer } from 'reactticket-core/services/PDFRenderer';

afterEach(cleanup);

// Mock PDFRenderer
vi.spyOn(PDFRenderer, 'render').mockResolvedValue(new Blob(['mock-pdf-content'], { type: 'image/png' }));

describe('TicketDownload Component', () => {
  const mockTicket = { id: 't1' } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock URL
    vi.stubGlobal('URL', {
        createObjectURL: vi.fn().mockReturnValue('mock-url'),
        revokeObjectURL: vi.fn(),
    });
  });

  it('renders correctly and triggers download', async () => {
    const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn(),
    };
    
    // Use the original implementation to avoid recursion
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'a') return mockAnchor as any;
        return originalCreateElement(tagName);
    });

    render(<TicketDownload ticket={mockTicket} eventName="Event Name" />);
    
    const button = screen.getByRole('button', { name: /Download ticket t1 for Event Name/i });
    fireEvent.click(button);
    
    await vi.waitFor(() => {
        expect(PDFRenderer.render).toHaveBeenCalledWith('t1', 'Event Name');
        expect(mockAnchor.click).toHaveBeenCalled();
    });
    
    createElementSpy.mockRestore();
  });
});
