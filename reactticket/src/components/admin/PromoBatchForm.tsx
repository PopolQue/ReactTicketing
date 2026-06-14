import React from 'react';
import { NewBatchState } from '../../hooks/usePromoBatches';
import { TicketTypeConfig } from 'reactticket-core/types/ticket.types';

export interface PromoBatchFormProps {
  newBatch: NewBatchState;
  setNewBatch: React.Dispatch<React.SetStateAction<NewBatchState>>;
  generateBatch: () => void;
  ticketTypes: TicketTypeConfig[];
}

export const PromoBatchForm: React.FC<PromoBatchFormProps> = ({
  newBatch,
  setNewBatch,
  generateBatch,
  ticketTypes
}) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', background: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '25px', border: '1px solid #e2e8f0' }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '12px', fontWeight: 600 }}>Batch Name
        <input placeholder="Summer Sale" value={newBatch.name} onChange={e => setNewBatch({...newBatch, name: e.target.value})} />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '12px', fontWeight: 600 }}>Count
        <input type="number" value={newBatch.count} onChange={e => setNewBatch({...newBatch, count: parseInt(e.target.value)})} />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '12px', fontWeight: 600 }}>Discount Type
          <select value={newBatch.discountType} onChange={e => setNewBatch({...newBatch, discountType: e.target.value as 'percent' | 'free'})}>
              <option value="percent">Percentage</option>
              <option value="free">Free Ticket</option>
          </select>
      </label>
      {newBatch.discountType === 'percent' && (
          <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '12px', fontWeight: 600 }}>Discount %
            <input type="number" value={newBatch.discountValue} onChange={e => setNewBatch({...newBatch, discountValue: parseInt(e.target.value)})} />
          </label>
      )}
      {newBatch.discountType === 'free' && (
          <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '12px', fontWeight: 600 }}>Applies To
            <select value={newBatch.ticketTypeId} onChange={e => setNewBatch({...newBatch, ticketTypeId: e.target.value})}>
              <option value="">Select Ticket Type</option>
              {ticketTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
      )}
      <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '12px', fontWeight: 600 }}>Expires
        <input type="date" value={newBatch.expiresAt} onChange={e => setNewBatch({...newBatch, expiresAt: e.target.value})} />
      </label>
      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
        <button style={{ backgroundColor: '#0f172a', color: 'white', padding: '10px', cursor: 'pointer', width: '100%' }} onClick={generateBatch}>Generate Batch</button>
      </div>
    </div>
  );
};
