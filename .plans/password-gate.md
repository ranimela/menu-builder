# Implementation Specification: Custom Domain Migration & Password Gate (`password-gate`)

## Summary for Approval
- Adds a full-screen password gate (`src/components/PasswordGate.tsx` + `src/utils/auth.ts`) that requires the shared password before rendering the Menu Builder dashboard, remembers unlocked status in `localStorage`, and includes a `"Lock"` button in the top header.
- Enforces a 5-attempt lockout stored in `localStorage` that disables login inputs and displays `"Blocked out of website. Contact Admin"`.
- Migrates deployment paths from `/menu-builder/` to `/` and adds `public/CNAME` (`menu.melameds.net`) so GitHub Pages serves exclusively on `menu.melameds.net` and redirects the old URL.
- **Risk Note:** If a user enters the wrong password 5 times in a browser, they will remain blocked in that browser until `localStorage` (`meal_planner_auth_v1`) is cleared.

## Goal & Non-Goals
### Goal
- Gate access to `menu.melameds.net` behind a shared password with persistent unlock state, a manual `"Lock"` button, a 5-try lockout displaying `"Blocked out of website. Contact Admin"`, and root-path asset configuration for `menu.melameds.net`.

### Non-Goals
- Server-side or edge-level authentication infrastructure (e.g., OAuth, database-backed user accounts, or external auth providers).
- Separate passwords per user profile inside the sidebar.
- Automated email/SMS password recovery flows.

## Architectural Overview
1. **Authentication Utility (`src/utils/auth.ts`):**
   - Implements a deterministic, dependency-free synchronous SHA-256 hex digest (`sha256Hex`) so it works identically in browsers (HTTPS or HTTP) and Node.js unit tests without committing any plaintext password in the codebase.
   - Compares the SHA-256 digest of the user input against `EXPECTED_DIGEST_WORDS`.
   - Reads and writes `AuthState` in `localStorage` under key `meal_planner_auth_v1` with defensive `try/catch` fallbacks.
2. **UI Gate & Lock Action (`src/components/PasswordGate.tsx` & `src/App.tsx`):**
   - `App.tsx` initializes auth state via `getAuthState()`. When `isUnlocked` is `false` or `isBlocked` is `true`, `App.tsx` renders `<PasswordGate />` instead of the dashboard.
   - When unlocked, the top header in `App.tsx` renders a `"Lock"` button that calls `lockApp()` and returns the user to `<PasswordGate />`.
3. **Custom Domain Cutover (`public/CNAME`, `vite.config.ts`, `index.html`, `public/manifest.json`, `public/sw.js`):**
   - Adds `public/CNAME` with `menu.melameds.net` so every GitHub Actions build includes the `CNAME` in `./dist`.
   - Updates `base` in `vite.config.ts`, manifest/SW links in `index.html`, `start_url` in `public/manifest.json`, and cache paths in `public/sw.js` (`CACHE_NAME = 'menu-builder-v5'`) from `/menu-builder/` to `/`.

## Immutable Data Contracts
```typescript
export interface AuthState {
  isUnlocked: boolean;
  failedAttempts: number;
  isBlocked: boolean;
}

export const AUTH_STORAGE_KEY = 'meal_planner_auth_v1';
export const MAX_FAILED_ATTEMPTS = 5;
export const BLOCKED_MESSAGE = 'Blocked out of website. Contact Admin';
export const EXPECTED_DIGEST_WORDS: readonly number[] = [
  0x39899100, 0x9da1d251, 0x792eb353, 0xa0b7b185,
  0xbc83e71e, 0x12e489e7, 0x3228b554, 0xfc6cebc5,
];
```

## Affected Files
- `public/CNAME` (create)
- `vite.config.ts` (modify)
- `index.html` (modify)
- `public/manifest.json` (modify)
- `public/sw.js` (modify)
- `src/utils/auth.ts` (create)
- `src/components/PasswordGate.tsx` (create)
- `src/App.tsx` (modify)
- `tests/auth.test.ts` (create)

## Logging & Observability
- Browser/TS: use `console.warn` with context on `localStorage` read/write exceptions (`no silent empty catch {}`).
- Never log the submitted password string or raw credentials under any circumstances.

## Step-by-Step Micro-Tasks
1. **Task 1 (`public/CNAME`) [AC-5]:** Create `public/CNAME` containing `menu.melameds.net`.
2. **Task 2 (`vite.config.ts`) [AC-5]:** Update `base: '/menu-builder/'` to `base: '/'`.
3. **Task 3 (`index.html`) [AC-5]:** Update manifest href to `/manifest.json` and service worker registration to `/sw.js`.
4. **Task 4 (`public/manifest.json`) [AC-5]:** Update `"start_url"` from `"/menu-builder/"` to `"/"`.
5. **Task 5 (`public/sw.js`) [AC-5]:** Bump `CACHE_NAME` to `'menu-builder-v5'` and change cached asset paths from `/menu-builder/...` to `/`, `/index.html`, `/favicon.svg`, and `/manifest.json`.
6. **Task 6 (`src/utils/auth.ts`) [AC-1, AC-2, AC-3, AC-4]:** Implement `sha256Hex`, `verifyPassword`, `getAuthState`, `submitPasswordAttempt`, and `lockApp` adhering to the `AuthState` contract.
7. **Task 7 (`src/components/PasswordGate.tsx`) [AC-1, AC-2, AC-3]:** Implement the password prompt and 5-strike lockout UI (`"Blocked out of website. Contact Admin"`).
8. **Task 8 (`src/App.tsx`) [AC-1, AC-2, AC-3, AC-4]:** Gate the main view with `<PasswordGate />` when locked and add a `"Lock"` button to the header toolbar.
9. **Task 9 (`tests/auth.test.ts`) [AC-1, AC-2, AC-3, AC-4, AC-5]:** Add automated unit tests verifying password hashing, unlock persistence, 5-attempt lockout enforcement, manual locking, and custom domain configuration files.

## Acceptance Traceability
| AC ID | Description | Micro-Task(s) | Verification Method |
|---|---|---|---|
| AC-1 | Unauthenticated visits show only the password gate screen | 6, 7, 8, 9 | Unit test (`tests/auth.test.ts`) + build verification |
| AC-2 | Correct password unlocks app, resets counter, persists in `localStorage` | 6, 7, 8, 9 | Unit test (`tests/auth.test.ts`) |
| AC-3 | 5 failed attempts disable login and show `"Blocked out of website. Contact Admin"` | 6, 7, 8, 9 | Unit test (`tests/auth.test.ts`) |
| AC-4 | Clicking `"Lock"` clears unlocked state and returns to lock screen | 6, 8, 9 | Unit test (`tests/auth.test.ts`) |
| AC-5 | Custom domain `menu.melameds.net` `CNAME` and root `/` paths configured | 1, 2, 3, 4, 5, 9 | Unit test + `npm run build` checking `dist/CNAME` and `dist/index.html` |

## Verification Criteria
- `npm test` passes both `tests/solver.test.ts` and `tests/auth.test.ts`.
- `npm run lint` exits with `0` errors.
- `npm run build` exits with `0` errors, outputs `dist/CNAME` containing `menu.melameds.net`, and produces root `/` asset URLs in `dist/index.html`.
- `gitleaks` scan reports `0` leaks.

## Context Pruning
- Default files for the Builder to read: `src/App.tsx`, `vite.config.ts`, `index.html`, `public/manifest.json`, `public/sw.js`.


## Failure Modes & Mitigation
- **P1 — Corrupted or Malformed `localStorage` JSON (`meal_planner_auth_v1`):**
  - *Failure Injection:* Manual tampering or truncated JSON in `localStorage.getItem('meal_planner_auth_v1')`.
  - *Mitigation:* Wrap JSON parsing in `try/catch`, validate field types (`typeof parsed.failedAttempts === 'number'`, `typeof parsed.isUnlocked === 'boolean'`, `typeof parsed.isBlocked === 'boolean'`), and enforce `isBlocked = failedAttempts >= MAX_FAILED_ATTEMPTS || Boolean(parsed.isBlocked)`.
- **P1 — Stale Service Worker Caching `/menu-builder/` Paths:**
  - *Failure Injection:* Existing browsers with `menu-builder-v4` cached paths fail to fetch `/menu-builder/index.html` after custom domain cutover.
  - *Mitigation:* Bump `CACHE_NAME` to `'menu-builder-v5'` in `public/sw.js`, which purges old cache keys during the `activate` lifecycle event, and update all asset references to `/`.
- **P2 — Whitespace or Case Sensitivity on Password Entry:**
  - *Failure Injection:* Mobile keyboards auto-capitalizing the first letter or trailing spaces causing false lockouts.
  - *Mitigation:* Normalize password input via `.trim().toLowerCase()` before computing the SHA-256 hash.
