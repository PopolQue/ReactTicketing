import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/Toast';

export default function ExportManager({ eventId, eventName }: { eventId: string, eventName?: string }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const exportToCSV = async () => {
    setLoading(true);
    try {
      const { data: tickets, error } = await supabase
        .from('tickets')
        .select(`
          id,
          buyer_email,
          status,
          price_paid_cents,
          issued_at,
          ticket_types ( name )
        `)
        .eq('event_id', eventId);

      if (error) throw error;
      if (!tickets || tickets.length === 0) {
        showToast("No tickets found to export.", "info");
        setLoading(false);
        return;
      }

      // Convert to CSV
      const headers = ['Ticket ID', 'Buyer Email', 'Ticket Tier', 'Status', 'Price Paid (€)', 'Issued At'];
      const rows = tickets.map((t: any) => [
        t.id,
        t.buyer_email,
        t.ticket_types?.name || 'Unknown',
        t.status.toUpperCase(),
        (t.price_paid_cents / 100).toFixed(2),
        new Date(t.issued_at).toLocaleString()
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${eventName?.replace(/[^a-zA-Z0-9]/g, '_') || 'event'}_attendees.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast("Attendee list exported successfully!", "success");
    } catch (err: any) {
      showToast("Failed to export: " + err.message, "error");
    }
    setLoading(false);
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <h2 style={{ margin: '0 0 16px 0', fontSize: '1.2rem' }}>Marketing & CRM</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>
        Export your attendee list to upload to Mailchimp, HubSpot, or any other CRM platform for post-event marketing.
      </p>
      <button 
        onClick={exportToCSV} 
        disabled={loading} 
        className="btn-primary" 
        style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        {loading ? 'Generating CSV...' : 'Download Attendee List (CSV)'}
      </button>
    </div>
  );
}
