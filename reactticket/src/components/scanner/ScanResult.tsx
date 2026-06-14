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
      textAlign: 'center'
    }}
    role="alert"
    aria-live="assertive"
    >
      <h2>{result.result.replace('_', ' ').toUpperCase()}</h2>
      {ticket && (
        <div>
          <p>Ticket ID: {ticket.id}</p>
          <p>Type: {ticketTypeName}</p>
          <p>Buyer: {typeof ticket.personalization?.name === 'string' ? ticket.personalization.name : 'Unknown'} {typeof ticket.personalization?.surname === 'string' ? ticket.personalization.surname : ''}</p>
        </div>
      )}
      <p>Scanned by: {result.scannedByAccountName}</p>
      <button onClick={onDismiss} style={{ marginTop: '20px' }}>Scan Next</button>
    </div>
  );
};
