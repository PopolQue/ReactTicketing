import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';

export default function SupportDesk() {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyMessage, setReplyMessage] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
    } else {
      setMessages([]);
    }
  }, [selectedTicket]);

  const fetchMessages = async (ticketId: string) => {
    const { data } = await supabase
      .from('support_ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    
    if (data) setMessages(data);
  };

  const fetchTickets = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setTickets(data);
    setLoading(false);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('support_tickets')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      showToast('Error updating status', 'error');
    } else {
      showToast('Status updated', 'success');
      fetchTickets();
      if (selectedTicket?.id === id) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('support_ticket_messages').insert([{
      ticket_id: selectedTicket.id,
      sender_id: user?.id,
      message: replyMessage
    }]);

    if (error) {
      showToast('Failed to send reply', 'error');
    } else {
      showToast('Reply sent', 'success');
      setReplyMessage('');
      fetchMessages(selectedTicket.id); // Refresh messages list
      
      if (selectedTicket.status === 'open') {
        updateStatus(selectedTicket.id, 'in_progress');
      }
    }
  };

  if (loading) return <div>Loading support desk...</div>;

  return (
    <div style={{ display: 'flex', gap: '24px', height: 'calc(100vh - 80px)' }}>
      {/* Ticket List */}
      <div className="glass-panel" style={{ width: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ padding: '24px', margin: 0, borderBottom: '1px solid var(--border)' }}>Support Tickets</h2>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {tickets.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>No tickets found.</div>
          ) : tickets.map(ticket => (
            <div 
              key={ticket.id} 
              onClick={() => setSelectedTicket(ticket)}
              style={{ 
                padding: '16px 24px', 
                borderBottom: '1px solid var(--border)', 
                cursor: 'pointer',
                backgroundColor: selectedTicket?.id === ticket.id ? 'rgba(255,255,255,0.05)' : 'transparent'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 'bold' }}>{ticket.email}</span>
                <span style={{ 
                  fontSize: '0.75rem', 
                  padding: '2px 8px', 
                  borderRadius: '12px',
                  backgroundColor: ticket.status === 'open' ? '#ef4444' : ticket.status === 'resolved' ? '#10b981' : '#f59e0b',
                  color: 'white'
                }}>
                  {ticket.status.toUpperCase()}
                </span>
              </div>
              <div style={{ fontWeight: 500, marginBottom: '4px' }}>{ticket.subject}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {ticket.message}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ticket Details */}
      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedTicket ? (
          <>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ margin: '0 0 8px 0' }}>{selectedTicket.subject}</h2>
                  <p style={{ margin: 0, color: 'var(--text-secondary)' }}>From: {selectedTicket.email} • {new Date(selectedTicket.created_at).toLocaleString()}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {selectedTicket.status !== 'resolved' && (
                    <button onClick={() => updateStatus(selectedTicket.id, 'resolved')} className="btn-primary" style={{ backgroundColor: '#10b981', padding: '8px 16px' }}>Mark Resolved</button>
                  )}
                  {selectedTicket.status === 'resolved' && (
                    <button onClick={() => updateStatus(selectedTicket.id, 'open')} className="btn-secondary" style={{ padding: '8px 16px' }}>Reopen</button>
                  )}
                </div>
              </div>
            </div>

            <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '12px' }}>User's Initial Message:</div>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{selectedTicket.message}</div>
              </div>

              {messages.map((msg, index) => {
                const isAdmin = msg.sender_id !== selectedTicket.user_id;
                return (
                  <div key={msg.id || index} style={{ 
                    backgroundColor: isAdmin ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)', 
                    padding: '20px', 
                    borderRadius: '12px', 
                    marginBottom: '16px',
                    marginLeft: isAdmin ? '40px' : '0',
                    marginRight: isAdmin ? '0' : '40px',
                    borderLeft: isAdmin ? '4px solid #10b981' : 'none'
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px', color: isAdmin ? '#10b981' : 'var(--text-primary)' }}>
                      {isAdmin ? 'Admin Reply' : 'User'} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'normal', marginLeft: '8px' }}>{new Date(msg.created_at).toLocaleString()}</span>
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{msg.message}</div>
                  </div>
                );
              })}
            </div>

            <div style={{ padding: '24px', borderTop: '1px solid var(--border)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
              <form onSubmit={handleReply} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <textarea 
                  value={replyMessage}
                  onChange={e => setReplyMessage(e.target.value)}
                  placeholder="Type your reply here to email the user..."
                  className="input-field"
                  rows={4}
                  required
                />
                <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-end' }}>Send Reply</button>
              </form>
            </div>
          </>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', margin: 'auto' }}>
            Select a ticket from the list to view details.
          </div>
        )}
      </div>
    </div>
  );
}
