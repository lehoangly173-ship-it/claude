# Decisions (stack and libraries the Builder may use)

- App: React Native + Expo (Expo Router), TypeScript, one codebase for iOS, Android, web.
- Backend: Supabase (Postgres, Auth, RLS, Storage, Edge Functions). One Supabase project per app; dev/staging separate from production.
- Login: Supabase Auth + Google sign-in (own config per app).
- Tests: Jest (unit), Playwright against Expo web (end-to-end).
- Errors: Sentry. Builds and previews: EAS.
- Add new libraries here only after the Orchestrator approves (date — library — why).
