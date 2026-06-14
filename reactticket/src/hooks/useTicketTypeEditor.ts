import { useState } from 'react';
import { useReactTicket } from './useReactTicket';
import { TicketTypeConfig } from 'reactticket-core/types/ticket.types';

export interface NewTicketTypeState {
  name: string;
  price: number;
  capacity: number;
  visible: boolean;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}

export const useTicketTypeEditor = () => {
  const { ticketTypes, adapter, event, dispatch } = useReactTicket();
  
  const [newType, setNewType] = useState<NewTicketTypeState>({ 
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

  return {
    ticketTypes,
    newType,
    setNewType,
    editingId,
    editValues,
    setEditValues,
    editTimes,
    setEditTimes,
    showArchived,
    setShowArchived,
    toggleArchive,
    startEdit,
    saveTicketType,
    addTicketType,
    formatDateTimeForTimezone
  };
};
