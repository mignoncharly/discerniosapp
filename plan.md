# Discern — 10-phase delivery plan

This is the execution roadmap condensed into ten phases. It reorganizes the full specification without superseding it: detailed schemas, examples, architecture diagrams, implementation notes, and future ideas remain in [`plan detailed.md`](</C:/discern/plan detailed.md>) and should be treated as the exhaustive reference. The shorter source roadmap is [`implementation phase compact.md`](</C:/discern/implementation phase compact.md>). Keep [`HANDOFF.md`](</C:/discern/HANDOFF.md>) current with completed work, checks, blockers, and the exact next action.

## Phase 1 — Define Discern and its non-negotiable principles

Define Discern as a personalized family-boundary decision engine: explain content against each family’s own preferences rather than issue universal “Christian-safe” judgments, moral verdicts, or subjective worldview labels. Keep objective, structured observations separate from preferences. Use the 12 canonical categories: `sexual_content`, `nudity`, `language`, `violence`, `gore`, `fear_horror`, `occult_supernatural`, `drugs_alcohol_smoking`, `gambling`, `self_harm_suicide`, `religious_language`, and `mature_themes`.

Reports must be Discern-owned, original, evidence-backed, confidence-aware, human-validated, reviewable, and explicit when information is unknown. “Not reviewed yet” / “Not enough information yet” must never become “no issues.” AI can extract evidence and draft reports; it is never a source of truth, a moral judge, or a provider of spiritual advice. Avoid copying competitor reviews. Maintain the stated 1.0 exclusions and only add them through a later explicit product expansion.

Confirm the planned stack and architecture before extending them: one Expo/React Native TypeScript app and repository; one hosted Supabase project; provider abstractions for media metadata; Discern-owned reports and editorial workflows as the core product asset.

## Phase 2 — Establish the repository, app foundation, and design system

Use stable Expo SDK 57 with React Native 0.86, strict TypeScript, Expo Router, and the supporting libraries specified in the detailed plan. Configure aliases, environment validation, lint/format, GitHub, EAS, and build profiles. Build a small custom design system with tokens and reusable components. Support light/dark appearance, safe areas, dynamic text, VoiceOver/accessibility labels and roles, and reduced motion; do not add motion without a product need.

Use one repository with clear app, feature, component, service, state, theme, Supabase migration/function, and documentation boundaries. Keep public publishable credentials on-device only; all provider, service-role, webhook, RevenueCat, and AI secrets remain server-side. Database changes are migrations only. Build development, preview, and production as EAS build profiles that all target the same production Supabase project, not separate databases.

## Phase 3 — Start anonymously and save family boundaries

On first launch, create or resume a Supabase anonymous authenticated user; do not require account creation before families see value. Build approximately five onboarding screens: value proposition; age range; category choices on screens 3–4; an example of personalization and a “Search something” next step. Age ranges are Under 6, 6–8, 9–11, 12–14, 15–17, and Adults. Do not request exact birthdays or child names.

Normalize `family_profiles` and `family_preferences`; do not store all choices in one large JSON column. Profiles carry owner, name, age group, default marker, and timestamps. Preferences reference a category and carry `avoid`, `warn`, or `allow`, with room to add sensitivity 0–4 later. Keep only necessary family/account data. Let families configure and search anonymously, then support later Sign in with Apple/email account linking that preserves the anonymous account.

## Phase 4 — Build the provider-independent media catalog and search

Define a media-provider interface for movie/TV search and metadata lookup. Search Discern’s local catalog first; when coverage is insufficient, call a provider behind the service abstraction, normalize and cache the result, then return it. Start with the planned TMDB implementation while preserving the ability to replace it with Watchmode, another licensed provider, or an internal provider. Resolve TMDB commercial licensing before monetized public release.

Support movies and TV, external IDs, localized titles, regional release dates and ratings, and US regional ratings in 1.0. Start English-first but design localization architecture. Cache useful search/catalog data for offline or poor-connectivity use. Track searches, requests, and coverage so real demand drives catalog and editorial priorities; never imply a metadata provider’s rating is a Discern report.

## Phase 5 — Build trustworthy reports, evidence, and editorial operations

Create normalized media-title, external-ID, release-region, report, report-category, source/provenance, review/version, and correction records as detailed in the source spec. Reports need status (draft, review, published, needs review, archived), category severity and frequency, summaries, spoiler flags, confidence per category and overall, provenance/sources, version/review history, and corrections. Represent “unknown” explicitly.

Build an internal editorial dashboard and ingestion/review workflow for report drafting, evidence validation, review, publication, provenance, and corrections. Seed about 500 genuinely good high-demand titles: 100 current movies, 100 current TV shows, 100 family titles, 100 teen/pop-culture titles, and 100 evergreen titles. Prioritize toward 90% coverage of actual user searches—not 90% of IMDb—using search demand and title requests. Reports remain original and human-validated; AI assists extraction/drafting only.

## Phase 6 — Evaluate preferences and deliver useful app experiences

Implement a deterministic matching engine; do not use AI for matching. Evaluate each report against the selected family profile’s preferences and category severity, frequency, and confidence. Preserve distinct conflict, warning, compatible/clear, and unknown outcomes; for example avoid + severity 4 is a conflict, warn + severity 2 is a warning, and unknown report data remains unknown. Test allow behavior according to the detailed policy. Missing or low-confidence data is never a clean bill of health.

Build home, search results, and title details with personalized outcomes and clear category-level explanations, evidence, confidence, and spoilers. Allow title/report requests, correction submissions, a simple watchlist, and profile switching. Multiple family profiles must be able to get different results for the same title. Use the chosen neutral language: explain “what’s there” and let a family decide what matters.

## Phase 7 — Add subscriptions, premium access, and product intelligence

Integrate RevenueCat identity and subscription synchronization, including anonymous-to-permanent identity continuity, sandbox testing, restore purchases, and a paywall that demonstrates ongoing value. Premium value may include unlimited personalized checks, full category details, multiple profiles, watchlists, new-title alerts, and history. Protect premium report details with server-side authorization; hiding data in the client is insufficient. Handle RevenueCat webhooks through trusted backend functions.

Instrument onboarding, search, result, request, correction, watchlist, subscription, and other specified product events. Use search demand as editorial intelligence (`search_events`, report coverage × searches, and request volume). Exclude raw sensitive family preference details from third-party analytics. Distinguish test analytics from production activity.

## Phase 8 — Secure and operate the service responsibly

Enable RLS on every user-specific table and scope access to `auth.uid()`. Restrict canonical content writes to service-role or authorized admin/editor workflows. Route privileged actions through Supabase Edge Functions/database functions as appropriate. Keep service-role, metadata-provider, RevenueCat, webhook, and AI secrets off-device. Apply rate limits and CAPTCHA where abuse risk warrants them.

Minimize personal data; do not collect children’s names, exact birthdays, address, church, or denomination. Support data export and account deletion before App Store release. Keep one production database (no staging database): mark internal/test users with `is_test_user = true`, mark purchases as RevenueCat sandbox and analytics with `is_test = true`, filter test users from production metrics/queries, and periodically clean test-owned watchlists, requests, and events. Canonical media records need not be duplicated for tests. Cache for useful offline operation while showing content/report freshness and unknown state honestly.

## Phase 9 — Verify, prepare, and ship Discern 1.0

Build high-coverage unit tests for matching, preference evaluation, severity, formatting, and schema validation; integration tests for Supabase auth and anonymous upgrades, search Edge Functions, RLS, premium authorization, RevenueCat webhooks, and account deletion; and Maestro end-to-end flows for fresh install, onboarding, search, title details, boundary changes and changed results, saving a title, missing-report request, sign-in, purchase, restore, and deletion.

All EAS development/preview/production profiles use the same Supabase project. Finish privacy/legal work, subscriptions, screenshots, privacy answers, age rating, and App Store review instructions; test RevenueCat sandbox; deliver TestFlight and production App Store release. 1.0 includes premium visual design, anonymous onboarding, family boundaries, movies and TV, search, personalized matching, detailed categories, Discern-owned reports, multiple profiles, title requests, corrections, watchlist, Apple and email authentication, RevenueCat subscriptions, analytics, admin editorial dashboard, confidence, US regional ratings, account deletion, privacy/legal, TestFlight, and App Store release.

Keep these explicitly out of 1.0: games; books; YouTube channel or video analysis; browser/Safari extensions; parental-control VPN or automatic screen blocking; Netflix/streaming-service integration; social network, comments, public ratings, or public contributor system; Christian-movie recommendations; church or homeschool accounts; Android; AI chatbot; and AI spiritual advice.

## Phase 10 — Expand coverage after launch without changing the core model

Use post-launch data for the planned sequence: 1.1 recently released content alerts (such as a newly reviewed TV season); 1.2 streaming discovery across services; 1.3 games; 1.4 books; then Version 2 “What can my family watch?” discovery across services using profiles, preferences, reports, and profile/runtime/genre/content filters. New media types reuse the shared report, preference, profile, and subscription model.

Grow the long-term data advantage through real search demand, structured original reports, category annotations, regional differences, correction history, confidence, and family preference modeling. Keep all excluded 1.0 features excluded unless a later product expansion explicitly brings them in.

## Carry-forward decisions and traceability

- Product principles, complete table fields and relationships, example content report, severity/matching details, analytics event specifics, privacy, migration architecture, app screen requirements, monetization rules, App Store scope, and future expansion details remain in `plan detailed.md`; consult its matching section before implementing a subsystem.
- Keep provider APIs behind interfaces. Resolve commercial metadata licensing before monetized release.
- Unknown means unknown; content reports are Discern-owned, evidence-backed, confidence-aware, and human-validated. AI never makes moral judgments.
- Preferences are family-specific, normalized, and separate from objective observations. Minimize personal data and protect every user-owned row with RLS.
- Preserve one repository and one production Supabase database. Make schema changes only through migrations; keep secrets server-side.

## Current execution status

Phase 1 and Phase 2 are complete. Phase 3 is implemented locally, including the anonymous-first auth provider, five-screen onboarding, normalized preference migration, and atomic onboarding RPC. The hosted migration and hosted anonymous-auth setting are pending because the current Supabase CLI account received HTTP 403 for the linked DB dry-run and the in-app browser was unavailable. See [`HANDOFF.md`](</C:/discern/HANDOFF.md>) for validation results and exact resume steps. Do not start Phase 4 deployment work until Phase 3’s hosted setup and app smoke check are complete.
