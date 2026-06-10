import React, { useState, useEffect } from 'react';
import { useReactTicket } from '../../hooks/useReactTicket';
import { PromoBatch, PromoCode } from 'reactticket-core/types/promo.types';

export const PromoCodeManager: React.FC = () => {
  const { adapter, event, dispatch, ticketTypes } = useReactTicket();
  const [batches, setBatches] = useState<PromoBatch[]>([]);
  const [newBatch, setNewBatch] = useState({ 
    name: '', 
    count: 10, 
    discountType: 'percent' as 'percent' | 'free', 
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

    const codes: PromoCode[] = Array.from({ length: newBatch.count }, () => ({
      code: `${newBatch.name.toUpperCase().slice(0, 3)}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      discount,
      appliesTo: newBatch.discountType === 'free' && newBatch.ticketTypeId ? [newBatch.ticketTypeId] : undefined,
      usedCount: 0,
      maxUses: 1,
      createdAt: new Date(),
      active: true,
      batchId: `batch_${Date.now()}`
    }));

    const batch: PromoBatch = {
      id: `batch_${Date.now()}`,
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

  return (
    <section style={{ marginTop: '20px' }}>
      <h3>Promo Code Batches</h3>
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
      
      <label style={{ marginBottom: '10px', display: 'block' }}>
        <input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} />
        Show Archived
      </label>

      {batches.filter(b => showArchived || !b.archived).map(batch => (
        <div key={batch.id} style={{ marginBottom: '25px', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '12px', background: 'white', opacity: batch.archived ? 0.6 : 1 }}>
          <h4 
            onClick={() => toggleBatch(batch.id)} 
            style={{ margin: '0 0 15px 0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span style={{ textDecoration: batch.archived ? 'line-through' : 'none' }}>{batch.name}</span>
            <div onClick={(e) => e.stopPropagation()} style={{display: 'flex', gap: '10px'}}>
                <button style={{ padding: '2px 6px', fontSize: '10px' }} onClick={() => exportCSV(batch)}>
                    Export CSV
                </button>
                <button style={{ padding: '2px 6px', fontSize: '10px' }} onClick={() => toggleBatchActive(batch.id)}>
                    {batch.codes.every(c => !c.active) ? 'Reactivate' : 'Deprecate'}
                </button>
                <button style={{ padding: '2px 6px', fontSize: '10px' }} onClick={() => toggleBatchArchive(batch.id)}>
                    {batch.archived ? 'Unarchive' : 'Archive'}
                </button>
                <small style={{ color: '#64748b' }}>Expires: {new Date(batch.expiresAt).toLocaleDateString()} {expandedBatches.has(batch.id) ? '▼' : '▶'}</small>
            </div>
          </h4>
          
          {expandedBatches.has(batch.id) && (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0', fontSize: '12px', color: '#64748b' }}>
                  <th style={{ padding: '8px' }}>Code</th>
                  <th style={{ padding: '8px' }}>Status</th>
                  <th style={{ padding: '8px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {batch.codes.map(code => (
                  <tr key={code.code} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px', fontFamily: 'monospace', textDecoration: !code.active ? 'line-through' : 'none' }}>{code.code}</td>
                    <td style={{ padding: '8px' }}>
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: code.sentAt ? '#dcfce7' : '#fee2e2' }}>
                        {code.sentAt ? 'Sent' : 'Not Sent'}
                      </span>
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: code.usedCount > 0 ? '#dcfce7' : '#f1f5f9', marginLeft: '5px' }}>
                        {code.usedCount > 0 ? 'Used' : 'Unused'}
                      </span>
                      {!code.active && <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: '#e2e8f0', marginLeft: '5px' }}>Deprecated</span>}
                    </td>
                    <td style={{ padding: '8px' }}>
                      {!code.sentAt && <button style={{ padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }} onClick={() => markAsSent(batch.id, code.code)}>Mark Sent</button>}
                      <button style={{ padding: '4px 8px', fontSize: '11px', cursor: 'pointer', marginLeft: '5px' }} onClick={() => toggleCodeActive(batch.id, code.code)}>
                        {code.active ? 'Deprecate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </section>
  );
};
