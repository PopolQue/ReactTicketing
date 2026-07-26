import React, { useState } from 'react';
import { TicketTypeConfig } from 'reactticket-core/types/ticket.types';
import { WaitlistService } from 'reactticket-core/services/WaitlistService';
import { useReactTicket } from '../../hooks/useReactTicket';
import { useI18n } from '../../context/I18nContext';

interface Props {
  type: TicketTypeConfig;
  onClose: () => void;
}

export const WaitlistModal: React.FC<Props> = ({ type, onClose }) => {
  const { adapter, event } = useReactTicket();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const waitlistService = new WaitlistService(adapter);
      await waitlistService.joinWaitlist(event.id, type.id, email, name, quantity);
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to join waitlist');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '420px',
          width: '90%',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        }}
      >
        <h3 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>
          Join Waitlist — {type.name}
        </h3>
        <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '16px' }}>
          This ticket tier is currently sold out. Leave your details to get notified if tickets become available.
        </p>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#16a34a', marginBottom: '8px' }}>
              You're on the waitlist!
            </div>
            <p style={{ fontSize: '0.9rem', color: '#475569' }}>
              We'll send an email to <strong>{email}</strong> as soon as a spot opens up.
            </p>
            <button
              onClick={onClose}
              style={{
                marginTop: '16px',
                padding: '10px 20px',
                background: '#0284c7',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {error && (
              <div style={{ color: '#dc2626', fontSize: '0.85rem', background: '#fef2f2', padding: '8px', borderRadius: '6px' }}>
                {error}
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Desired Quantity
              </label>
              <select
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  boxSizing: 'border-box',
                }}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} ticket{n > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '8px 16px',
                  background: 'none',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '8px 16px',
                  background: '#0284c7',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Join Waitlist
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
