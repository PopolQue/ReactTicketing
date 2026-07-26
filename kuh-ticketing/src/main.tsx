import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { KuhTicketingWidget } from './KuhTicketingWidget';
import { FestivalTicketCreator } from './FestivalTicketCreator';
import { FestivalTicketTier } from './types';

const App = () => {
  const [customTiers, setCustomTiers] = useState<FestivalTicketTier[]>([]);

  const handleTierCreated = (newTier: FestivalTicketTier) => {
    setCustomTiers((prev) => [...prev, newTier]);
  };

  return (
    <div style={{ minHeight: '100vh', padding: '40px 20px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto 40px auto', textAlign: 'center' }}>
        <span
          style={{
            background: 'rgba(255, 42, 133, 0.2)',
            color: '#ff2a85',
            padding: '6px 16px',
            borderRadius: '20px',
            fontSize: '0.85rem',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          KUH-TICKETING EMBEDDEMODE
        </span>
        <h1 style={{ color: 'white', fontSize: '2.8rem', margin: '16px 0 8px 0' }}>
          Klein und Haarig Webshop Demo
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.1rem', margin: 0 }}>
          Einbettbares Festival Ticket Module für den Klein und Haarig Onlineshop
        </p>
      </div>

      <FestivalTicketCreator onTierCreated={handleTierCreated} />

      <KuhTicketingWidget
        tiers={
          customTiers.length > 0
            ? [
                ...customTiers,
                {
                  id: 'tier_default_1',
                  name: 'Weekend Pass (Original)',
                  description: '3-Tage Festivalpass',
                  pricing: { kind: 'paid', priceInCents: 10900, currency: 'EUR' },
                  capacity: 500,
                  transferable: true,
                  visible: true,
                },
              ]
            : undefined
        }
        onCheckout={async (order) => {
          console.log('[Klein und Haarig Webshop] Order received:', order);
        }}
      />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
