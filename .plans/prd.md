# PRD: Custom Domain Migration & Password Gate (`password-gate`)

## Problem
The application is now connected to the custom domain `menu.melameds.net`, but it is publicly accessible without any access screen and still references the legacy `/menu-builder/` subpath in its build, manifest, and service worker configurations. The owner needs a simple global password screen with a 5-attempt lockout and a clean cutover from the old `/menu-builder/` URL to `menu.melameds.net`.

## User & Job-to-be-Done
- **User:** The site owner and authorized family/household users accessing `menu.melameds.net`.
- **Job-to-be-Done:** Unlock the menu generator once with a shared password, use all profiles freely, optionally lock the app when finished, and prevent unauthorized visitors from using the interface after 5 failed attempts.

## Success Metric
- 100% of unauthenticated visits to `menu.melameds.net` are blocked by the password gate until the valid password is submitted.
- At 5 consecutive failed password attempts, the form disables further attempts and displays `"Blocked out of website. Contact Admin"`.
- 0 broken asset/manifest/service-worker requests (`404`) when served from root `/` on `menu.melameds.net`.

## Non-Goals
- Server-side or edge-level authentication infrastructure (e.g., OAuth, database-backed user accounts, or external auth providers).
- Separate passwords per user profile inside the sidebar.
- Automated email/SMS password recovery flows.

## Acceptance Criteria
- **AC-1 (Password Gate Lock Screen):**
  - **Given** a visitor who has not unlocked the application,
  - **When** they open `menu.melameds.net`,
  - **Then** the main dashboard is hidden and only the password prompt screen is rendered.
- **AC-2 (Successful Unlock & Persistence):**
  - **Given** the visitor is on the password prompt screen and has fewer than 5 failed attempts,
  - **When** they submit the valid password,
  - **Then** the failed-attempt counter resets to `0`, the unlocked state is saved in browser storage, and the full Menu Builder dashboard is displayed.
- **AC-3 (Failed Attempts & 5-Try Lockout):**
  - **Given** the visitor enters an incorrect password,
  - **When** the failed attempt count reaches `5`,
  - **Then** the password input/submit controls are disabled, the lockout state persists across page reloads, and the exact message `"Blocked out of website. Contact Admin"` is displayed.
- **AC-4 (Manual Lock Button):**
  - **Given** the application is currently unlocked,
  - **When** the user clicks the `"Lock"` button in the application UI,
  - **Then** the unlocked session state is cleared and the UI immediately returns to the password prompt screen.
- **AC-5 (Custom Domain Cutover & Legacy URL Retirement):**
  - **Given** the production build deployed to GitHub Pages,
  - **When** deployed from `main`,
  - **Then** `public/CNAME` sets the domain to `menu.melameds.net` (causing GitHub Pages to redirect legacy `*.github.io/menu-builder` traffic) and `vite.config.ts`, `index.html`, `public/manifest.json`, and `public/sw.js` resolve all assets from `/` instead of `/menu-builder/`.

## Assumptions
- `[CONFIRMED]` A simple client-side password gate is used for the entire application.
- `[CONFIRMED]` All user profiles share the same single password.
- `[CONFIRMED]` After 5 failed attempts, the app displays `"Blocked out of website. Contact Admin"`.
- `[CONFIRMED]` A simple `"Lock"` button is included in the UI to re-lock the app.
- `[CONFIRMED]` The old `/menu-builder/` website path is retired in favor of `menu.melameds.net`.
- `[UNVERIFIED]` Unlocked session state and the 5-try lockout counter are stored in `localStorage` so neither is bypassed by simply refreshing the tab.
- `[UNVERIFIED]` To comply with Guardrail #1 in `00_router.md` (never commit plaintext credentials), the client verifies the password using a SHA-256 digest comparison (with optional `VITE_APP_PASSWORD_HASH` env override) rather than storing plaintext in source code.

## Kill Criteria
- Abandon the client-side gate if cryptographic protection of the static JSON food database itself is required prior to network download (which would require moving off static GitHub Pages or adding Cloudflare Access).

## Open Questions
- Confirm whether `localStorage` persistence for both the unlocked state and the 5-strike block is acceptable (so refreshing the page keeps the user logged in, and also keeps a blocked user blocked).
