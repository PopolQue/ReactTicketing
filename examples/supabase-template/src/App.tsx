import React, { useState } from 'react';
import { ReactTicket } from '@ReactTicket/index';
import { SupabaseAdapter } from 'reactticket-core/adapters/SupabaseAdapter';
import { TicketService } from 'reactticket-core/services/TicketService';
import { AuthService } from 'reactticket-core/services/AuthService';
import './App.css';

// 1. Initialize Supabase Adapter
// These values come from your .env file
const adapter = new SupabaseAdapter(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

// 2. Define your Event Configuration
const eventConfig = {
  id: 'your_event_id', // Replace with your actual event ID from Supabase
  name: 'Your Event Name',
  organizerName: 'Your Organizer Name',
  startDate: new Date(),
  timezone: 'Europe/Berlin',
  ticketTypes: [], // Will be fetched from Supabase
  settings: {
    maxOrderSize: 10,
    requireBuyerEmail: true,
    adminKey: 'your_admin_key_hash', // Generated hash
    scanSessionSecret: 'your_32_char_secret', // ponytail: replace before deploying
    qrSigningSecret: 'your_32_char_qr_secret', // ponytail: replace before deploying
  },
};

const authService = new AuthService(adapter, eventConfig.settings as any);
const ticketService = new TicketService(adapter, authService);

export default function App() {
  const [activeTab, setActiveTab] = useState<'admin' | 'storefront' | 'scanner'>('storefront');

  return (
    <div className="demo-container">
      <h1>ReactTicket Supabase Template</h1>
      <div className="content-area">
        <ReactTicket
          event={eventConfig as any}
          adapter={adapter}
          mode={activeTab}
          onCheckout={async (order: any) => {
            // Tickets are issued automatically by TicketService when linked to Supabase
            await ticketService.issueTickets(order.id);
            return 'confirmed';
          }}
        />
      </div>
    </div>
  );
}
