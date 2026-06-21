import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { PromoCodeManager } from '../PromoCodeManager';
import * as usePromoBatchesModule from '../../../hooks/usePromoBatches';

afterEach(cleanup);

vi.mock('../PromoBatchForm', () => ({
  PromoBatchForm: () => <div data-testid="promo-batch-form" />,
}));

vi.mock('../PromoBatchList', () => ({
  PromoBatchList: () => <div data-testid="promo-batch-list" />,
}));

describe('PromoCodeManager Component', () => {
  it('renders PromoBatchForm and PromoBatchList', () => {
    vi.spyOn(usePromoBatchesModule, 'usePromoBatches').mockReturnValue({
      batches: [],
      newBatch: {},
      setNewBatch: vi.fn(),
      expandedBatches: new Set(),
      showArchived: false,
      setShowArchived: vi.fn(),
      toggleBatch: vi.fn(),
      generateBatch: vi.fn(),
      markAsSent: vi.fn(),
      toggleCodeActive: vi.fn(),
      toggleBatchActive: vi.fn(),
      toggleBatchArchive: vi.fn(),
      exportCSV: vi.fn(),
      ticketTypes: [],
    } as any);

    render(<PromoCodeManager />);

    expect(screen.getByTestId('promo-batch-form')).toBeDefined();
    expect(screen.getByTestId('promo-batch-list')).toBeDefined();
    expect(screen.getByText('Promo Code Batches')).toBeDefined();
  });
});
