# Roadmap

The ReactTicket project is continuously evolving. Here is a look at what is coming next:

## Q3 2026

- **Webhooks Integration:** Native support for triggering webhooks upon ticket scans.
- **Waitlist Support:** Automated waitlist queue and notification system for sold-out ticket tiers.

## Q4 2026

- **Seat Maps:** An interactive SVG seat picker for seated events and theaters.
- **Secondary Market Tools:** Secure ticket transfer protocols to prevent scalping.

---

### Architectural Decisions
- **Wallet Pass Integration (Passed):** Apple Wallet and Google Wallet (`.pkpass`) integrations are explicitly deferred because standard pass passes primarily support static QR codes, whereas ReactTicket relies on dynamic, anti-fraud HMAC-signed QR code payloads for secure venue entry.
