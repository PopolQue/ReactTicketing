import React, { useState } from 'react';
import { FestivalTicketTier } from './types';
import './kuh-theme.css';

interface Props {
  onTierCreated?: (tier: FestivalTicketTier) => void;
}

export const FestivalTicketCreator: React.FC<Props> = ({ onTierCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceInEuros, setPriceInEuros] = useState(99);
  const [capacity, setCapacity] = useState(500);
  const [badgeLabel, setBadgeLabel] = useState('');
  const [campingIncluded, setCampingIncluded] = useState(true);
  const [vipAccess, setVipAccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTier: FestivalTicketTier = {
      id: `tier_custom_${Date.now()}`,
      name,
      description,
      pricing: {
        kind: 'paid',
        priceInCents: Math.round(priceInEuros * 100),
        currency: 'EUR',
      },
      capacity,
      transferable: true,
      visible: true,
      badgeLabel: badgeLabel || undefined,
      campingIncluded,
      vipAccess,
    };

    if (onTierCreated) {
      onTierCreated(newTier);
    }

    setName('');
    setDescription('');
    setBadgeLabel('');
  };

  return (
    <div
      style={{
        background: 'rgba(18, 26, 43, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '16px',
        padding: '28px',
        maxWidth: '540px',
        margin: '0 auto 32px auto',
        color: 'white',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
      }}
    >
      <h3 style={{ margin: '0 0 16px 0', fontSize: '1.4rem', color: 'var(--kuh-neon-pink)' }}>
        ⚡ Klein und Haarig — Ticket Category Creator
      </h3>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Category Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z.B. Sunset Pass, Camping Special"
            className="kuh-input"
          />
        </div>

        <div>
          <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Was beinhaltet diese Ticket-Kategorie?"
            className="kuh-input"
            rows={2}
          />
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Preis (€) *</label>
            <input
              type="number"
              min="0"
              required
              value={priceInEuros}
              onChange={(e) => setPriceInEuros(Number(e.target.value))}
              className="kuh-input"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Max. Kapazität *</label>
            <input
              type="number"
              min="1"
              required
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="kuh-input"
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Badge Label (optional)</label>
          <input
            type="text"
            value={badgeLabel}
            onChange={(e) => setBadgeLabel(e.target.value)}
            placeholder="z.B. Limited, Special, Hot"
            className="kuh-input"
          />
        </div>

        <div style={{ display: 'flex', gap: '20px', margin: '8px 0' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
            <input
              type="checkbox"
              checked={campingIncluded}
              onChange={(e) => setCampingIncluded(e.target.checked)}
            />
            Camping Inklusive
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
            <input
              type="checkbox"
              checked={vipAccess}
              onChange={(e) => setVipAccess(e.target.checked)}
            />
            VIP Zugang
          </label>
        </div>

        <button type="submit" className="kuh-btn-checkout" style={{ marginTop: '8px' }}>
          Neue Festival-Kategorie Hinzufügen
        </button>
      </form>
    </div>
  );
};
