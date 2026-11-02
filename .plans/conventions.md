# Project Conventions (copy from master, edit per project)
Agents read this before planning and building. Anything decided here is not re-asked in /grill-me.
Lines marked EDIT are placeholders, not decisions. Fill them in yourself or let the Planner ask.
Where this file differs from a global file such as ~/.gemini/GEMINI.md, this file wins for this project.

## Stack
- Language / runtime: TypeScript ~6.0 (ES2022 modules, strict mode) running in the browser and built with Node.js / Vite 8
- UI (if any): React 19 + Tailwind CSS v4 + lucide-react
- Data store: Browser localStorage (for user profiles, day plans, and custom foods) + static foodItems.json (master food database)
- Package manager: npm (with package-lock.json). The README setup steps follow this.
- Dependencies: standard library first; ask before adding any new package.

## Layout
- `src/` application code; `tests/` tests; `.plans/` specs; `.env.example` lists variables with no values.

## Config & secrets
- Settings from environment variables or a `.env` file that is git-ignored. Never hardcode keys. Never print or log them.

## Logging & errors
- Browser/TS: structured `console.warn` / `console.error` with context (no silent empty `catch {}` blocks). Python scripts (if any): stdlib `logging` to a file with timestamp, level, traceback. No silent `except: pass`.
- Fail loudly with a clear message when input data is missing or malformed.

## Windows
- `pathlib` for all paths; no hardcoded absolute paths; PowerShell commands; quote paths with spaces.

## Data safety
- Tests use fixtures or temp copies. Never write to or delete the user's real data files in tests.

## Done means
- Validator PASS, README updated if CLI args / env vars / setup changed, no secrets in the diff.
