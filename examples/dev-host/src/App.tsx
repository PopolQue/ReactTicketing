import React, { useState, useEffect } from 'react';
import jsQR from 'jsqr';
import { ReactTicket, LocalStorageAdapter } from '@ReactTicket/index';
import { TicketService } from '@ReactTicket/services/TicketService';
import { AuthService } from '@ReactTicket/services/AuthService';
import { ScanAccountService } from '@ReactTicket/services/ScanAccountService';
import './App.css';

const adapter = new LocalStorageAdapter();

const eventConfig = {
  id: "evt_test_001",
  name: "Summer Rooftop Party",
  organizerName: "Acme Events",
  startDate: new Date(),
  timezone: "Europe/Berlin",
  ticketTypes: [
    { id: "tt_gen", name: "General Admission", pricing: { kind: "paid", priceInCents: 1500, currency: "EUR" }, capacity: 100, visible: true, transferable: true }
  ],
  settings: {
    maxOrderSize: 10,
    requireBuyerEmail: true,
    // Hash for 'password' with salt 'salt' and 100000 iterations
    adminKey: "pbkdf2-sha256$100000$c2FsdA==$7Z7qO9mP9Y3H+fK9+3Z7qO9mP9Y3H+fK9+3Z7qO9mP8=", 
    scanSessionSecret: "dummy-secret-at-least-32-chars-long!!!!!!!!!!",
  }
};

const authService = new AuthService(adapter, eventConfig.settings as any);
const ticketService = new TicketService(adapter, authService);

// ... (after authService/ticketService definitions)

export default function App() {
  const [activeTab, setActiveTab] = useState<'admin' | 'storefront' | 'scanner' | 'tickets'>('storefront');
  const [storage, setStorage] = useState<string>('');

  const seedData = async () => {
    const accountService = new ScanAccountService(adapter);
    // Seed scanner account: crew / 1234
    const accounts = await adapter.listScanAccounts(eventConfig.id);
    if (!accounts.find(a => a.username === 'crew')) {
        await accountService.createAccount(eventConfig.id, 'crew', '1234', 'Main Entrance');
        alert("Seeded scanner account: crew / 1234");
    } else {
        alert("Demo data already seeded.");
    }
    inspectStorage();
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
          <button onClick={seedData} style={{ background: '#22c55e', color: 'white', padding: '5px 10px', borderRadius: '4px' }}>Seed Demo Data</button>
      </div>

      <div className="tabs">
        {(['storefront', 'admin', 'scanner', 'tickets'] as const).map(tab => (
          <div key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
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
            await ticketService.issueTickets(order.id);
            inspectStorage();
            return "confirmed";
          }}
        />
      </div>

      <div className="inspector">
        <h3>System State (tf_ prefix)</h3>
        <pre>{storage}</pre>
      </div>
    </div>
  );
}
