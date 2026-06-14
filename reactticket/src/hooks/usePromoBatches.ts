import { useState, useEffect } from 'react';
import { PromoBatch, PromoCode } from 'reactticket-core/types/promo.types';
import { useReactTicket } from './useReactTicket';

export interface NewBatchState {
  name: string;
  count: number;
  discountType: 'percent' | 'free';
  discountValue: number;
  ticketTypeId: string;
  expiresAt: string;
}

export const usePromoBatches = () => {
  const { adapter, ticketTypes } = useReactTicket();
  const [batches, setBatches] = useState<PromoBatch[]>([]);
  const [newBatch, setNewBatch] = useState<NewBatchState>({ 
    name: '', 
    count: 10, 
    discountType: 'percent', 
    discountValue: 10, 
    ticketTypeId: '', 
    expiresAt: '' 
  });
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    adapter.listPromoBatches().then(setBatches);
  }, [adapter]);

  const toggleBatch = (batchId: string) => {
    const newExpanded = new Set(expandedBatches);
    if (newExpanded.has(batchId)) newExpanded.delete(batchId);
    else newExpanded.add(batchId);
    setExpandedBatches(newExpanded);
  };

  const generateBatch = async () => {
    if (!newBatch.name || !newBatch.expiresAt) return;
    
    const discount = newBatch.discountType === 'free' 
        ? { kind: 'free' } as const 
        : { kind: 'percent_off', percent: newBatch.discountValue } as const;

    const batchId = `batch_${Date.now()}`;
    const codes: PromoCode[] = Array.from({ length: newBatch.count }, () => ({
      code: `${newBatch.name.toUpperCase().slice(0, 3)}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      discount,
      appliesTo: newBatch.discountType === 'free' && newBatch.ticketTypeId ? [newBatch.ticketTypeId] : undefined,
      usedCount: 0,
      maxUses: 1,
      createdAt: new Date(),
      active: true,
      batchId
    }));

    const batch: PromoBatch = {
      id: batchId,
      name: newBatch.name,
      discount,
      expiresAt: new Date(newBatch.expiresAt),
      codes
    };

    await adapter.savePromoBatch(batch);
    setBatches(await adapter.listPromoBatches());
    setNewBatch({ name: '', count: 10, discountType: 'percent', discountValue: 10, ticketTypeId: '', expiresAt: '' });
  };

  const markAsSent = async (batchId: string, code: string) => {
    const batch = batches.find(b => b.id === batchId)!;
    const codeObj = batch.codes.find(c => c.code === code)!;
    codeObj.sentAt = new Date();
    await adapter.savePromoBatch(batch);
    setBatches(await adapter.listPromoBatches());
  };

  const toggleCodeActive = async (batchId: string, code: string) => {
    const batch = batches.find(b => b.id === batchId)!;
    const codeObj = batch.codes.find(c => c.code === code)!;
    codeObj.active = !codeObj.active;
    await adapter.savePromoBatch(batch);
    setBatches(await adapter.listPromoBatches());
  };

  const toggleBatchActive = async (batchId: string) => {
    const batch = batches.find(b => b.id === batchId)!;
    const newStatus = !batch.codes.every(c => !c.active);
    batch.codes.forEach(c => c.active = !newStatus);
    await adapter.savePromoBatch(batch);
    setBatches(await adapter.listPromoBatches());
  };

  const toggleBatchArchive = async (batchId: string) => {
    const batch = batches.find(b => b.id === batchId)!;
    batch.archived = !batch.archived;
    await adapter.savePromoBatch(batch);
    setBatches(await adapter.listPromoBatches());
  };

  const exportCSV = (batch: PromoBatch) => {
    const headers = ['code'];
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + batch.codes.map(c => c.code).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${batch.name}_codes.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
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
  };
};
