# Dedicated Scanner Setup

If you are equipping your event crew with mobile devices to scan QR codes at the gate, you will want to deploy a dedicated scanner route.

## Setup

By setting `mode="scanner"`, the `ReactTicket` component automatically displays the Scanner Login UI.

```tsx
import React from 'react';
import { ReactTicket } from 'reactticket';
import { RestAdapter } from 'reactticket-core/adapters/RestAdapter';
import jsQR from 'jsqr';

// For production, always use RestAdapter or SupabaseAdapter
const adapter = new RestAdapter('https://api.yourdomain.com');

export function ScannerRoute() {
  return (
    <ReactTicket
      event={eventConfig}
      adapter={adapter}
      mode="scanner"
      qrParser={(data, width, height) => {
        const code = jsQR(data, width, height);
        return code ? { data: code.data } : null;
      }}
    />
  );
}
```

## How It Works

1. Staff members enter the **Scanner PIN** you created in the Admin Panel.
2. They are authenticated and granted a secure `ScanSession`.
3. The component uses the device camera to scan QR codes.
4. The QR payload is parsed, and the ticket's signature is verified.
5. If valid, the ticket is marked as scanned on the backend via the adapter.
