import React, { useEffect, useState } from 'react';
import { ScanEvent } from 'reactticket-core/types/scan.types';
import { useReactTicket } from '../../hooks/useReactTicket';
import { IssuedTicket } from 'reactticket-core/types/ticket.types';

interface ScanResultProps {
  result: ScanEvent;
  onDismiss: () => void;
}

export const ScanResult: React.FC<ScanResultProps> = ({ result, onDismiss }) => {
  const { adapter, event } = useReactTicket();
  const [ticket, setTicket] = useState<IssuedTicket | null>(null);
  const [ticketTypeName, setTicketTypeName] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
        if (result.ticketId !== 'unknown') {
          const t = await adapter.getTicket(result.ticketId);
          if (t) {
            setTicket(t);
            const types = await adapter.getTicketTypes(event.id);
            const type = types.find(tt => tt.id === t.ticketTypeId);
            setTicketTypeName(type ? type.name : 'Unknown');
          }
        }
    };
    loadData();

    // ... (keep audio/haptic feedback)
    if (navigator.vibrate) {
      if (result.result === 'admitted') {
        navigator.vibrate([100]);
      } else {
        navigator.vibrate([50, 50, 50]);
      }
    }
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.01);
      
      if (result.result === 'admitted') {
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
        oscillator.start();
        setTimeout(() => oscillator.stop(), 150);
      } else {
        oscillator.frequency.setValueAtTime(220, audioContext.currentTime); // A3
        oscillator.start();
        setTimeout(() => oscillator.stop(), 400);
      }
      
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + (result.result === 'admitted' ? 0.15 : 0.4));
      
    } catch(e) {
      console.warn("Audio feedback failed", e);
    }
  }, [result, adapter]);

  const getBackgroundColor = () => {
    switch (result.result) {
      case 'admitted': return '#22c55e'; // green-500
      case 'offline_queued': return '#3b82f6'; // blue-500
      case 'already_used': return '#f59e0b'; // amber-500
      case 'invalid':
      case 'cancelled':
      case 'expired':
        return '#ef4444'; // red-500
      case 'clock_skew_anomaly': return '#eab308'; // yellow-500
      default: return '#6b7280'; // gray-500
    }
  };

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: getBackgroundColor(),
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      textAlign: 'center',
      fontFamily: 'monospace' // Aesthetic for high-tech feel
    }}
    role="alert"
    aria-live="assertive"
    aria-label={`Scan Result: ${result.result.replace('_', ' ')}`}
    >
      <h2 style={{ fontSize: '3rem', margin: '0 0 10px 0', textShadow: '0 0 10px rgba(0,0,0,0.5)' }}>
        {result.result.replace('_', ' ').toUpperCase()}
      </h2>
      {ticket && (
        <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '10px', width: '100%' }}>
          <p style={{ margin: '5px 0' }}>Ticket ID: {ticket.id}</p>
          <p style={{ margin: '5px 0' }}>Type: {ticketTypeName}</p>
          <p style={{ margin: '5px 0' }}>Buyer: {typeof ticket.personalization?.name === 'string' ? ticket.personalization.name : 'Unknown'} {typeof ticket.personalization?.surname === 'string' ? ticket.personalization.surname : ''}</p>
        </div>
      )}
      <p style={{ marginTop: '15px' }}>Scanned by: {result.scannedByAccountName}</p>
      <button 
        onClick={onDismiss} 
        style={{ 
          marginTop: '30px', 
          padding: '15px 40px', 
          fontSize: '1.2rem',
          backgroundColor: '#000',
          color: '#39ff14', // Acid green
          border: '2px solid #39ff14',
          borderRadius: '50px',
          cursor: 'pointer',
          boxShadow: '0 0 15px rgba(57, 255, 20, 0.5)'
        }} 
        aria-label="Scan Next Ticket"
      >
        SCAN NEXT
      </button>
    </div>
  );
};
