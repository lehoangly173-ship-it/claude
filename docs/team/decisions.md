# Decisions (stack and libraries the team may use) — read the HOME SPA section first

## HOME SPA (this repo) — current stack, use this
- App in `homespa/`: React 18 + Vite 5 + TypeScript (strict), built to ONE file `homespa/dist/index.html` (vite-plugin-singlefile). Libraries = those in homespa/package.json + the approved list below.
- No backend yet: demo data in `homespa/src/data.ts` + `store.tsx`. Planner: no Supabase tables, login or RLS until Ly asks to connect a backend. Label sample numbers "số liệu mẫu"; not connected → "Chưa nối".
- UI states: with demo data, "loading" and "offline" are N/A; "empty" and "no-permission" (role) still apply.
- Text: existing screens have Vietnamese text inline — reviewer must not flag old text. NEW text goes in one shared file `homespa/src/i18n.ts` (create on first need). Refactor old screens only if Ly asks.
- Tests: unit tests with Vitest for logic (logic.ts, store.tsx) — approved (devDependency `vitest`; builder adds it once, the guard will still ask Ly to confirm). UI behaviour is proven by Playwright tests in `homespa/e2e/` (QA). Reviewer accepts either a unit test or a planned e2e test in docs/team/test-plan.md as proof; pure-text/style changes in lane S need no test.
- Checks: `scripts/team/check.sh` = typecheck + unit tests (if Vitest set up) + vite build to a temp folder.
- Preview (team): in an Expo sandbox (account `hayquen`, project `@hayquen/homespa`): `git clone --depth 1 -b develop https://github.com/lehoangly173-ship-it/claude.git repo` → `cd repo/homespa && npm ci && npx vite build` → copy `dist/index.html` into the deploy folder with app.json from homespa/HANDOFF.md → `npx eas-cli deploy --export-dir dist --alias team --non-interactive` → https://homespa--team.expo.app. Never use `--alias flow` (the live version Ly shows staff) for team previews; `flow` is updated only after release and only if Ly asks.
- `homespa/dist/` is committed only by the Release step (release bundle), never in team/* branches.
- Release checklist while there is no backend: "every table has RLS" and "privacy policy and terms" = N/A.
- Versions: saved as branches `ban-N` (table in homespa/HANDOFF.md). No tags (the proxy blocks them).
- Later (only when Ly asks): move to Expo + Supabase per the default below.

## Default for new apps
- App: React Native + Expo (Expo Router), TypeScript, one codebase for iOS, Android, web.
- Backend: Supabase (Postgres, Auth, RLS, Storage, Edge Functions). One Supabase project per app; dev/staging separate from production.
- Login: Supabase Auth + Google sign-in (own config per app).
- Tests: Jest or Vitest (unit), Playwright against the web build (end-to-end).
- Errors: Sentry. Builds and previews: EAS.

## Approved additions (date — library — why)
- 2026-10-09 — vitest (dev only) — unit tests for HOME SPA logic; runs on Vite, no extra config.
