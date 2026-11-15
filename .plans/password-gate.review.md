# Chaos Review: `password-gate` (Round 1)

## Findings
- **[P1 - Resolved in Spec]** Corrupted `localStorage` state in `meal_planner_auth_v1` could throw during initial render or bypass `isBlocked` if `failedAttempts >= 5` is not re-derived on load. Mitigated by strict schema normalization in `getAuthState()`.
- **[P1 - Resolved in Spec]** Service worker cache key `menu-builder-v4` references `/menu-builder/` URLs that 404 on `menu.melameds.net`. Mitigated by bumping `CACHE_NAME` to `menu-builder-v5` and updating asset URLs to `/`.
- **[P2 - Resolved in Spec]** Mobile soft keyboards often auto-capitalize the first character (`Menu` vs `menu`) or add a trailing space, burning through the 5 allowed attempts. Mitigated by normalizing input with `.trim().toLowerCase()` before hashing.

## Status
All P0/P1 findings mitigated. State transitions to `hardened` -> `approved`.
