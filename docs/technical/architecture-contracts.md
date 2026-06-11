# Architecture & Contracts

ReactTicket is designed as a front-end module that interacts with backends via a strictly typed `StorageAdapter`.

## StorageAdapter Contract
Any backend must implement the `StorageAdapter` interface, which defines the boundaries of data persistence:

- `fetchEventData()`
- `createOrder(order)`
- `updateTicketType(ticketType)`
- `createScanAccount(account)`
- `verifyScanAccount(pin)`
- `recordScanEvent(scanEvent)`
- ...

## Backend Invariants
1. **Delayed Delivery**: QR Codes and cryptographic signatures are NOT generated at checkout. Instead, checkout yields an un-delivered `TicketRecord`. Signatures are only generated during the delivery window (e.g., 48 hours before the event).
2. **First-Class Transfers**: Because tickets remain un-signed until delivery, transferring a ticket is securely accomplished by simply updating the `personalization` details in the database.
3. **Ticket Immutability (Post-Delivery)**: Once a ticket's status transitions to `delivered` and its QR payload is signed, it must never change.
4. **Double-Scanning**: The backend must transactionally guarantee that a delivered ticket can only be scanned once.
5. **Capacity Constraints**: The backend is the ultimate source of truth for inventory.
6. **Secret Management**: The `adminKey` and backend secrets (for HMAC signing) must never leak to the frontend.
