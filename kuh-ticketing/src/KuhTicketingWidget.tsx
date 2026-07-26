import React, { useState } from 'react';
import { KuhFestivalConfig, FestivalTicketTier, KuhOrderPayload } from './types';
import './kuh-theme.css';

interface Props {
  config?: Partial<KuhFestivalConfig>;
  tiers?: FestivalTicketTier[];
  onCheckout?: (order: KuhOrderPayload) => Promise<boolean | void>;
}

const DEFAULT_CONFIG: KuhFestivalConfig = {
  festivalName: 'Klein und Haarig Festival',
  tagline: 'Die wilde Indie, Electronic & Camping Experience im Grünen',
  startDate: '14. - 16. August 2026',
  endDate: '16. August 2026',
  location: 'Wiesenland Open Air, Brandenburg',
  bannerImageUrl: '/kuh_festival_banner.jpg',
};

const DEFAULT_TIERS: FestivalTicketTier[] = [
  {
    id: 'tier_early_haarig',
    name: 'Early Haarig Weekend Pass',
    description: '3-Tage Festivalzugang inkl. Regular Camping & Duschen',
    pricing: { kind: 'paid', priceInCents: 8900, currency: 'EUR' },
    capacity: 250,
    transferable: true,
    visible: true,
    badgeLabel: 'Early Bird',
    campingIncluded: true,
  },
  {
    id: 'tier_full_haarig',
    name: 'Full Festival Pass + Camping',
    description: '3 Tage Open Air, Warm-Up Party & Silent Disco Access',
    pricing: { kind: 'paid', priceInCents: 11900, currency: 'EUR' },
    capacity: 1000,
    transferable: true,
    visible: true,
    badgeLabel: 'Beliebt',
    campingIncluded: true,
  },
  {
    id: 'tier_vip_wiese',
    name: 'VIP Wiese Pass',
    description: 'VIP Camping, Backstage Bar, Fast-Lane Einlass & Festival Hoodie',
    pricing: { kind: 'paid', priceInCents: 19900, currency: 'EUR' },
    capacity: 100,
    transferable: true,
    visible: true,
    badgeLabel: 'VIP',
    vipAccess: true,
    campingIncluded: true,
  },
  {
    id: 'tier_wohni_pass',
    name: 'Wohnmobil & Car-Pass',
    description: 'Zufahrt für 1 Wohnmobil / Campervan auf den Campingplatz',
    pricing: { kind: 'paid', priceInCents: 4500, currency: 'EUR' },
    capacity: 150,
    transferable: true,
    visible: true,
  },
];

export const KuhTicketingWidget: React.FC<Props> = ({
  config = {},
  tiers = DEFAULT_TIERS,
  onCheckout,
}) => {
  const festivalConfig = { ...DEFAULT_CONFIG, ...config };
  const [cart, setCart] = useState<Record<string, number>>({});
  const [showCheckout, setShowCheckout] = useState(false);
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [successOrder, setSuccessOrder] = useState<KuhOrderPayload | null>(null);

  const updateQuantity = (tierId: string, delta: number) => {
    setCart((prev) => {
      const current = prev[tierId] || 0;
      const updated = Math.max(0, current + delta);
      if (updated === 0) {
        const { [tierId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [tierId]: updated };
    });
  };

  const cartItems = tiers
    .filter((tier) => (cart[tier.id] || 0) > 0)
    .map((tier) => ({
      tier,
      quantity: cart[tier.id],
      subtotalCents:
        tier.pricing.kind === 'paid' ? tier.pricing.priceInCents * cart[tier.id] : 0,
    }));

  const totalCents = cartItems.reduce((acc, item) => acc + item.subtotalCents, 0);
  const totalQuantity = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload: KuhOrderPayload = {
      festivalName: festivalConfig.festivalName,
      items: cartItems.map((ci) => ({
        ticketTypeId: ci.tier.id,
        ticketName: ci.tier.name,
        quantity: ci.quantity,
        priceInCents: ci.tier.pricing.kind === 'paid' ? ci.tier.pricing.priceInCents : 0,
      })),
      buyerEmail,
      buyerName,
      totalInCents: totalCents,
    };

    if (onCheckout) {
      await onCheckout(payload);
    }

    setLoading(false);
    setSuccessOrder(payload);
    setShowCheckout(false);
    setCart({});
  };

  return (
    <div className="kuh-widget-root">
      {festivalConfig.bannerImageUrl && (
        <img
          src={festivalConfig.bannerImageUrl}
          alt={`${festivalConfig.festivalName} Banner`}
          className="kuh-banner"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      )}

      <div className="kuh-header">
        <h1 className="kuh-title">{festivalConfig.festivalName}</h1>
        <p className="kuh-tagline">{festivalConfig.tagline}</p>

        <div className="kuh-meta-bar">
          <div className="kuh-meta-item">
            📅 {festivalConfig.startDate}
          </div>
          <div className="kuh-meta-item">
            📍 {festivalConfig.location}
          </div>
        </div>
      </div>

      {successOrder && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid #10b981',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
            textAlign: 'center',
          }}
        >
          <h3 style={{ margin: '0 0 8px 0', color: '#10b981' }}>
            🎉 Ticket-Bestellung erfolgreich!
          </h3>
          <p style={{ margin: 0, color: '#e2e8f0' }}>
            Deine Tickets für <strong>{successOrder.festivalName}</strong> wurden an{' '}
            <strong>{successOrder.buyerEmail}</strong> gesendet.
          </p>
        </div>
      )}

      <div className="kuh-grid">
        {tiers.map((tier) => {
          const qty = cart[tier.id] || 0;
          const priceStr =
            tier.pricing.kind === 'paid'
              ? `${(tier.pricing.priceInCents / 100).toFixed(2)} €`
              : 'Kostenlos';

          return (
            <div key={tier.id} className="kuh-tier-card">
              {tier.badgeLabel && <span className="kuh-badge">{tier.badgeLabel}</span>}
              <div>
                <h3 className="kuh-tier-name">{tier.name}</h3>
                <p className="kuh-tier-desc">{tier.description}</p>
              </div>
              <div>
                <div className="kuh-tier-price">{priceStr}</div>
                <div className="kuh-qty-controls">
                  <button
                    className="kuh-btn-qty"
                    disabled={qty === 0}
                    onClick={() => updateQuantity(tier.id, -1)}
                  >
                    -
                  </button>
                  <span className="kuh-qty-val">{qty}</span>
                  <button
                    className="kuh-btn-qty"
                    onClick={() => updateQuantity(tier.id, 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        className="kuh-btn-checkout"
        disabled={totalQuantity === 0}
        onClick={() => setShowCheckout(true)}
      >
        {totalQuantity > 0
          ? `${totalQuantity} Ticket${totalQuantity > 1 ? 's' : ''} Bestellen — ${(totalCents / 100).toFixed(2)} €`
          : 'Tickets Auswählen'}
      </button>

      {showCheckout && (
        <div className="kuh-modal-overlay">
          <div className="kuh-modal-content">
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.5rem' }}>
              Festival Ticket Checkout
            </h3>

            <div style={{ marginBottom: '20px', fontSize: '0.9rem', color: '#94a3b8' }}>
              {cartItems.map((ci) => (
                <div
                  key={ci.tier.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                  }}
                >
                  <span>
                    {ci.quantity}x {ci.tier.name}
                  </span>
                  <span style={{ fontWeight: 'bold', color: 'white' }}>
                    {(ci.subtotalCents / 100).toFixed(2)} €
                  </span>
                </div>
              ))}
              <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '12px 0' }} />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  color: '#10b981',
                }}
              >
                <span>Gesamtsumme:</span>
                <span>{(totalCents / 100).toFixed(2)} €</span>
              </div>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Vollständiger Name *</label>
                <input
                  type="text"
                  required
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Max Mustermann"
                  className="kuh-input"
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>E-Mail-Adresse für Ticketversand *</label>
                <input
                  type="email"
                  required
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  placeholder="max@example.com"
                  className="kuh-input"
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowCheckout(false)}
                  style={{
                    padding: '12px 20px',
                    background: 'none',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white',
                    borderRadius: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="kuh-btn-checkout"
                  style={{ width: 'auto', padding: '12px 24px' }}
                >
                  {loading ? 'Wird verarbeitet...' : 'Jetzt Verbindlich Kaufen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
