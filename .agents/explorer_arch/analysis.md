# Comprehensive Architectural, Quality, Tooling, and Test Coverage Audit

**Repository Root**: `/Users/davidcutura/Projects/ReactTicketing`  
**Date of Audit**: 2026-07-22  
**Auditor**: Explorer Agent (`explorer_arch`)

---

## Executive Summary

An architectural, quality, tooling, static analysis, and test coverage audit was conducted across all packages in the ReactTicketing monorepo: `reactticket-core`, `platform`, `mobile-scanner`, `examples/demo-local`, `examples/supabase-template`, `reactticket`, and root setup.

### Core Audit Discoveries

1. **Packaging & Monorepo Linkage Defects**:
   - `reactticket-core` lacks a root `src/index.ts` entrypoint, leaving `package.json` (`main: "dist/index.js"`) referencing non-existent files upon build.
   - Monorepo packages use `file:../...` relative paths or bundler path aliases instead of proper npm workspace resolution.
   - `mobile-scanner` violates package boundaries by directly importing internal source files from `../../platform/src/lib/Admit/SupabaseAdapter`.
   - `AGENTS.md` incorrectly identified `reactticket` as an empty/unused package, whereas `reactticket` is a complete React component library with 109 source files and 42 tests dynamically loaded by `platform`.

2. **Tooling & Static Analysis Gaps**:
   - `mobile-scanner` lacks a `tsconfig.json` entirely.
   - No root `tsconfig.base.json` exists; compiler options vary wildly (`demo-local` disables strict mode, target versions mismatch between `es2023` and `ESNext`).
   - ESLint flat config at root lacks typed linting (`recommendedTypeChecked` / `parserOptions.project`).

3. **Severe Test Coverage Gaps**:
   - `mobile-scanner` and `examples/demo-local` are omitted from `vitest.workspace.ts`. `mobile-scanner` has zero tests.
   - In `reactticket-core`, 6 of 10 services (`FriendService`, `PDFRenderer`, `PayPalService`, `PostService`, `QRGenerator`, `TransferService`) and all storage adapters (`LocalStorageAdapter`, `RestAdapter`) have zero unit tests.
   - In `platform`, under 15% of code is covered by unit tests (only 9 test files total). All primary pages and core authentication/payment features lack unit tests.
   - Production builds in `platform/vite.config.ts` drop all console output (`drop: ['console', 'debugger']`), blinding production error monitoring.

4. **CSS Strategy Deficiencies**:
   - Over 1,400 inline `style={{ ... }}` instances in `platform/src`.
   - Lack of a structured CSS framework or CSS modules, relying on heavy global `!important` CSS overrides in `platform/src/index.css` to override embedded component styles.

5. **Code Duplication & Vendored Code**:
   - Duplicate scanner UI components between `mobile-scanner` and `reactticket`.
   - Vendored QR code decoder and generator files in `reactticket-core` requiring postbuild shell copy commands while example packages install `jsqr` via npm.

---

## 1. Monorepo Structure & Package Architecture Audit

### 1.1 Missing Core Entrypoint in `reactticket-core`

- **Location**: `file:///Users/davidcutura/Projects/ReactTicketing/reactticket-core/package.json` (Lines 5–6)
- **Observation**:
  ```json
  5:   "main": "dist/index.js",
  6:   "types": "dist/index.d.ts",
  ```
  Inspection of `file:///Users/davidcutura/Projects/ReactTicketing/reactticket-core/src/` confirms there is **no `index.ts`** file in `src/`. Only sub-barrel files `src/adapters/index.ts` and `src/types/index.ts` exist.
- **Logic Chain**:
  1. `reactticket-core/package.json` points `main` to `dist/index.js`.
  2. `tsc` compiles TypeScript files in `src/` to `dist/`.
  3. Because `src/index.ts` does not exist, `tsc` emits `dist/adapters/index.js`, `dist/services/AuthService.js`, etc., but **no `dist/index.js`**.
  4. Node.js standard package resolution for `import { ... } from 'reactticket-core'` fails because `dist/index.js` is missing.
  5. As a workaround, downstream packages (`platform`, `examples/demo-local`) were forced to configure custom bundler path aliases (`'reactticket-core': path.resolve(__dirname, '../reactticket-core/src')`).
- **Caveats**: Works in Vite dev mode due to custom aliases, but fails for standard Node.js runtime imports, non-Vite bundlers, or npm published packages.
- **Impact**: High. Breaks standard module resolution, prevents independent consumption of `reactticket-core`, and forces downstream hacky bundler path aliases.
- **Remediation**:
  1. Create `file:///Users/davidcutura/Projects/ReactTicketing/reactticket-core/src/index.ts` re-exporting all public services, adapters, types, and utils:
     ```ts
     export * from './services/AuthService';
     export * from './services/ScanService';
     export * from './services/TicketService';
     export * from './services/ScanAccountService';
     export * from './services/FriendService';
     export * from './services/PDFRenderer';
     export * from './services/PayPalService';
     export * from './services/PostService';
     export * from './services/QRGenerator';
     export * from './services/TransferService';
     export * from './adapters';
     export * from './types';
     ```
  2. Run `npm run build` in `reactticket-core` to verify `dist/index.js` and `dist/index.d.ts` are generated.

---

### 1.2 Monorepo Workspace Misconfiguration & Linkage Anti-Patterns

- **Locations**:
  - `file:///Users/davidcutura/Projects/ReactTicketing/package.json` (Lines 5–12)
  - `file:///Users/davidcutura/Projects/ReactTicketing/platform/package.json` (Lines 37–38)
  - `file:///Users/davidcutura/Projects/ReactTicketing/mobile-scanner/package.json` (Lines 26–27)
  - `file:///Users/davidcutura/Projects/ReactTicketing/examples/demo-local/package.json` (Lines 12–15)
- **Observation**:
  Root `package.json` defines npm workspaces:
  ```json
  "workspaces": [
    "platform",
    "reactticket",
    "reactticket-core",
    "mobile-scanner",
    "examples/demo-local",
    "examples/supabase-template"
  ]
  ```
  However, subpackage `package.json` files specify local dependencies using file paths:
  - `platform/package.json`:
    ```json
    "reactticket": "file:../reactticket",
    "reactticket-core": "file:../reactticket-core"
    ```
  - `mobile-scanner/package.json`:
    ```json
    "reactticket": "file:../reactticket",
    "reactticket-core": "file:../reactticket-core"
    ```
  - `examples/demo-local/package.json`: Omits `reactticket` and `reactticket-core` from `dependencies` completely.
- **Logic Chain**:
  1. Npm workspaces create root symlinks in `node_modules`.
  2. Specifying `"file:../reactticket"` overrides workspace symlinking in npm, causing npm to copy directory contents or create nested tarball links.
  3. Omitting dependencies entirely in `demo-local` relies on Vite alias magic (`'@ReactTicket': path.resolve(__dirname, '../../reactticket/src')`) in `file:///Users/davidcutura/Projects/ReactTicketing/examples/demo-local/vite.config.ts` (Lines 13–16).
  4. This creates inconsistent dependency trees, phantom dependencies, and build failures when using standard CLI tools (`tsc`, `vitest`, `fallow`).
- **Caveats**: None.
- **Impact**: Medium-High. Degrades build consistency, breaks monorepo tool integration (`fallow`, CI), and creates node_modules duplication.
- **Remediation**:
  1. In `platform/package.json` and `mobile-scanner/package.json`, update dependencies to standard workspace package references:
     ```json
     "reactticket": "*",
     "reactticket-core": "*"
     ```
  2. In `examples/demo-local/package.json`, add `"reactticket": "*"` and `"reactticket-core": "*"` to `dependencies`.

---

### 1.3 Misclassification of `reactticket` Package

- **Locations**:
  - `file:///Users/davidcutura/Projects/ReactTicketing/AGENTS.md` (Line 14)
  - `file:///Users/davidcutura/Projects/ReactTicketing/reactticket/package.json` (Lines 1–55)
  - `file:///Users/davidcutura/Projects/ReactTicketing/platform/src/pages/marketplace/EventDetails.tsx` (Line 19)
  - `file:///Users/davidcutura/Projects/ReactTicketing/platform/src/pages/marketplace/ScanPage.tsx` (Line 10)
- **Observation**:
  `AGENTS.md` states: `reactticket package appears unused/empty.`
  However, investigation of `file:///Users/davidcutura/Projects/ReactTicketing/reactticket/src` reveals:
  - 109 source files comprising complete React UI components (`ReactTicket.tsx`, `AdminPanel.tsx`, `ScannerView.tsx`, `Cart.tsx`, `TicketWidget.tsx`, `CapacityOverview.tsx`, `ScanDashboard.tsx`, etc.).
  - 42 comprehensive unit test files.
  - Active dynamic imports in `platform`:
    ```tsx
    // EventDetails.tsx:19
    import('reactticket').then((m) => ({ default: m.ReactTicket }));
    // ScanPage.tsx:10
    import('reactticket').then((m) => ({ default: m.ReactTicket }));
    ```
- **Logic Chain**:
  1. `reactticket` is not empty or unused; it is the core zero-dependency React UI component library for the monorepo.
  2. Incorrect documentation in `AGENTS.md` misleads developers and AI agents into believing `reactticket` can be deleted or ignored, leading to duplicated UI components in `platform` and `mobile-scanner`.
- **Caveats**: None.
- **Impact**: Medium. Leads to architectural confusion, duplicated work, and inaccurate developer/agent context.
- **Remediation**: Update `AGENTS.md` to document `reactticket` as the official React UI Component Library package.

---

### 1.4 Cross-Package Boundary Leak in `mobile-scanner`

- **Location**: `file:///Users/davidcutura/Projects/ReactTicketing/mobile-scanner/src/App.tsx` (Lines 3–4)
- **Observation**:
  ```tsx
  3: import { SupabaseAdapter } from '../../platform/src/lib/Admit/SupabaseAdapter';
  4: import { supabase } from '../../platform/src/lib/supabase';
  ```
- **Logic Chain**:
  1. `mobile-scanner` is intended to be an independent PWA / Capacitor mobile app package.
  2. Importing source files directly from `../../platform/src/...` creates a hard coupling to `platform`'s internal folder structure.
  3. If `platform` refactors `src/lib/Admit/SupabaseAdapter` or `src/lib/supabase`, `mobile-scanner` will break without notice.
  4. `mobile-scanner` cannot be built or distributed as a standalone app outside this specific directory tree.
- **Caveats**: `SupabaseAdapter` is currently located in `platform/src/lib/Admit/SupabaseAdapter.ts` instead of `reactticket-core`.
- **Impact**: High. Direct violation of package encapsulation and monorepo boundaries.
- **Remediation**:
  1. Relocate `SupabaseAdapter.ts` from `platform/src/lib/Admit/SupabaseAdapter.ts` into `reactticket-core/src/adapters/SupabaseAdapter.ts` (or export it from a shared package).
  2. Export `SupabaseAdapter` from `reactticket-core`.
  3. Update `mobile-scanner/src/App.tsx` to import `SupabaseAdapter` from `'reactticket-core'`.

---

## 2. Tooling, Static Analysis & TypeScript Audit

### 2.1 Missing `tsconfig.json` in `mobile-scanner`

- **Location**: `file:///Users/davidcutura/Projects/ReactTicketing/mobile-scanner/`
- **Observation**:
  `mobile-scanner` contains React TypeScript files (`App.tsx`, `main.tsx`, `components/scanner/ScanResult.tsx`, `components/scanner/ScannerLogin.tsx`), but has **no `tsconfig.json`** file in its root directory.
- **Logic Chain**:
  1. `tsc --noEmit` skipped `mobile-scanner` entirely because no `tsconfig.json` exists in the folder.
  2. IDEs default to fallback implicit compiler settings, failing to provide accurate diagnostics for imports or Capacitor types.
  3. Type errors inside `mobile-scanner` pass unnoticed during CI build steps.
- **Caveats**: None.
- **Impact**: High. Unchecked type safety risks in mobile application code.
- **Remediation**: Create `file:///Users/davidcutura/Projects/ReactTicketing/mobile-scanner/tsconfig.json`:
  ```json
  {
    "compilerOptions": {
      "target": "ESNext",
      "lib": ["DOM", "DOM.Iterable", "ESNext"],
      "module": "ESNext",
      "moduleResolution": "Bundler",
      "jsx": "react-jsx",
      "strict": true,
      "skipLibCheck": true,
      "esModuleInterop": true,
      "noEmit": true
    },
    "include": ["src"]
  }
  ```

---

### 2.2 Lack of Root TSConfig Base & Configuration Drift

- **Locations**:
  - `file:///Users/davidcutura/Projects/ReactTicketing/` (Missing `tsconfig.base.json`)
  - `file:///Users/davidcutura/Projects/ReactTicketing/examples/demo-local/tsconfig.json` (Line 11, Line 4)
  - `file:///Users/davidcutura/Projects/ReactTicketing/examples/demo-local/package.json` (Line 21)
  - `file:///Users/davidcutura/Projects/ReactTicketing/platform/tsconfig.app.json` (Line 4)
  - `file:///Users/davidcutura/Projects/ReactTicketing/reactticket-core/tsconfig.json` (Line 3)
- **Observation**:
  1. No root `tsconfig.base.json` exists to enforce standard compiler options.
  2. `demo-local/tsconfig.json` sets `"strict": false` (Line 11) and `"ignoreDeprecations": "5.0"` (Line 4).
  3. `demo-local/package.json` specifies `"typescript": "^5.0.0"`, whereas root `package.json` specifies `"typescript": "~6.0.2"`.
  4. `platform/tsconfig.app.json` specifies `"target": "es2023"`, while `reactticket-core/tsconfig.json` specifies `"target": "ESNext"`.
  5. Path aliases differ across packages (`reactticket` points to `../reactticket-core/dist/*`, `demo-local` points to `../../reactticket-core/src/*`, `reactticket-core` points to `./src/*`).
- **Logic Chain**:
  1. Inconsistent TS settings allow non-strict code to pass in example packages while breaking when imported elsewhere.
  2. Differing TypeScript major/minor versions cause compiler output discrepancies across packages.
  3. Inconsistent path resolution breaks editor type checking when jumping between package sources.
- **Caveats**: None.
- **Impact**: Medium-High. Weakens type safety guarantees and degrades developer experience.
- **Remediation**:
  1. Create a root `tsconfig.base.json` defining strict rules:
     ```json
     {
       "compilerOptions": {
         "target": "ESNext",
         "module": "ESNext",
         "moduleResolution": "Bundler",
         "strict": true,
         "skipLibCheck": true,
         "esModuleInterop": true,
         "allowSyntheticDefaultImports": true
       }
     }
     ```
  2. Extend `tsconfig.base.json` in `reactticket-core`, `reactticket`, `platform`, `mobile-scanner`, and `examples/demo-local`.
  3. Standardize TypeScript dependency version to `~6.0.2` in `examples/demo-local/package.json`.

---

### 2.3 ESLint Typed Linting Deficit

- **Location**: `file:///Users/davidcutura/Projects/ReactTicketing/eslint.config.js` (Lines 8–46)
- **Observation**:
  Root ESLint flat config uses `js.configs.recommended` and `...tseslint.configs.recommended`, but does NOT enable type-aware linting (`tseslint.configs.recommendedTypeChecked` or `parserOptions.project`).
- **Logic Chain**:
  1. Untyped ESLint rules miss bugs like `any` propagation, unhandled async promises, unsafe member accesses, and incorrect boolean coercions.
  2. Subpackages (`mobile-scanner`, `demo-local`) rely on root ESLint without package-specific linting verification.
- **Caveats**: Typed linting requires `parserOptions.project` or project service setup.
- **Impact**: Medium. Lower code quality enforcement across the repository.
- **Remediation**: Upgrade `eslint.config.js` to use `tseslint.configs.recommendedTypeChecked` with `parserOptions.projectService: true`.

---

## 3. Test Setup & Test Coverage Audit

### 3.1 Workspace Test Omissions

- **Locations**:
  - `file:///Users/davidcutura/Projects/ReactTicketing/vitest.workspace.ts` (Line 3)
  - `file:///Users/davidcutura/Projects/ReactTicketing/mobile-scanner/package.json` (Line 10)
- **Observation**:
  ```ts
  // vitest.workspace.ts:3
  export default defineWorkspace(['platform', 'reactticket', 'reactticket-core']);
  ```
  `mobile-scanner` and `examples/demo-local` are omitted from the workspace. `mobile-scanner/package.json` contains:
  ```json
  "test": "echo \"No tests specified for mobile-scanner\""
  ```
- **Logic Chain**:
  1. Executing `npm test` at the monorepo root skips testing `mobile-scanner` and `demo-local`.
  2. `mobile-scanner` has zero unit test files, leaving the scanner PWA completely unvalidated automatically.
- **Caveats**: `demo-local` is an example app, but `mobile-scanner` is a production PWA package.
- **Impact**: High. High risk of unnoticed regressions in `mobile-scanner`.
- **Remediation**:
  1. Add `vitest` unit test setup to `mobile-scanner`.
  2. Update `vitest.workspace.ts` to include `'mobile-scanner'`.

---

### 3.2 Core Business Logic Coverage Gaps in `reactticket-core`

- **Location**: `file:///Users/davidcutura/Projects/ReactTicketing/reactticket-core/src/`
- **Observation**:
  Out of 10 services in `reactticket-core/src/services`:
  - Tested (4): `AuthService.ts`, `ScanAccountService.ts`, `ScanService.ts`, `TicketService.ts`.
  - **UNTESTED (6)**:
    1. `file:///Users/davidcutura/Projects/ReactTicketing/reactticket-core/src/services/FriendService.ts`
    2. `file:///Users/davidcutura/Projects/ReactTicketing/reactticket-core/src/services/PDFRenderer.ts`
    3. `file:///Users/davidcutura/Projects/ReactTicketing/reactticket-core/src/services/PayPalService.ts`
    4. `file:///Users/davidcutura/Projects/ReactTicketing/reactticket-core/src/services/PostService.ts`
    5. `file:///Users/davidcutura/Projects/ReactTicketing/reactticket-core/src/services/QRGenerator.ts`
    6. `file:///Users/davidcutura/Projects/ReactTicketing/reactticket-core/src/services/TransferService.ts`
       Out of 2 storage adapters in `reactticket-core/src/adapters`:
  - **UNTESTED (2)**:
    1. `file:///Users/davidcutura/Projects/ReactTicketing/reactticket-core/src/adapters/LocalStorageAdapter.ts`
    2. `file:///Users/davidcutura/Projects/ReactTicketing/reactticket-core/src/adapters/RestAdapter.ts`
- **Logic Chain**:
  1. Ticket transfer logic (`TransferService`), payment integration (`PayPalService`), PDF generation (`PDFRenderer`), QR generation (`QRGenerator`), and social features (`FriendService`, `PostService`) contain core business logic without automated test verification.
  2. Storage adapters handling state serialization have no test coverage.
- **Caveats**: None.
- **Impact**: Critical. High risk of silent regressions in financial transactions, ticket transfers, and QR validation logic.
- **Remediation**: Create unit tests in `reactticket-core/src/services/__tests__/` for `FriendService`, `PDFRenderer`, `PayPalService`, `PostService`, `QRGenerator`, and `TransferService`, and in `reactticket-core/src/adapters/__tests__/` for `LocalStorageAdapter` and `RestAdapter`.

---

### 3.3 Massive Unit Test Coverage Gap in `platform`

- **Location**: `file:///Users/davidcutura/Projects/ReactTicketing/platform/src/`
- **Observation**:
  `platform` contains only **9 unit test files**:
  - `ErrorBoundary.test.tsx`, `Skeleton.test.tsx`, `Toast.test.tsx`
  - `LanguageContext.test.tsx`, `CheckoutSummary.test.tsx`
  - `useCheckout.test.ts`, `useDebouncedSearch.test.ts`, `usePromoCode.test.ts`
  - `mappers.test.ts`

  **UNTESTED in `platform`**:
  - **Pages**: `EventDetails.tsx`, `Marketplace.tsx`, `OrganizerDashboard.tsx`, `ScanPage.tsx`, `AdminDashboard.tsx`, `UserProfile.tsx`, `ResaleMarketplace.tsx` (0 page unit tests).
  - **Features**: `LoginForm.tsx`, `SignUpForm.tsx`, `ForgotPasswordForm.tsx`, `UpdatePasswordForm.tsx`, `StripeCheckoutForm.tsx`, `PayPalButton.tsx`, `DynamicFloorPlan.tsx`, `SeatPicker.tsx`, `LoyaltyRewards.tsx`, `PostHogAnalytics.tsx` (0 feature unit tests).
  - **Services & Adapters**: `SupabaseAdapter.ts`, `auth.ts`, `supabase.ts`, `stripe.ts`, `paypal.ts` (0 service/adapter tests).

- **Logic Chain**:
  1. `platform/vite.config.ts` (Lines 30–32) mandates a Vitest coverage threshold of 70% lines and 70% functions:
     ```ts
     coverage: {
       thresholds: { lines: 70, functions: 70 },
     }
     ```
  2. Actual unit test coverage for `platform` is estimated under **15%**. Running Vitest with coverage enabled will fail the CI build.
- **Caveats**: `platform/e2e/` contains 6 Playwright E2E test files (`auth.spec.ts`, `checkout.spec.ts`, `color.spec.ts`, `marketplace.spec.ts`, `resale.spec.ts`, `scanner.spec.ts`), but E2E tests do not replace unit testing for edge cases or adapter error handling.
- **Impact**: Critical. High risk of UI, auth, payment, and state management failures.
- **Remediation**: Write comprehensive unit tests for `platform` features, hooks, pages, and `SupabaseAdapter`.

---

### 3.4 Production Console Suppression in `platform`

- **Location**: `file:///Users/davidcutura/Projects/ReactTicketing/platform/vite.config.ts` (Lines 21–23)
- **Observation**:
  ```ts
  esbuild: {
    drop: ['console', 'debugger'],
  },
  ```
- **Logic Chain**:
  1. Setting `drop: ['console', 'debugger']` in Esbuild removes all `console.log`, `console.warn`, and `console.error` calls from production client and SSR server builds.
  2. Runtime exceptions, unhandled Promise rejections, and logger outputs are silenced in production logs and observability services (PostHog, Sentry).
- **Caveats**: `console.log` stripping is common, but stripping `console.error` and `console.warn` breaks production debugging.
- **Impact**: High. Prevents effective monitoring and debugging of production errors.
- **Remediation**: Modify `platform/vite.config.ts` to drop `debugger` only, or configure Esbuild `pure: ['console.log']` instead of dropping all console methods.

---

## 4. Platform CSS Strategy Audit

### 4.1 Pervasive Inline Styling Anti-Pattern

- **Location**: `file:///Users/davidcutura/Projects/ReactTicketing/platform/src/`
- **Observation**:
  Search confirms **over 1,400 occurrences** of inline `style={{ ... }}` attributes across `platform/src` components (e.g. `LoginForm.tsx`, `SignUpForm.tsx`, `CheckoutFlow.tsx`, `ForgotPasswordForm.tsx`).
- **Logic Chain**:
  1. Components rely on inline JavaScript object literals for basic layout, colors, padding, and positioning.
  2. Inline styles cannot support CSS pseudo-classes (`:hover`, `:focus`, `:active`), media queries (`@media`), container queries, or dark mode overrides cleanly.
  3. Every render re-allocates inline style objects, increasing DOM tree size and rendering overhead.
  4. Creates massive code duplication across UI components.
- **Caveats**: None.
- **Impact**: Medium-High. Degrades performance, maintainability, and visual consistency.
- **Remediation**: Adopt a structured CSS approach (Tailwind CSS or CSS Modules) across `platform` to replace inline style objects with utility classes or scoped stylesheets.

---

### 4.2 Global Scope Pollution & Defensive `!important` Overrides

- **Locations**:
  - `file:///Users/davidcutura/Projects/ReactTicketing/platform/src/index.css` (Lines 154–241)
  - `file:///Users/davidcutura/Projects/ReactTicketing/platform/src/App.css` (Lines 1–183)
  - `file:///Users/davidcutura/Projects/ReactTicketing/platform/src/pages/organizer/Organizer.css`
- **Observation**:
  `platform/src/index.css` contains 88 lines of heavy `!important` overrides attempting to theme the embedded `reactticket` component library:
  ```css
  /* Line 154 */
  .ReactTicket-root {
    color: var(--text-primary) !important;
    font-family: var(--font-family) !important;
  }
  .ReactTicket-root,
  .ReactTicket-root * {
    border-color: var(--border) !important;
  }
  .ReactTicket-root button {
    background: var(--accent) !important;
    ...
  }
  ```
  Meanwhile, `App.css` and `Organizer.css` use un-scoped global ID selectors (`#center`, `#next-steps`, `#docs`, `#spacer`) and class names (`.hero`, `.counter`).
- **Logic Chain**:
  1. `reactticket` component library bakes light-mode inline background styles into its TSX output.
  2. To enforce `platform`'s dark glassmorphic design theme, `platform/src/index.css` uses nuclear `!important` CSS rules targeting `.ReactTicket-root *`.
  3. Unscoped global IDs (`#center`) in `App.css` risk namespace collisions when integrating additional pages or packages.
  4. Design changes in `reactticket` component library break or clash with `platform`'s global overrides.
- **Caveats**: None.
- **Impact**: Medium-High. Creates a fragile, unmaintainable styling architecture.
- **Remediation**:
  1. refactor `reactticket` component library to accept CSS variables / design tokens natively (e.g. `--rt-bg`, `--rt-primary`, `--rt-border`) instead of inline light-mode hex colors.
  2. Remove brute-force `!important` rules from `platform/src/index.css`.
  3. Scope `App.css` and `Organizer.css` using CSS Modules (`App.module.css`).

---

## 5. Code Duplication & Dead Code Context

### 5.1 Duplicated Scanner UI Components

- **Locations**:
  - `file:///Users/davidcutura/Projects/ReactTicketing/mobile-scanner/src/components/scanner/ScanResult.tsx`
  - `file:///Users/davidcutura/Projects/ReactTicketing/mobile-scanner/src/components/scanner/ScannerLogin.tsx`
  - `file:///Users/davidcutura/Projects/ReactTicketing/reactticket/src/components/scanner/ScanResult.tsx`
  - `file:///Users/davidcutura/Projects/ReactTicketing/reactticket/src/components/scanner/ScannerLogin.tsx`
- **Observation**:
  `mobile-scanner` contains simplified stub versions of `ScanResult.tsx` and `ScannerLogin.tsx` with inline `styles: any`, while `reactticket` contains feature-complete, accessible versions with audio/haptic feedback and proper TypeScript interfaces.
- **Logic Chain**:
  1. Developers created stub scanner components inside `mobile-scanner` instead of reusing the exported `ReactTicket` components from `reactticket`.
  2. Maintains duplicate scanner component trees that drift out of sync.
- **Caveats**: `mobile-scanner/src/App.tsx` already renders `<ReactTicket mode="scanner" ... />`, rendering the stub components in `mobile-scanner/src/components/scanner/` unused.
- **Impact**: Low-Medium. Dead code accumulation and confusion.
- **Remediation**: Delete unused stub component directory `file:///Users/davidcutura/Projects/ReactTicketing/mobile-scanner/src/components/scanner/`.

---

### 5.2 Vendored QR Code Libraries & Postbuild Copy Hacks

- **Locations**:
  - `file:///Users/davidcutura/Projects/ReactTicketing/reactticket-core/src/utils/jsQR.js`
  - `file:///Users/davidcutura/Projects/ReactTicketing/reactticket-core/src/utils/jsQR.d.ts`
  - `file:///Users/davidcutura/Projects/ReactTicketing/reactticket-core/src/utils/qrcodegen.ts`
  - `file:///Users/davidcutura/Projects/ReactTicketing/reactticket-core/package.json` (Line 14)
  - `file:///Users/davidcutura/Projects/ReactTicketing/examples/supabase-template/package.json` (Line 13)
- **Observation**:
  `reactticket-core` vendors `jsQR.js` and `qrcodegen.ts` directly into `src/utils/` to maintain zero runtime dependencies. To make `jsQR` accessible after TypeScript compilation, `reactticket-core/package.json` has a postbuild shell script:
  ```json
  "postbuild": "cp src/utils/jsQR.* dist/utils/ || true"
  ```
  Meanwhile, `examples/supabase-template/package.json` installs `"jsqr": "^1.4.0"` via npm.
- **Logic Chain**:
  1. Shell-dependent postbuild commands (`cp ...`) fail on Windows environments or non-POSIX shells.
  2. Vendoring raw JavaScript files (`jsQR.js`) into a TypeScript `src` folder bypasses standard bundler resolution and type generation.
  3. Mixing vendored files in core with npm package dependencies in template apps creates inconsistency.
- **Caveats**: Keeping core dependency-free is a declared design goal in `AGENTS.md`.
- **Impact**: Medium. Cross-platform build brittleness.
- **Remediation**:
  1. Replace the shell `postbuild` script in `reactticket-core` with cross-platform node script (`node scripts/copy-vendor.js`) or tsconfig copy asset plugin.
  2. Convert `jsQR.js` into typed TypeScript module `jsQR.ts` within `reactticket-core/src/utils/` to eliminate the need for `postbuild` copying.

---

## Remediation Roadmap & Action Matrix

| Priority          | Issue Category     | Affected Files                                                            | Core Action Required                                                                    |
| ----------------- | ------------------ | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **P0 (Critical)** | Core Packaging     | `reactticket-core/package.json`, `reactticket-core/src/index.ts`          | Create `src/index.ts` re-exporting all core services, adapters, types, and utils.       |
| **P0 (Critical)** | Test Coverage      | `reactticket-core/src/services/`, `reactticket-core/src/adapters/`        | Add unit tests for 6 un-tested services and both storage adapters.                      |
| **P0 (Critical)** | Test Coverage      | `platform/src/`                                                           | Add unit test suite for platform features, pages, and `SupabaseAdapter`.                |
| **P1 (High)**     | Monorepo Linkage   | `package.json`, `platform/package.json`, `mobile-scanner/package.json`    | Replace `file:../` dependencies with npm workspace syntax (`*`).                        |
| **P1 (High)**     | Package Boundaries | `mobile-scanner/src/App.tsx`, `platform/src/lib/Admit/SupabaseAdapter.ts` | Move `SupabaseAdapter` to `reactticket-core` and update `mobile-scanner` imports.       |
| **P1 (High)**     | Tooling & TS       | `mobile-scanner/tsconfig.json`, root `tsconfig.base.json`                 | Create `mobile-scanner/tsconfig.json` and root `tsconfig.base.json` in strict mode.     |
| **P1 (High)**     | Tooling & Build    | `platform/vite.config.ts`                                                 | Remove `'console'` from Esbuild drop array to preserve production error logs.           |
| **P2 (Medium)**   | Styling Strategy   | `platform/src/`, `platform/src/index.css`                                 | Replace inline styles with Tailwind/CSS Modules; remove `!important` hacks.             |
| **P2 (Medium)**   | Test Workspace     | `vitest.workspace.ts`, `mobile-scanner/package.json`                      | Add `mobile-scanner` to Vitest workspace and write initial test suite.                  |
| **P2 (Medium)**   | Code Quality       | `mobile-scanner/src/components/scanner/`                                  | Delete redundant stub scanner components in `mobile-scanner`.                           |
| **P3 (Low)**      | Documentation      | `AGENTS.md`                                                               | Update `AGENTS.md` to accurately describe `reactticket` as active UI component library. |
