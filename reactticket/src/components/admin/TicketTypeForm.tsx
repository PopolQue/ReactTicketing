import React from 'react';
import { NewTicketTypeState } from '../../hooks/useTicketTypeEditor';
import { PricingInput } from './PricingInput';

export interface TicketTypeFormProps {
  newType: NewTicketTypeState;
  setNewType: React.Dispatch<React.SetStateAction<NewTicketTypeState>>;
  addTicketType: () => void;
}

export const TicketTypeForm: React.FC<TicketTypeFormProps> = ({
  newType,
  setNewType,
  addTicketType
}) => {
  return (
    <tr style={{ background: '#f8fafc' }}>
      <td style={{ padding: '10px' }}><input style={{ width: '100%' }} placeholder="Name" value={newType.name || ''} onChange={e => setNewType({ ...newType, name: e.target.value })} aria-label="New ticket type name" /></td>
      <td style={{ padding: '10px' }}>
        <PricingInput 
          valueCents={newType.price || 0}
          onChangeCents={(cents) => setNewType({ ...newType, price: cents })}
          currency={newType.currency || 'USD'}
          onCurrencyChange={(curr) => setNewType({ ...newType, currency: curr })}
        />
      </td>
      <td style={{ padding: '10px' }}>
          <div style={{ display: 'flex', gap: '5px', flexDirection: 'column' }}>
            <input type="date" value={newType.startDate || ''} onChange={e => setNewType({...newType, startDate: e.target.value})} aria-label="New ticket type valid from date" />
            <input type="time" value={newType.startTime || ''} onChange={e => setNewType({...newType, startTime: e.target.value})} aria-label="New ticket type valid from time" />
          </div>
      </td>
      <td style={{ padding: '10px' }}>
          <div style={{ display: 'flex', gap: '5px', flexDirection: 'column' }}>
            <input type="date" value={newType.endDate || ''} onChange={e => setNewType({...newType, endDate: e.target.value})} aria-label="New ticket type valid until date" />
            <input type="time" value={newType.endTime || ''} onChange={e => setNewType({...newType, endTime: e.target.value})} aria-label="New ticket type valid until time" />
          </div>
      </td>
      <td style={{ padding: '10px' }}><input style={{ width: '100%' }} type="number" placeholder="Cap" value={newType.capacity || ''} onChange={e => setNewType({ ...newType, capacity: parseInt(e.target.value) || 0 })} aria-label="New ticket type capacity" /></td>
      <td style={{ padding: '10px' }}>
        <input type="checkbox" checked={newType.visible} onChange={e => setNewType({ ...newType, visible: e.target.checked })} aria-label="New ticket type visible" />
      </td>
      <td style={{ padding: '10px' }}>
        <button type="button" style={{ backgroundColor: '#0f172a', color: 'white', padding: '5px 10px', whiteSpace: 'nowrap' }} onClick={addTicketType} aria-label="Add new ticket type">Add</button>
      </td>
    </tr>
  );
};
