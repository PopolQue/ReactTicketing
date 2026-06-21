# Quick Start

The quickest way to get started with ReactTicket is to deploy a simple storefront where customers can buy tickets.

## Installation

Currently, ReactTicket is a collection of React components and core logic that you drop straight into your own project rather than installing via NPM.

```bash
# Clone the repository
git clone https://github.com/PopolQue/ReactTicketing.git

# Copy the reactticket and reactticket-core directories into your project
cp -r ReactTicketing/reactticket ./src/
cp -r ReactTicketing/reactticket-core ./src/
```

_Tip: We highly recommend using the `examples/supabase-template` as a starting point if you want a production-ready backend!_

## Basic Setup

Here is a minimal example of a storefront running with a LocalStorage adapter for testing purposes:

```tsx
import React from 'react';
import { ReactTicket } from 'reactticket';
import { LocalStorageAdapter } from 'reactticket-core/adapters/LocalStorageAdapter';

const adapter = new LocalStorageAdapter();

const eventConfig = {
  id: 'evt_my_event_01',
  name: 'My Awesome Event',
  date: '2026-10-31T20:00:00Z',
  venue: 'Main Hall',
  ticketTypes: [
    { id: 'tt_gen', name: 'General Admission', price: 25, totalCapacity: 500, currency: 'USD' },
  ],
};

export function App() {
  return (
    <ReactTicket
      event={eventConfig}
      adapter={adapter}
      mode="storefront"
      onCheckout={async (order) => {
        // Integrate with Stripe/PayPal here
        return 'confirmed';
      }}
    />
  );
}
```

This will automatically render the ticket list, handle the cart state, and process the checkout callback!
