# ReactTicket

A professional-grade, zero-dependency React + TypeScript ticketing module. This library provides a self-contained solution for event ticketing, covering the complete lifecycle from ticket generation and QR distribution to mobile scanner validation and analytics — all without external runtime dependencies.

Developed for event organizers and festival planners.
Powered by Web Crypto API and pure TypeScript Canvas rendering.

ReactTicket is not a payment processor; it is a sophisticated ticket lifecycle controller that integrates seamlessly into any React-based website or application.

## Key Features

* **Zero Dependencies:** React + ReactDOM are the only peer dependencies.
* **Self-Contained Rendering:** QR codes and ticket cards are generated entirely client-side.
* **Full Lifecycle:** Configuration, Sales, Generation, Scan Validation, and Analytics Dashboard included.
* **Production-Ready:** Includes a production adapter guard, secure PIN hashing (PBKDF2), and a strict backend state machine contract.
* **Highly Flexible:** Pluggable `StorageAdapter` allows for immediate LocalStorage-based prototypes or production-grade REST/Database backends.

## Documentation Hub

Choose your path based on your role and technical stack.

### Getting Started

* **Quick Start** — Minimal storefront setup.
* **Dedicated Scanner** — Route configuration for crew phones.
* **Admin Integration** — Panel setup and Scan Account management.

### Technical Deep-Dives

* **Architecture & Contracts** — Domain model and backend invariants.
* **Security & Safety** — PBKDF2 hashing, HMAC signing, and session token formats.
* **API Reference** — Hooks, Components, and the `StorageAdapter` interface.
* **Theming Reference** — CSS custom properties for style-agnostic integration.
* **Testing Strategy** — Unit and integration patterns to verify ticketing logic.

### Community & Maintenance

* **Project Philosophy** — Vision, goals, and non-goals.
* **Roadmap** — Post-launch plans and future features.
* **Contributing Guide** — Standards & code of conduct.
* **Changelog** — Release history.

## Configuration (via `<ReactTicket />`)

| Property | Default | Description |
| :--- | :--- | :--- |
| `event` | - | Full event configuration and settings. |
| `adapter` | - | `StorageAdapter` implementation (LocalStorage or REST). |
| `mode` | `full` | Operating mode: `storefront`, `scanner`, `admin`, or `full`. |
| `onCheckout` | - | Callback for payment integration. |
| `onTicketIssued` | - | Callback for PDF/QR delivery. |

## License

MIT © 2026. See the [LICENSE](LICENSE) file for details.
