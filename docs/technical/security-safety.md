# Security & Safety

ReactTicket takes event security seriously. Counterfeit tickets are a major issue for event organizers, so we implement cryptographic signatures.

## PBKDF2 Hashing

Scanner Account PINs are never stored in plaintext. The `reactticket-core` library securely hashes the PIN using PBKDF2 with a high iteration count before storing it or validating it. This prevents offline brute-force attacks if your database is compromised.

## HMAC Signatures

When a ticket is generated, the payload (containing the Ticket ID, Event ID, and metadata) is signed using an HMAC-SHA256 digest. The signature is embedded inside the QR code.

When a scanner scans the ticket, the backend adapter validates the signature to ensure:

1. The ticket was issued by your system.
2. The payload was not tampered with.

*Note: The LocalStorageAdapter bypasses this validation for demo purposes. Always use a secure backend adapter in production!*
