# Copilot instructions for ReactTicketing

This file gives focused, repo-specific instructions for Copilot sessions working on ReactTicketing.

---

## Quick build / test / lint commands (per-package)

Note: this repo is organized into separate packages; most commands must be run inside a package folder.

General patterns:

- Install dependencies (per package):
  - cd <package> && npm install

reactticket-core (core business logic)

- Build: cd reactticket-core && npm run build # runs `tsc`
- Test (all): cd reactticket-core && npm test # uses `vitest run`
- Run a single test file: cd reactticket-core && npx vitest run path/to/file.test.ts
- Run by test name: cd reactticket-core && npx vitest -t "test name"

reactticket (React UI library)

- Build: cd reactticket && npm run build # `vite build`
- Test (all): cd reactticket && npm test # `vitest run`
- Single test file: cd reactticket && npx vitest run path/to/file.test.ts
- Size check: cd reactticket && npm run size # size-limit configured

platform (demo / server / SSR host)

- Dev: cd platform && npm run dev
- Build: cd platform && npm run build
- Serve production (after build): cd platform && npm run serve
- Unit tests: cd platform && npm test # vitest
- E2E: cd platform && npm run test:e2e # Playwright
- Run specific playwright test: cd platform && npx playwright test tests/path.spec.ts

mobile-scanner (Capacitor/mobile demo)

- Dev/build/preview use vite scripts from package.json
- Build: cd mobile-scanner && npm run build

CI notes (useful for reproducing):

- CI installs per-package deps and builds libraries before running platform tests. It also runs Supabase locally for migrations and Playwright e2e.
- To mirror CI: build reactticket-core and reactticket before running platform tests.

Linting

- There is no repo-wide lint script. Platform contains ESLint devDeps.
- To lint platform: cd platform && npx eslint .

Node + tooling

- Node engine specified >= 20.0.0 in packages.
- TypeScript ~6.x; Vite, Vitest, Playwright used across packages.

---

## High-level architecture (big picture)

- Multi-package repository (simple local-package references, not a configured workspace file):
  - reactticket-core: pure TypeScript business logic (ticket lifecycle, cryptography helpers, jsQR assets). Built with tsc.
  - reactticket: zero-dependency React UI library that depends on reactticket-core for core logic; published/bundled via Vite. Exposes ESM and UMD outputs and enforces React/react-dom as peers.
  - platform: opinionated demo/host app implementing storefront, admin, and scanner flows. Uses Supabase for demo data, supports SSR builds (Vite SSR) and Playwright e2e tests.
  - mobile-scanner: Capacitor-based scanner demo for device builds.
  - examples/: starter templates (e.g., supabase-template)

- Test strategy:
  - Unit tests: Vitest across reactticket-core, reactticket and platform.
  - E2E: Playwright runs against the platform demo; CI boots a local Supabase instance.
  - Coverage: vitest coverage artifacts saved per-package under coverage/ (CI uploads them).

- Packaging & CI:
  - Libraries are built (reactticket-core then reactticket) before running app tests.
  - reactticket includes size-limit enforcement to keep UMD bundle within target.
  - CI assumes local file: dependencies linking (platform and mobile-scanner refer to local `file:../reactticket` and `file:../reactticket-core`).

---

## Key conventions and repo-specific patterns

- Local-package linking
  - Several packages reference local file dependencies (e.g., "reactticket": "file:../reactticket"). Tests and builds assume you build the libraries first.

- Zero-runtime-dependency design for the React package
  - reactticket is a "zero-dependency" library: it treats React and ReactDOM as peers and produces both ESM and UMD bundles.

- Post-build asset step for core
  - reactticket-core uses `postbuild` to copy jsQR-related assets into dist (see `postbuild` script); builds must preserve those files.

- Test invocation
  - The CI uses `npx vitest run --coverage` and calls per-package vitest. Reproduce locally with npx vitest run or npm test inside package.

- Playwright + Supabase
  - platform/test:e2e requires a running local Supabase instance (CI runs `supabase start` and exports env vars). When running e2e locally, export VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY similarly or run `supabase start`.

- Node & TypeScript versions pinned
  - Node >=20 and TypeScript ~6.0.2. Use these to avoid surprising build/test failures.

- Coverage & artifacts
  - Coverage folders are created per-package. CI uploads coverage artifacts from reactticket-core/, reactticket/, and platform/.

---

## Docs & useful paths

- Top-level docs referenced by README: docs/getting-started/, docs/technical/ (architecture, API reference), docs/community/
- Supabase migrations: supabase/migrations (CI relies on these)
- CI workflows: .github/workflows/test.yml and .github/workflows/deploy.yml

---

If you want additions: mention other files or workflows for Copilot to highlight (for example, additional package.json scripts, or a workspace config).
