# AGENTS.md

This file gives coding agents project-specific context. Keep it short and update it when workflows change.

## Project Overview

- Primary app or package: `reactticket-core` (core library), `platform` (SSR app), `mobile-scanner` (PWA), `examples/demo-local` (dev demo)
- Main entry points: `reactticket-core/src/services/*.ts`, `platform/src/entry-server.tsx`, `examples/demo-local/src/main.tsx`
- Important directories: `reactticket-core/src/`, `platform/src/`, `supabase/migrations/`, `examples/demo-local/`

## Architecture Notes

- Module boundaries: `reactticket-core` = pure TS business logic (zero deps); `platform` = Express + Vite SSR + React UI; `mobile-scanner` = standalone PWA. `reactticket` package appears unused/empty.
- Generated or vendored code: `qrcodegen.ts` (vendored QR library), `jsQR.js` (vendored decoder). No code generation.
- Sensitive areas: `AuthService.ts` (HMAC secrets, PBKDF2), `ScanService.ts` (ticket validation state machine), `LocalStorageAdapter.ts` (dev-only, leaks secrets), `.env*` files (committed secrets — **rotate immediately**)

## Commands

- Install: `npm install` (in each package directory; no root workspaces yet)
- Build: `cd reactticket-core && npm run build` (tsc), `cd platform && npm run build` (vite), `cd mobile-scanner && npm run build`
- Test: `cd reactticket-core && npm run test` (vitest), `cd platform && npm run test` (vitest), `cd platform && npm run test:e2e` (playwright)
- Typecheck or lint: `tsc --noEmit` in each package (no ESLint configured yet — **add this**)

## Fallow

- Use `fallow audit --format json --quiet` before committing AI-generated changes.
- Use `fallow dead-code --format json --quiet`, `fallow dupes --format json --quiet`, and `fallow health --format json --quiet` for targeted checks.
- Use `fallow list --entry-points --format json --quiet` and `fallow list --boundaries --format json --quiet` to inspect project shape.

<!-- generated:task-matrix:start -->

| When the agent is about to...     | Run                                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------ |
| delete an "unused" export or file | `fallow dead-code --trace <file>:<export>`                                           |
| delete an "unused" dependency     | `fallow dead-code --trace-dependency <name>`                                         |
| commit or open a PR               | `fallow audit --base <ref>`                                                          |
| prioritize refactoring            | `fallow health --hotspots --targets`                                                 |
| ask who owns code                 | `fallow health --ownership`                                                          |
| check untested-but-reachable code | `fallow health --coverage-gaps`                                                      |
| consolidate duplication           | `fallow dupes --trace dup:<fingerprint>`                                             |
| find feature flags                | `fallow flags`                                                                       |
| surface security candidates       | `fallow security`                                                                    |
| understand a finding              | `fallow explain <issue-type>`                                                        |
| scope a monorepo                  | `--workspace <glob> / --changed-workspaces <ref>` (global flags, prefix any command) |

<!-- generated:task-matrix:end -->

## Agent Rules

- Do not edit: `.env*`, `supabase/config.toml`, `secrets/` without explicit user confirmation (contain live credentials)
- Always ask before: rotating secrets, modifying Supabase migrations, changing auth/crypto logic, adding new dependencies
- Preferred style: TypeScript strict mode, zero runtime deps in core, adapter pattern for storage, React Context + useReducer for state, inline styles avoided (platform needs CSS strategy)
