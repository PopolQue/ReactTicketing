# Admin Integration

The Admin Panel allows event organizers to view capacity, edit ticket types, and manage Scanner Accounts.

## Securing the Admin Route

The admin interface should ideally be placed behind your application's own authentication wall, but ReactTicket provides a secondary layer of protection via the `adminKey` prop.

```tsx
import React from 'react';
import { ReactTicket } from 'reactticket';
import { RestAdapter } from 'reactticket-core/adapters/RestAdapter';

const adapter = new RestAdapter("https://api.yourdomain.com");

export function AdminRoute() {
  return (
    <ReactTicket
      event={eventConfig}
      adapter={adapter}
      mode="admin"
      adminKey="super_secret_admin_password"
    />
  );
}
```

## Features

* **Ticket Overview**: See global sales and remaining capacity.
* **Ticket Type Editor**: Update prices, limits, and descriptions on the fly.
* **Scan Account Manager**: Generate secure PINs for your staff to use on the scanner devices.
* **Promo Code Manager**: Create discount codes and track their usage.
