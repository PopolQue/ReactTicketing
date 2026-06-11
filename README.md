# ReactTicket

A professional-grade, zero-dependency React + TypeScript ticketing module. This library provides a self-contained solution for event ticketing, covering the complete lifecycle from ticket generation and QR distribution to mobile scanner validation and analytics — all without external runtime dependencies.

Developed for event organizers and festival planners.
Powered by Web Crypto API and pure TypeScript Canvas rendering.

ReactTicket is not a payment processor; it is a sophisticated ticket lifecycle controller that integrates seamlessly into any React-based website or application.

## Live Demo

A fully functional interactive demo of the complete ticketing lifecycle is available here:
**[ReactTicket Live Demo](https://popolque.github.io/ReactTicketing/)**

### How to Use the Demo
The demo runs entirely in your browser using `LocalStorage` (no backend required). It features a tabbed interface to explore the different modules:

1. **Storefront**: Simulate a customer buying tickets. Add tickets to your cart, fill in buyer info, and "checkout" (payment is simulated).
2. **Tickets**: View your newly generated tickets and their QR codes.
3. **Admin**: Access the admin panel using the password `password`. Here you can view global capacity, manage ticket types, and create "Scanner Accounts" to grant your event staff access.
4. **Scanner**: Log in with a Scanner Account PIN that you created in the Admin panel. You can use your device's camera to scan and validate the ticket QR codes from the Tickets tab.

## Key Features

* **Zero Dependencies:** React + ReactDOM are the only peer dependencies.
* **Self-Contained Rendering:** QR codes and ticket cards are generated entirely client-side.
* **Full Lifecycle:** Configuration, Sales, Generation, Scan Validation, and Analytics Dashboard included.
* **Production-Ready:** Includes a production adapter guard, secure PIN hashing (PBKDF2), and a strict backend state machine contract.
* **Highly Flexible:** Pluggable `StorageAdapter` allows for immediate LocalStorage-based prototypes or production-grade REST/Database backends.

## Documentation Hub

Choose your path based on your role and technical stack.

### Getting Started

* [**Quick Start**](docs/getting-started/quick-start.md) — Minimal storefront setup.
* [**Dedicated Scanner**](docs/getting-started/dedicated-scanner.md) — Route configuration for crew phones.
* [**Admin Integration**](docs/getting-started/admin-integration.md) — Panel setup and Scan Account management.

### Technical Deep-Dives

* [**Architecture & Contracts**](docs/technical/architecture-contracts.md) — Domain model and backend invariants.
* [**Security & Safety**](docs/technical/security-safety.md) — PBKDF2 hashing, HMAC signing, and session token formats.
* [**API Reference**](docs/technical/api-reference.md) — Hooks, Components, and the `StorageAdapter` interface.
* [**Theming Reference**](docs/technical/theming-reference.md) — CSS custom properties for style-agnostic integration.
* [**Testing Strategy**](docs/technical/testing-strategy.md) — Unit and integration patterns to verify ticketing logic.

### Community & Maintenance

* [**Project Philosophy**](docs/community/project-philosophy.md) — Vision, goals, and non-goals.
* [**Roadmap**](docs/community/roadmap.md) — Post-launch plans and future features.
* [**Contributing Guide**](docs/community/contributing.md) — Standards & code of conduct.
* [**Changelog**](docs/community/changelog.md) — Release history.

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
