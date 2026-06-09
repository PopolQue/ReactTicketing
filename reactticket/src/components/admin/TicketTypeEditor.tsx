import React, { useState, useEffect } from 'react';
import { useReactTicket } from '../../hooks/useReactTicket';
import { TicketTypeConfig } from '../../types/ticket.types';

export const TicketTypeEditor: React.FC = () => {
  const { ticketTypes, adapter, event, dispatch } = useReactTicket();
  const [newType, setNewType] = useState({ name: '', price: 0, capacity: 100, visible: true });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<TicketTypeConfig>>({});
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    const loadTypes = async () => {
      const types = await adapter.getTicketTypes(event.id);
      dispatch({ type: 'SET_TICKET_TYPES', payload: types });
    };
    loadTypes();
  }, [adapter, event.id, dispatch]);

  const toggleArchive = async (type: TicketTypeConfig) => {
    const updatedType = { ...type, archived: !type.archived };
    await adapter.saveTicketType(event.id, updatedType);
    const updatedTypes = await adapter.getTicketTypes(event.id);
    dispatch({ type: 'SET_TICKET_TYPES', payload: updatedTypes });
  };

  const saveTicketType = async (type: TicketTypeConfig) => {
    const updatedType = { ...type, ...editValues };
    await adapter.saveTicketType(event.id, updatedType);
    const updatedTypes = await adapter.getTicketTypes(event.id);
    dispatch({ type: 'SET_TICKET_TYPES', payload: updatedTypes });
    setEditingId(null);
  };

  const addTicketType = async () => {
    if (!newType.name) return;
    const type: TicketTypeConfig = {
      id: `tt_${Date.now()}`,
      name: newType.name,
      pricing: { kind: 'paid', priceInCents: newType.price, currency: 'EUR' },
      capacity: newType.capacity,
      visible: newType.visible,
      transferable: true,
    };
    await adapter.saveTicketType(event.id, type);
    const updatedTypes = await adapter.getTicketTypes(event.id);
    dispatch({ type: 'SET_TICKET_TYPES', payload: updatedTypes });
    setNewType({ name: '', price: 0, capacity: 100, visible: true });
  };

  return (
    <section style={{ marginTop: '20px' }}>
      <h3>Ticket Types Configuration</h3>
      <label>
        <input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} />
        Show Archived
      </label>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
            <th style={{ padding: '10px' }}>Name</th>
            <th style={{ padding: '10px' }}>Price (Cents)</th>
            <th style={{ padding: '10px' }}>Capacity</th>
            <th style={{ padding: '10px' }}>Visible</th>
            <th style={{ padding: '10px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {ticketTypes.filter(t => showArchived || !t.archived).map((type) => (
            <tr key={type.id} style={{ borderBottom: '1px solid #e2e8f0', textDecoration: type.archived ? 'line-through' : 'none', opacity: type.archived ? 0.6 : 1 }}>
              <td style={{ padding: '10px' }}>
                {editingId === type.id ? <input value={editValues.name ?? type.name} onChange={e => setEditValues({ ...editValues, name: e.target.value })} /> : type.name}
              </td>
              <td style={{ padding: '10px' }}>
                {editingId === type.id ? <input type="number" value={(editValues.pricing as any)?.priceInCents ?? (type.pricing as any).priceInCents} onChange={e => setEditValues({ ...editValues, pricing: { kind: 'paid', priceInCents: parseInt(e.target.value), currency: 'EUR' } })} /> : (type.pricing as any).priceInCents}
              </td>
              <td style={{ padding: '10px' }}>
                {editingId === type.id ? <input type="number" value={editValues.capacity ?? type.capacity} onChange={e => setEditValues({ ...editValues, capacity: parseInt(e.target.value) })} /> : type.capacity}
              </td>
              <td style={{ padding: '10px' }}>
                {editingId === type.id ? (
                  <label><input type="checkbox" checked={editValues.visible ?? type.visible} onChange={e => setEditValues({ ...editValues, visible: e.target.checked })} /> Visible</label>
                ) : (
                  type.visible ? 'Visible' : 'Hidden'
                )}
              </td>
              <td style={{ padding: '10px' }}>
                {editingId === type.id ? (
                  <button onClick={() => saveTicketType(type)}>Save</button>
                ) : (
                  <>
                    <button onClick={() => { setEditingId(type.id); setEditValues({}); }}>Edit</button>
                    <button onClick={() => toggleArchive(type)} style={{ marginLeft: '5px' }}>{type.archived ? 'Unarchive' : 'Archive'}</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'flex', gap: '10px', background: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
        <input style={{ flex: 2 }} placeholder="Ticket Name" value={newType.name} onChange={e => setNewType({ ...newType, name: e.target.value })} />
        <input style={{ flex: 1 }} type="number" placeholder="Price" value={newType.price} onChange={e => setNewType({ ...newType, price: parseInt(e.target.value) })} />
        <input style={{ flex: 1 }} type="number" placeholder="Capacity" value={newType.capacity} onChange={e => setNewType({ ...newType, capacity: parseInt(e.target.value) })} />
        <label style={{display: 'flex', alignItems: 'center'}}>
            <input type="checkbox" checked={newType.visible} onChange={e => setNewType({ ...newType, visible: e.target.checked })} />
            Visible
        </label>
        <button style={{ flex: 1, backgroundColor: '#0f172a', color: 'white' }} onClick={addTicketType}>Add Row</button>
      </div>
    </section>
  );
};
