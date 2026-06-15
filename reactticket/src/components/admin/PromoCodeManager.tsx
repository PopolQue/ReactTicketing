import React from 'react';
import { usePromoBatches } from '../../hooks/usePromoBatches';
import { PromoBatchForm } from './PromoBatchForm';
import { PromoBatchList } from './PromoBatchList';

export const PromoCodeManager: React.FC = () => {
  const {
    batches,
    newBatch,
    setNewBatch,
    expandedBatches,
    showArchived,
    setShowArchived,
    toggleBatch,
    generateBatch,
    markAsSent,
    toggleCodeActive,
    toggleBatchActive,
    toggleBatchArchive,
    exportCSV,
    ticketTypes
  } = usePromoBatches();

  return (
    <section style={{ marginTop: '20px' }} role="region" aria-label="Promo Code Manager">
      <h3>Promo Code Batches</h3>
      <PromoBatchForm 
        newBatch={newBatch}
        setNewBatch={setNewBatch}
        generateBatch={generateBatch}
        ticketTypes={ticketTypes}
      />
      <PromoBatchList 
        batches={batches}
        showArchived={showArchived}
        setShowArchived={setShowArchived}
        expandedBatches={expandedBatches}
        toggleBatch={toggleBatch}
        exportCSV={exportCSV}
        toggleBatchActive={toggleBatchActive}
        toggleBatchArchive={toggleBatchArchive}
        markAsSent={markAsSent}
        toggleCodeActive={toggleCodeActive}
      />
    </section>
  );
};
