import React, { useState, useEffect } from 'react';
import jsQR from 'reactticket-core/utils/jsQR';
import { ReactTicket } from '@ReactTicket/index';
import { LocalStorageAdapter } from 'reactticket-core/adapters/LocalStorageAdapter';
import { TicketService } from 'reactticket-core/services/TicketService';
import { AuthService } from 'reactticket-core/services/AuthService';
import { ScanAccountService } from 'reactticket-core/services/ScanAccountService';
import './App.css';

const adapter = new LocalStorageAdapter();
(adapter as any).name = 'DemoLocalStorageAdapter'; // Bypass production validation for demo purposes
const eventConfig = {
  id: 'evt_test_001',
  name: 'Summer Rooftop Party',
  organizerName: 'Acme Events',
  startDate: new Date(),
  timezone: 'Europe/Berlin',
  ticketTypes: (() => {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return [
      {
        id: 'tt_gen',
        name: 'General Admission',
        pricing: { kind: 'paid', priceInCents: 1500, currency: 'EUR' },
        capacity: 100,
        visible: true,
        transferable: true,
        validFrom: now,
        validUntil: nextWeek,
      },
      {
        id: 'tt_vip',
        name: 'VIP Pass',
        pricing: { kind: 'paid', priceInCents: 5000, currency: 'EUR' },
        capacity: 20,
        visible: true,
        transferable: true,
        validFrom: now,
        validUntil: nextWeek,
      },
      {
        id: 'tt_early',
        name: 'Early Bird',
        pricing: { kind: 'paid', priceInCents: 1000, currency: 'EUR' },
        capacity: 50,
        visible: true,
        transferable: true,
        validFrom: now,
        validUntil: nextWeek,
      },
    ];
  })(),
  settings: {
    maxOrderSize: 10,
    requireBuyerEmail: true,
    // Hash for 'password' with salt 'salt' and 100000 iterations
    adminKey: 'pbkdf2-sha256$100000$c2FsdA==$A5Si7eMyyaE+uC6bJGMWBMMd+Xi04vD70sVJlE+deaU=',
    scanSessionSecret: 'dummy-secret-at-least-32-chars-long!!!!!!!!!!', // ponytail: replace before deploying
    qrSigningSecret: 'dummy-qr-secret-at-least-32-chars-long!!!!!!!!!!', // ponytail: replace before deploying
  },
};
if (typeof window !== 'undefined') {
  console.warn('[ADMIT] Using demo HMAC secrets — replace in production');
}

const authService = new AuthService(adapter, eventConfig.settings as any);
const ticketService = new TicketService(adapter, authService);

// ... (after authService/ticketService definitions)

export default function App() {
  const [activeTab, setActiveTab] = useState<'admin' | 'storefront' | 'scanner' | 'tickets'>(
    'storefront'
  );
  const [storage, setStorage] = useState<string>('');

  const seedData = async () => {
    const accountService = new ScanAccountService(adapter);
    let seeded = false;

    // Seed scanner account: crew / 1234
    const accounts = await adapter.listScanAccounts(eventConfig.id);
    if (!accounts.find((a) => a.username === 'crew')) {
      await accountService.createAccount(eventConfig.id, 'crew', '1234', 'Main Entrance');
      seeded = true;
    }

    // Seed ticket types from config
    const existingTypes = await adapter.getTicketTypes(eventConfig.id);
    if (existingTypes.length === 0) {
      for (const tt of eventConfig.ticketTypes) {
        await adapter.saveTicketType(eventConfig.id, tt as any);
      }
      seeded = true;
    }

    if (seeded) {
      alert(
        'Demo data successfully seeded!\n\nCredentials:\n- Admin Password: password\n- Scanner Username: crew\n- Scanner PIN: 1234'
      );
    } else {
      alert(
        'Demo data already seeded.\n\nCredentials:\n- Admin Password: password\n- Scanner Username: crew\n- Scanner PIN: 1234'
      );
    }

    inspectStorage();
    // Force a small reload so the Storefront picks up the new types immediately
    if (seeded) window.location.reload();
  };

  const inspectStorage = () => {
    const tfData: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('tf_')) {
        try {
          tfData[key] = JSON.parse(localStorage.getItem(key) || '');
        } catch {
          tfData[key] = localStorage.getItem(key);
        }
      }
    }
    setStorage(JSON.stringify(tfData, null, 2));
  };

  useEffect(inspectStorage, [activeTab]);

  return (
    <div className="demo-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>ReactTicket Demo</h1>
        <button
          onClick={seedData}
          style={{
            background: '#22c55e',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '4px',
          }}
        >
          Seed Demo Data
        </button>
      </div>

      <div className="tabs">
        {(['storefront', 'admin', 'scanner', 'tickets'] as const).map((tab) => (
          <div
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </div>
        ))}
      </div>

      <div className="content-area">
        <ReactTicket
          event={eventConfig as any}
          adapter={adapter}
          mode={activeTab}
          adminKey="password"
          qrParser={(data, width, height) => {
            const code = jsQR(data, width, height);
            return code ? { data: code.data } : null;
          }}
          onCheckout={async (order: any) => {
            // await ticketService.issueTickets(order.id); // Removed to prevent double issuance
            inspectStorage();
            return 'confirmed';
          }}
        />
      </div>

      <div className="inspector">
        <h3>Demo Credentials</h3>
        <p style={{ margin: '5px 0' }}>
          <strong>Admin Password:</strong> password
        </p>
        <p style={{ margin: '5px 0' }}>
          <strong>Scanner Account:</strong> crew / 1234
        </p>

        <h3 style={{ marginTop: '20px' }}>System State (tf_ prefix)</h3>
        <pre>{storage}</pre>
      </div>
    </div>
  );
}
