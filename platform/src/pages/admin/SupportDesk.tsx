import React, { useState } from 'react';
import { useSupportTickets, useSupportMessages } from '../../hooks/useSupportTickets';
import TicketSidebar from '../../features/support/TicketSidebar';
import TicketThreadView from '../../features/support/TicketThreadView';

export default function SupportDesk() {
  const { tickets, loading: ticketsLoading, updateTicketStatus, refetch: fetchTickets } = useSupportTickets();
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  
  const { messages, refetch: fetchMessages } = useSupportMessages(selectedTicket?.id);

  const handleUpdateStatus = async (id: string, status: string) => {
    const { error } = await updateTicketStatus(id, status);
    if (!error && selectedTicket?.id === id) {
      setSelectedTicket({ ...selectedTicket, status });
    }
  };

  if (ticketsLoading) return <div>Loading support desk...</div>;

  return (
    <div style={{ display: 'flex', gap: '24px', height: 'calc(100vh - 80px)' }}>
      <TicketSidebar 
        tickets={tickets} 
        selectedTicket={selectedTicket} 
        setSelectedTicket={setSelectedTicket} 
      />
      
      <TicketThreadView 
        selectedTicket={selectedTicket} 
        messages={messages} 
        updateStatus={handleUpdateStatus} 
        refreshMessages={fetchMessages} 
      />
    </div>
  );
}
