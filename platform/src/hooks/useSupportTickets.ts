import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useSupportTickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setTickets(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const updateTicketStatus = async (ticketId: string, status: string) => {
    const { error } = await supabase.from('support_tickets').update({ status }).eq('id', ticketId);
    if (!error) {
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status } : t));
    }
    return { error };
  };

  return { tickets, loading, updateTicketStatus, refetch: fetchTickets };
}

export function useSupportMessages(ticketId: string | undefined) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!ticketId) {
      setMessages([]);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('support_ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (data) setMessages(data);
    setLoading(false);
  }, [ticketId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const sendMessage = async (message: string, isFromAdmin: boolean) => {
    if (!ticketId) return { error: new Error('No ticket ID') };
    const { data, error } = await supabase.from('support_ticket_messages').insert([{
      ticket_id: ticketId,
      message,
      is_from_admin: isFromAdmin
    }]).select();

    if (!error && data) {
      setMessages(prev => [...prev, data[0]]);
    }
    return { error };
  };

  return { messages, loading, sendMessage, refetch: fetchMessages };
}
