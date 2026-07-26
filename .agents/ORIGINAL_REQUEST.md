# Security Hardening Orchestration Request — 2026-07-26

## Objective

Execute a comprehensive Security Hardening process for the ReactTicketing project:

1. **Secret & Credential Management**: Identify and audit secret handling across `.env*` files, HMAC/PBKDF2 implementations, and token generation in `reactticket-core/src/services/AuthService.ts`. Ensure no live production credentials are exposed.
2. **Dev Storage Decoupling**: Isolate and secure `LocalStorageAdapter.ts` in `reactticket-core/src/adapters/` so dev-only storage mechanisms cannot leak secrets or be accidentally used in production.
3. **OWASP & Production Compliance**: Verify input validation, rate limiting, and session security in platform and core services.

## Scope & Constraints

- Working directory: `/Users/davidcutura/Projects/ReactTicketing`
- Do NOT edit `.env*`, `supabase/config.toml`, or `secrets/` without explicit user confirmation.
- Ask user confirmation before rotating secrets, modifying Supabase migrations, or altering auth/crypto logic.
- Follow TypeScript strict mode and adapter pattern standards.
