import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export default function ScanTickets() {
  const [ticketId, setTicketId] = useState('');
  const [scanResult, setScanResult] = useState<{ status: string, message: string, ticket?: any } | null>(null);
  const [scanning, setScanning] = useState(false);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setScanning(true);
    setScanResult(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setScanResult({ status: 'error', message: 'You must be logged in to scan tickets.' });
      setScanning(false);
      return;
    }

    // 1. Find the ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*, ticket_types(name), events(name, organizer_id)')
      .eq('id', ticketId.trim())
      .single();

    if (ticketError || !ticket) {
      setScanResult({ status: 'invalid', message: 'Ticket not found or invalid ID format.' });
      setScanning(false);
      return;
    }

    // 2. Verify Organizer owns the event
    if (ticket.events.organizer_id !== user.id) {
      setScanResult({ status: 'invalid', message: 'This ticket is for an event you do not manage.' });
      setScanning(false);
      return;
    }

    // 3. Check if already scanned
    const { data: pastScans } = await supabase
      .from('scan_events')
      .select('*')
      .eq('ticket_id', ticket.id);

    if (pastScans && pastScans.length > 0) {
      setScanResult({ 
        status: 'duplicate', 
        message: `ALREADY SCANNED. Scanned at: ${new Date(pastScans[0].scanned_at).toLocaleString()}`,
        ticket 
      });
      setScanning(false);
      return;
    }

    // 4. Record successful scan
    const { error: scanError } = await supabase.from('scan_events').insert([{
      id: crypto.randomUUID(),
      ticket_id: ticket.id,
      scanned_by_account_id: user.id,
      scanned_by_account_name: 'Organizer Dashboard',
      result: 'valid'
    }]);

    if (scanError) {
      setScanResult({ status: 'error', message: 'Failed to record scan: ' + scanError.message });
    } else {
      setScanResult({ status: 'valid', message: 'VALID TICKET. Entrance Granted.', ticket });
      setTicketId(''); // Reset for next scan
    }
    
    setScanning(false);
  };

  return (
    <div className="scan-tickets-page" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '24px', margin: 0 }}>Ticket Scanner</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
        Enter a Ticket ID to validate entry. In a mobile app, this would use the device camera to read the QR payload.
      </p>

      <div className="glass-panel" style={{ padding: '32px', marginBottom: '32px' }}>
        <form onSubmit={handleScan} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input 
            type="text" 
            placeholder="Paste Ticket ID here..." 
            className="input-field" 
            value={ticketId} 
            onChange={e => setTicketId(e.target.value)}
            style={{ fontSize: '1.2rem', padding: '16px', textAlign: 'center', fontFamily: 'monospace' }}
            required
          />
          <button type="submit" disabled={scanning} className="btn-primary" style={{ padding: '16px', fontSize: '1.1rem' }}>
            {scanning ? 'Scanning...' : 'Verify Ticket'}
          </button>
        </form>
      </div>

      {scanResult && (
        <div 
          className="glass-panel" 
          style={{ 
            padding: '32px', 
            textAlign: 'center',
            border: scanResult.status === 'valid' ? '2px solid #10b981' : 
                    scanResult.status === 'duplicate' ? '2px solid #f59e0b' : '2px solid #ef4444' 
          }}
        >
          <div style={{ 
            fontSize: '4rem', 
            marginBottom: '16px',
            color: scanResult.status === 'valid' ? '#10b981' : 
                   scanResult.status === 'duplicate' ? '#f59e0b' : '#ef4444' 
          }}>
            {scanResult.status === 'valid' ? <CheckCircle2 size={64} /> : scanResult.status === 'duplicate' ? <AlertTriangle size={64} /> : <XCircle size={64} />}
          </div>
          
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.5rem' }}>{scanResult.message}</h3>
          
          {scanResult.ticket && (
            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border)', textAlign: 'left' }}>
              <p style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)' }}>Event: <strong style={{ color: 'white' }}>{scanResult.ticket.events?.name}</strong></p>
              <p style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)' }}>Tier: <strong style={{ color: 'white' }}>{scanResult.ticket.ticket_types?.name}</strong></p>
              <p style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)' }}>Buyer: <strong style={{ color: 'white' }}>{scanResult.ticket.buyer_email}</strong></p>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Status: <strong style={{ color: 'white' }}>{scanResult.ticket.status.toUpperCase()}</strong></p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
