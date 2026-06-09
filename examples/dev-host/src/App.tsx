import React, { useState, useEffect } from 'react';
import jsQR from 'jsqr';
import { ReactTicket, LocalStorageAdapter } from '@ReactTicket/index';
import { TicketService } from '@ReactTicket/services/TicketService';
import { AuthService } from '@ReactTicket/services/AuthService';
import './App.css';

const adapter = new LocalStorageAdapter();
const authService = new AuthService(adapter, "dummy-secret-at-least-32-chars-long!!!!!!!!!!");
const ticketService = new TicketService(adapter, authService);

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
    adminKey: "password",
    scanSessionSecret: "dummy-secret-at-least-32-chars-long!!!!!!!!!!",
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'admin' | 'storefront' | 'scanner' | 'tickets'>('storefront');
  const [storage, setStorage] = useState<string>('');

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
      <h1>ReactTicket Demo</h1>

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
          qrParser={(imageData) => {
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            return code ? code.data : null;
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
