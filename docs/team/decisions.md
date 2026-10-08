# Decisions (stack and libraries the Builder may use)

## HOME SPA (this repo) — current stack, use this
- App in `homespa/`: React 18 + Vite 5 + TypeScript (strict), built to ONE file `homespa/dist/index.html` (vite-plugin-singlefile). Libraries = those already in homespa/package.json.
- No backend yet: data is demo/sample in `homespa/src/data.ts` + `store.tsx`. Label sample numbers "số liệu mẫu"; not connected → "Chưa nối".
- Text: existing screens have Vietnamese text inline. New text goes in one shared text file (create `homespa/src/i18n.ts` on first need); do not refactor old screens just for i18n unless asked.
- Checks: `scripts/team/check.sh` = typecheck + vite build. Builder adds Jest only when logic tests are needed (ask first: new dependency).
- Preview: `scripts/team/preview.sh` builds dist; deploy to https://homespa--flow.expo.app per homespa/HANDOFF.md only after Ly agrees. Do not commit `homespa/dist/` in team/* branches (rebuild at release).
- Later (only when Ly asks): move to Expo + Supabase per the default below.

## Default for new apps
- App: React Native + Expo (Expo Router), TypeScript, one codebase for iOS, Android, web.
- Backend: Supabase (Postgres, Auth, RLS, Storage, Edge Functions). One Supabase project per app; dev/staging separate from production.
- Login: Supabase Auth + Google sign-in (own config per app).
- Tests: Jest (unit), Playwright against the web build (end-to-end).
- Errors: Sentry. Builds and previews: EAS.

Add new libraries here only after the Orchestrator approves (date — library — why).
