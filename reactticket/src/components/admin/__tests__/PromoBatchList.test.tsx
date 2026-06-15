import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { PromoBatchList } from '../PromoBatchList';

afterEach(cleanup);

describe('PromoBatchList Component', () => {
  const mockBatches = [
    {
      id: 'b1',
      name: 'Summer Sale',
      discount: { kind: 'percent' },
      expiresAt: new Date('2026-06-30'),
      codes: [{ code: 'SUMMER-1', active: true, usedCount: 0 }]
    }
  ] as any;

  it('calls toggleBatchArchive when archive button is clicked', () => {
    const toggleBatchArchive = vi.fn();
    render(
      <PromoBatchList 
        batches={mockBatches}
        showArchived={false}
        setShowArchived={vi.fn()}
        expandedBatches={new Set(['b1'])}
        toggleBatch={vi.fn()}
        exportCSV={vi.fn()}
        toggleBatchActive={vi.fn()}
        toggleBatchArchive={toggleBatchArchive}
        markAsSent={vi.fn()}
        toggleCodeActive={vi.fn()}
      />
    );
    
    // Expand first
    fireEvent.click(screen.getByLabelText('Promo batch: Summer Sale'));
    
    const archiveButton = screen.getByRole('button', { name: 'Archive Summer Sale' });
    fireEvent.click(archiveButton);
    expect(toggleBatchArchive).toHaveBeenCalledWith('b1');
  });
});
