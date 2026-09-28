# Discern

Discern helps families compare structured entertainment-content observations with the boundaries they choose.

## Local development

```sh
npm install
npm start
```

The app uses Expo SDK 57 and React Native 0.86.3. Copy `.env.example` to `.env` and fill in only the Supabase URL, Supabase publishable key, and RevenueCat public iOS SDK key when those services are configured. Never place service-role, provider, webhook, or other secret keys in `EXPO_PUBLIC_*` variables.

This workspace currently contains the Phase 2 design preview. Authentication, catalog search, and report data are added in later phases.

## Commands

- `npm run lint` — lint the project.
- `npm run typecheck` — run strict TypeScript checking.
- `npm run format` — format source and configuration files with Prettier.

## Supabase

Local Supabase project configuration lives in `supabase/`. Database changes belong in migrations. Development, preview, and production EAS build profiles will use the same hosted Supabase project, with test users and sandbox activity clearly marked.
