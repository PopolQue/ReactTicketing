<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the ReactTicketing platform. The platform is a React Router v6 SSR app with an Express server, Supabase auth, and Stripe payments. PostHog was initialized client-side via `entry-client.tsx` with `PostHogProvider` from `@posthog/react`, and server-side via a per-request `posthog-node` client instantiated in the Express `/api/create-payment-intent` handler. Tracing headers (`X-POSTHOG-SESSION-ID`, `X-POSTHOG-DISTINCT-ID`) automatically correlate client and server events. Error tracking was added to the global `ErrorBoundary` class component using the posthog-js singleton. Eleven events are now captured across the full user lifecycle — from discovery and login through ticket purchase and organizer event creation.

| Event Name | Description | File |
|---|---|---|
| `user_logged_in` | User successfully logs in via email/password or SSO | `platform/src/features/auth/LoginForm.tsx` |
| `user_signed_up` | User completes signup via phone OTP verification or SSO | `platform/src/features/auth/SignUpForm.tsx` |
| `event_viewed` | User views an event details page (top of ticket purchase funnel) | `platform/src/pages/marketplace/EventDetails.tsx` |
| `external_ticket_link_clicked` | User clicks to get tickets from an external source | `platform/src/pages/marketplace/EventDetails.tsx` |
| `event_searched` | User submits a search query on the Discover page | `platform/src/pages/marketplace/Discover.tsx` |
| `checkout_started` | User opens the checkout flow for a ticketed event | `platform/src/pages/marketplace/EventDetails.tsx` |
| `checkout_step_completed` | User completes ticket personalization and proceeds to payment | `platform/src/features/marketplace/CheckoutFlow.tsx` |
| `promo_code_applied` | User successfully applies a promo code during checkout | `platform/src/hooks/usePromoCode.ts` |
| `order_completed` | User completes a ticket purchase order successfully | `platform/src/features/marketplace/CheckoutFlow.tsx`, `platform/src/pages/marketplace/EventDetails.tsx` |
| `event_created` | Organizer successfully creates a new event | `platform/src/hooks/useEventForm.ts` |
| `payment_intent_created` | Server-side: Stripe payment intent created for a ticket order | `platform/server.js` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) — Dashboard](https://us.posthog.com/project/477784/dashboard/1736276)
- [Ticket Purchase Funnel](https://us.posthog.com/project/477784/insights/RellwGOF)
- [Signups & Logins over time](https://us.posthog.com/project/477784/insights/cUA9eiAh)
- [Orders Completed](https://us.posthog.com/project/477784/insights/hFTUCrki)
- [Event Discovery & Views](https://us.posthog.com/project/477784/insights/3tyBz7rt)
- [Events Created by Organizers](https://us.posthog.com/project/477784/insights/ue2uN7gZ)

## Verify before merging

- [ ] Run a full production build (`npm run build` inside `platform/`) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures (especially `usePromoCode.test.ts`, `useCheckout.test.ts`).
- [ ] Add `VITE_PUBLIC_POSTHOG_PROJECT_TOKEN`, `VITE_PUBLIC_POSTHOG_HOST`, and `VITE_PUBLIC_POSTHOG_ASSETS_HOST` to `platform/.env.example` and any CI/bootstrap scripts so collaborators know what to set.
- [ ] Wire source-map upload into CI so production stack traces de-minify (PostHog CLI: `posthog-cli sourcemap upload`).
- [ ] Confirm the returning-visitor path also calls `identify` — currently `identify` is called on email login and phone OTP, but SSO logins that return via OAuth redirect land in Supabase's `onAuthStateChange` listener. Ensure that listener also calls `posthog.identify()` with the Supabase user ID.

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-react-react-router-7-framework/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
</wizard-report>
