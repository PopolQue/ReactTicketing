# API Reference

## Components

### `<ReactTicket />`

The primary component for integrating the ticketing system.

**Props:**

* `event` (EventConfig): The static configuration for the event.
* `adapter` (StorageAdapter): The backend integration instance.
* `mode` ("storefront" | "scanner" | "admin" | "tickets" | "full"): The UI mode to render.
* `adminKey` (string): Optional. Required for admin mode access.
* `onCheckout` (Promise): Callback invoked when the user proceeds to checkout.
* `qrParser` (Function): Optional. A parser function for the scanner (e.g. `jsQR`).

## Hooks

* `useReactTicket()`: Access the global event and adapter context.
* `useCart()`: Manage the storefront shopping cart.
* `useScanSession()`: Manage the current scanner's authenticated session.
* `usePromo()`: Validate and apply promo codes.
