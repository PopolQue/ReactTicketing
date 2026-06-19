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
    
    const archiveButton = screen.getByRole('button', { name: 'Archive Summer Sale' });
    fireEvent.click(archiveButton);
    expect(toggleBatchArchive).toHaveBeenCalledWith('b1');
  });

  it('calls setShowArchived when Show Archived checkbox is toggled', () => {
    const setShowArchived = vi.fn();
    render(
      <PromoBatchList 
        batches={mockBatches}
        showArchived={false}
        setShowArchived={setShowArchived}
        expandedBatches={new Set()}
        toggleBatch={vi.fn()}
        exportCSV={vi.fn()}
        toggleBatchActive={vi.fn()}
        toggleBatchArchive={vi.fn()}
        markAsSent={vi.fn()}
        toggleCodeActive={vi.fn()}
      />
    );
    
    const checkbox = screen.getByLabelText('Show Archived');
    fireEvent.click(checkbox);
    expect(setShowArchived).toHaveBeenCalledWith(true);
  });

  it('calls toggleBatch on keydown Enter or Space', () => {
    const toggleBatch = vi.fn();
    render(
      <PromoBatchList 
        batches={mockBatches}
        showArchived={false}
        setShowArchived={vi.fn()}
        expandedBatches={new Set()}
        toggleBatch={toggleBatch}
        exportCSV={vi.fn()}
        toggleBatchActive={vi.fn()}
        toggleBatchArchive={vi.fn()}
        markAsSent={vi.fn()}
        toggleCodeActive={vi.fn()}
      />
    );
    
    const header = screen.getByLabelText('Promo batch: Summer Sale');
    fireEvent.keyDown(header, { key: 'Enter' });
    expect(toggleBatch).toHaveBeenCalledWith('b1');

    fireEvent.keyDown(header, { key: ' ' });
    expect(toggleBatch).toHaveBeenCalledWith('b1');
    expect(toggleBatch).toHaveBeenCalledTimes(2);
  });

  it('calls exportCSV when Export CSV button is clicked', () => {
    const exportCSV = vi.fn();
    render(
      <PromoBatchList 
        batches={mockBatches}
        showArchived={false}
        setShowArchived={vi.fn()}
        expandedBatches={new Set()}
        toggleBatch={vi.fn()}
        exportCSV={exportCSV}
        toggleBatchActive={vi.fn()}
        toggleBatchArchive={vi.fn()}
        markAsSent={vi.fn()}
        toggleCodeActive={vi.fn()}
      />
    );
    
    const exportButton = screen.getByRole('button', { name: 'Export CSV for Summer Sale' });
    fireEvent.click(exportButton);
    expect(exportCSV).toHaveBeenCalledWith(mockBatches[0]);
  });

  it('calls markAsSent and toggleCodeActive for individual codes', () => {
    const markAsSent = vi.fn();
    const toggleCodeActive = vi.fn();
    render(
      <PromoBatchList 
        batches={mockBatches}
        showArchived={false}
        setShowArchived={vi.fn()}
        expandedBatches={new Set(['b1'])}
        toggleBatch={vi.fn()}
        exportCSV={vi.fn()}
        toggleBatchActive={vi.fn()}
        toggleBatchArchive={vi.fn()}
        markAsSent={markAsSent}
        toggleCodeActive={toggleCodeActive}
      />
    );
    
    const markSentBtn = screen.getByRole('button', { name: 'Mark code SUMMER-1 as sent' });
    fireEvent.click(markSentBtn);
    expect(markAsSent).toHaveBeenCalledWith('b1', 'SUMMER-1');

    const deprecateBtn = screen.getByRole('button', { name: 'Deprecate code SUMMER-1' });
    fireEvent.click(deprecateBtn);
    expect(toggleCodeActive).toHaveBeenCalledWith('b1', 'SUMMER-1');
  });

  it('calls toggleBatchActive when Reactivate/Deprecate batch button is clicked', () => {
    const toggleBatchActive = vi.fn();
    render(
      <PromoBatchList 
        batches={mockBatches}
        showArchived={false}
        setShowArchived={vi.fn()}
        expandedBatches={new Set()}
        toggleBatch={vi.fn()}
        exportCSV={vi.fn()}
        toggleBatchActive={toggleBatchActive}
        toggleBatchArchive={vi.fn()}
        markAsSent={vi.fn()}
        toggleCodeActive={vi.fn()}
      />
    );
    
    // Batch has active codes, so it shows 'Deprecate'
    const deactivateBtn = screen.getByRole('button', { name: 'Deprecate Summer Sale' });
    fireEvent.click(deactivateBtn);
    expect(toggleBatchActive).toHaveBeenCalledWith('b1');
  });
});
