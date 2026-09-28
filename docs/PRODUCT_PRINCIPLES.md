# Discern product principles

Status: Phase 1 foundation, distilled from `plan detailed.md` and `implementation phase compact.md`.

## Product definition

Discern answers: **“Does this title match the boundaries I chose for my family?”** It does not issue a universal verdict about whether a movie is Christian or suitable for every family. Families choose their own thresholds; Discern combines those preferences with structured observations about a title to produce a personalized match.

The core product is a structured entertainment-content intelligence database personalized to family boundaries. The application is the way families access that engine. Discern must own its report model, evidence, classifications, confidence, and correction history.

## Content and matching principles

- Record observable content and context. Do not store a global judgment such as `is_christian_safe = true` or `anti_christian = true`.
- Keep title observations separate from family preferences. The matching engine combines the two; a family’s preferences never change the underlying report.
- Start with these content categories: `sexual_content`, `nudity`, `language`, `violence`, `gore`, `fear_horror`, `occult_supernatural`, `drugs_alcohol_smoking`, `gambling`, `self_harm_suicide`, `religious_language`, and `mature_themes`.
- Do not create categories that judge identities, characters, or worldviews, including “LGBT content,” “non-Christian characters,” “bad worldview,” or “anti-Christian.” Describe actual content instead. For example, religious-language observations can record mockery and the degree of blasphemous language.
- Reports should distinguish severity, frequency, summary/details, spoiler status, and confidence. Unknown or unreviewed information must remain unknown; it must never be presented as “no issues.”
- Reports are Discern’s original work. Do not scrape or copy competitor reviews or datasets, including Common Sense Media, Plugged In, IMDb parental guides, or Movieguide.
- AI may assist with extracting evidence and preparing structured drafts. A human validates reports before publication. AI is not the truth source and must not make moral or religious suitability judgments.

## Family preferences and privacy

Families define boundaries using normalized per-profile preferences, initially `avoid`, `warn`, or `allow`, with room to add a 0–4 sensitivity scale later. Use age ranges rather than exact birthdays. Multiple family profiles may have different preferences and therefore different matches for the same title.

Collect only what the product needs: account UUID, locale, country, family age groups, content preferences, watchlists, and subscription state. Do not collect children’s real names, birth dates, photos, school, church, denomination, address, or location. A parent-provided label such as “7-year-old” is sufficient.

## Initial technical decisions

The source plan selects Expo SDK 57, React Native 0.86, strict TypeScript, Expo Router, React Hook Form, Zod, TanStack Query, Zustand, Expo SecureStore, Expo Image, Reanimated, and RevenueCat. Recheck the stable SDK version when project setup begins. Build a small custom design system; do not adopt Tamagui, React Native Paper, or a large component library.

Use one repository and one hosted Supabase project. The planned backend is PostgreSQL, Supabase Auth, Row Level Security (RLS), Edge Functions, Storage, database functions/RPC, scheduled jobs where needed, and `pg_trgm`/full-text search where useful. One hosted project does not mean unmanaged schema changes: changes go through repository migrations, and after real users exist schema changes are migrations only.

The mobile client uses Supabase’s publishable key and RLS-protected access. Provider credentials, service-role credentials, RevenueCat secret keys, webhook secrets, and AI keys stay server-side. Keep test users, sandbox purchases, test events, production users, and production purchases distinguishable within the one project.

## System boundaries and repository shape

The intended request path is the iOS Expo/React Native app to authenticated Supabase services (Auth, PostgreSQL, RLS, Edge Functions, and Storage). Metadata providers supply catalog metadata; RevenueCat manages subscriptions; Discern’s content engine supplies owned reports, classifications, evidence, and confidence.

Keep one repository organized around Expo Router screens (`app/`), feature modules and shared UI (`src/`), Supabase migrations/functions/seed data (`supabase/`), operational scripts (`scripts/`), and assets/docs. Planned features include auth, onboarding, search, titles, preferences, matching, watchlists, subscriptions, and feedback. Planned services include Supabase, RevenueCat, analytics, and media.

## Media provider boundary

Put catalog access behind a provider-neutral interface with search, movie metadata, and TV metadata operations. Application features call a media service such as `mediaService.getTitle()`; they do not call a vendor SDK directly. TMDB may be an initial implementation, but resolve commercial licensing before a public monetized release rather than assuming the public API terms cover it. This boundary must allow a licensed, alternate, or internal provider later.

## Product boundary

The initial product is for movies and TV series, with personalized matching, Discern-owned reports, multiple family profiles, requests and corrections, a watchlist, account linking, subscriptions, analytics, editorial tools, confidence, US regional ratings, privacy/account deletion, TestFlight, and App Store release. Games, books, streaming discovery/integrations, social features, browser extensions, Android, AI chat/advice, public contributor systems, and other listed expansions remain later product directions rather than Phase 1 commitments.

## Reference architecture

```text
Expo / React Native app
          │ authenticated requests
          ▼
Supabase: Auth · PostgreSQL · RLS · Edge Functions · Storage
          ├── metadata provider (behind media service)
          ├── RevenueCat subscriptions
          └── Discern-owned content engine
              reports · observations · evidence · confidence
```
