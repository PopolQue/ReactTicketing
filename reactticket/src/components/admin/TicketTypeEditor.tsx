import React, { useState, useEffect } from 'react';
import { useReactTicket } from '../../hooks/useReactTicket';
import { TicketTypeConfig } from 'reactticket-core/types/ticket.types';

export const TicketTypeEditor: React.FC = () => {
  const { ticketTypes, adapter, event, dispatch } = useReactTicket();
  const [newType, setNewType] = useState({ 
      name: '', price: 0, capacity: 100, visible: true, 
      startDate: '', startTime: '00:00', 
      endDate: '', endTime: '23:59' 
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<TicketTypeConfig>>({});
  const [editTimes, setEditTimes] = useState<{
    validFromDate: string; validFromTime: string;
    validUntilDate: string; validUntilTime: string;
  }>({ validFromDate: '', validFromTime: '', validUntilDate: '', validUntilTime: '' });
  const [showArchived, setShowArchived] = useState(false);

  const toggleArchive = async (type: TicketTypeConfig) => {
    const updatedType = { ...type, archived: !type.archived };
    await adapter.saveTicketType(event.id, updatedType);
    const updatedTypes = await adapter.getTicketTypes(event.id);
    dispatch({ type: 'SET_TICKET_TYPES', payload: updatedTypes });
  };

  const startEdit = (type: TicketTypeConfig) => {
    setEditingId(type.id);
    setEditValues(type);
    setEditTimes({
      validFromDate: type.validFrom instanceof Date ? type.validFrom.toISOString().slice(0, 10) : (type.validFrom ? new Date(type.validFrom).toISOString().slice(0, 10) : ''),
      validFromTime: type.validFrom instanceof Date ? type.validFrom.toISOString().slice(11, 16) : (type.validFrom ? new Date(type.validFrom).toISOString().slice(11, 16) : '00:00'),
      validUntilDate: type.validUntil instanceof Date ? type.validUntil.toISOString().slice(0, 10) : (type.validUntil ? new Date(type.validUntil).toISOString().slice(0, 10) : ''),
      validUntilTime: type.validUntil instanceof Date ? type.validUntil.toISOString().slice(11, 16) : (type.validUntil ? new Date(type.validUntil).toISOString().slice(11, 16) : '23:59'),
    });
  };

  const saveTicketType = async (type: TicketTypeConfig) => {
    const updatedType: TicketTypeConfig = {
      ...type, ...editValues,
      validFrom: editTimes.validFromDate ? new Date(`${editTimes.validFromDate}T${editTimes.validFromTime}`) : type.validFrom,
      validUntil: editTimes.validUntilDate ? new Date(`${editTimes.validUntilDate}T${editTimes.validUntilTime}`) : type.validUntil
    };
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
      validFrom: newType.startDate ? new Date(`${newType.startDate}T${newType.startTime}`) : undefined,
      validUntil: newType.endDate ? new Date(`${newType.endDate}T${newType.endTime}`) : undefined,
    };
    await adapter.saveTicketType(event.id, type);
    const updatedTypes = await adapter.getTicketTypes(event.id);
    dispatch({ type: 'SET_TICKET_TYPES', payload: updatedTypes });
    setNewType({ name: '', price: 0, capacity: 100, visible: true, startDate: '', startTime: '00:00', endDate: '', endTime: '23:59' });
  };

  const formatDateTimeForTimezone = (date?: Date | string) => {
    if (!date) return '-';
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '-';

    return new Intl.DateTimeFormat('en-GB', {
        timeZone: event.timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).format(d);
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
            <th style={{ padding: '10px' }}>Price</th>
            <th style={{ padding: '10px' }}>Valid From</th>
            <th style={{ padding: '10px' }}>Valid Until</th>
            <th style={{ padding: '10px' }}>Capacity</th>
            <th style={{ padding: '10px' }}>Visible</th>
            <th style={{ padding: '10px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {ticketTypes.filter(t => showArchived || !t.archived).map((type) => (
            <tr key={type.id} style={{ borderBottom: '1px solid #e2e8f0', textDecoration: type.archived ? 'line-through' : 'none', opacity: type.archived ? 0.6 : 1 }}>
              <td style={{ padding: '10px' }}>
                {editingId === type.id ? <input style={{ width: '100%' }} value={editValues.name ?? type.name} onChange={e => setEditValues({ ...editValues, name: e.target.value })} /> : type.name}
              </td>
              <td style={{ padding: '10px' }}>
                {editingId === type.id ? <input style={{ width: '100%' }} type="number" value={(editValues.pricing as any)?.priceInCents ?? (type.pricing as any).priceInCents} onChange={e => setEditValues({ ...editValues, pricing: { kind: 'paid', priceInCents: parseInt(e.target.value) || 0, currency: 'EUR' } })} /> : (type.pricing as any).priceInCents}
              </td>
              <td style={{ padding: '10px' }}>
                {editingId === type.id ? (
                  <>
                    <input type="date" value={editTimes.validFromDate} onChange={e => setEditTimes({...editTimes, validFromDate: e.target.value})} />
                    <input type="time" value={editTimes.validFromTime} onChange={e => setEditTimes({...editTimes, validFromTime: e.target.value})} />
                  </>
                ) : formatDateTimeForTimezone(type.validFrom)}
              </td>
              <td style={{ padding: '10px' }}>
                {editingId === type.id ? (
                  <>
                    <input type="date" value={editTimes.validUntilDate} onChange={e => setEditTimes({...editTimes, validUntilDate: e.target.value})} />
                    <input type="time" value={editTimes.validUntilTime} onChange={e => setEditTimes({...editTimes, validUntilTime: e.target.value})} />
                  </>
                ) : formatDateTimeForTimezone(type.validUntil)}
              </td>
              <td style={{ padding: '10px' }}>
                {editingId === type.id ? <input style={{ width: '100%' }} type="number" value={editValues.capacity ?? type.capacity} onChange={e => setEditValues({ ...editValues, capacity: parseInt(e.target.value) })} /> : type.capacity}
              </td>
              <td style={{ padding: '10px' }}>
                {editingId === type.id ? <input type="checkbox" checked={editValues.visible ?? type.visible} onChange={e => setEditValues({ ...editValues, visible: e.target.checked })} /> : (type.visible ? 'Visible' : 'Hidden')}
              </td>
              <td style={{ padding: '10px' }}>
                {editingId === type.id ? (
                  <button onClick={() => saveTicketType(type)}>Save</button>
                ) : (
                  <>
                    <button onClick={() => startEdit(type)}>Edit</button>
                    <button onClick={() => toggleArchive(type)} style={{ marginLeft: '5px' }}>{type.archived ? 'Unarchive' : 'Archive'}</button>
                  </>
                )}
              </td>
            </tr>
          ))}
          
          <tr style={{ background: '#f8fafc' }}>
            <td style={{ padding: '10px' }}><input style={{ width: '100%' }} placeholder="Name" value={newType.name || ''} onChange={e => setNewType({ ...newType, name: e.target.value })} /></td>
            <td style={{ padding: '10px' }}><input style={{ width: '100%' }} type="number" placeholder="Price" value={newType.price || ''} onChange={e => setNewType({ ...newType, price: parseInt(e.target.value) || 0 })} /></td>
            <td style={{ padding: '10px' }}>
                <input type="date" value={newType.startDate || ''} onChange={e => setNewType({...newType, startDate: e.target.value})} />
                <input type="time" value={newType.startTime || ''} onChange={e => setNewType({...newType, startTime: e.target.value})} />
            </td>
            <td style={{ padding: '10px' }}>
                <input type="date" value={newType.endDate || ''} onChange={e => setNewType({...newType, endDate: e.target.value})} />
                <input type="time" value={newType.endTime || ''} onChange={e => setNewType({...newType, endTime: e.target.value})} />
            </td>
            <td style={{ padding: '10px' }}><input style={{ width: '100%' }} type="number" placeholder="Cap" value={newType.capacity || ''} onChange={e => setNewType({ ...newType, capacity: parseInt(e.target.value) || 0 })} /></td>
            <td style={{ padding: '10px' }}>
              <input type="checkbox" checked={newType.visible} onChange={e => setNewType({ ...newType, visible: e.target.checked })} />
            </td>
            <td style={{ padding: '10px' }}>
              <button style={{ backgroundColor: '#0f172a', color: 'white', padding: '5px 10px' }} onClick={addTicketType}>Add</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  );
};
