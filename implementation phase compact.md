One important technical choice first: as of September 28, 2026, **Expo SDK 57 is the current stable release** and SDK 58 is still beta. I would start Discern on SDK 57, not the beta. SDK 57 uses React Native 0.86. :chatgpt-content-reference{index="1"}

# Discern: 10-phase delivery plan

This is the execution roadmap condensed into ten phases. The detailed specifications, schemas, examples, safeguards, and later-version ideas below are retained as the supporting plan; this roadmap groups them without dropping those details.

## Phase 1 — Define the product and its principles

Define Discern as a personalized family-boundary decision engine, not a universal “Christian-safe” rating. Establish the objective content taxonomy, avoid subjective labels, and keep family preferences separate from structured observations. Confirm the initial stack (Expo SDK 57 / React Native 0.86 / strict TypeScript, Expo Router, Supabase, and the listed supporting libraries), one-repository architecture, system boundaries, and provider abstraction. Keep Discern-owned reports and evidence as the core product asset.

## Phase 2 — Build the technical and design foundation

Create the Expo project and repository, pin the stable SDK, configure strict TypeScript, Router, linting, formatting, aliases, environment validation, GitHub, and EAS. Establish the small custom design system, tokens, reusable primitives, and support for dark mode, dynamic text, VoiceOver, safe areas, and reduced motion. Create the single hosted Supabase project and establish migrations as the only schema-change path, with Auth, RLS, Edge Functions, Storage, database functions, and scheduled jobs as needed. Use client publishable credentials and keep secrets server-side.

## Phase 3 — Onboard families and save their boundaries

Start with an anonymous Supabase identity so a family can configure boundaries and search before being asked to sign in. Build the approximately five-screen onboarding, age ranges without exact birthdays, example personalization, and normalized family-profile/preference data with avoid/warn/allow choices (extensible to sensitivity 0–4). Support later Apple/email account linking while preserving the anonymous account. Store only necessary family and account data.

## Phase 4 — Create the catalog and reliable search

Build the provider-independent media catalog and search flow: search Discern’s local catalog first, call the metadata provider when coverage is insufficient, normalize and cache results, then return them. Keep provider calls behind the media service, evaluate TMDB’s commercial licensing before monetized public release, and support movies, TV, external IDs, regional release/rating data, English-first localization architecture, and useful offline caching. Track searches to guide the catalog and review queue.

## Phase 5 — Produce trustworthy content reports

Build the report schema and editorial workflow, including report status, category severity and frequency, summaries, spoiler flags, confidence, review/version history, provenance, sources, and corrections. Seed approximately 500 high-demand titles across current movies, current TV, family, teen/pop-culture, and evergreen titles; use actual search demand and a goal of covering 90% of user searches to prioritize expansion. Reports must be original, evidence-backed, human-validated, and explicit when information is unknown. AI may extract evidence into drafts but never supplies truth or moral judgments.

## Phase 6 — Deliver personalized decisions in the app

Implement the deterministic matching engine and test its avoid/warn/allow and unknown-data behavior. Build the home, search-results, and title-detail experiences around clear personalized outcomes and content-category details. Let users request missing titles or reports, submit corrections, use a simple watchlist, and switch among multiple family profiles so one title can produce different results for each profile. Never imply that missing data means no issues.

## Phase 7 — Add editorial operations, subscriptions, and product analytics

Provide the internal admin/editor dashboard for report creation, review, publication, provenance, and corrections. Add RevenueCat identity and subscription synchronization, sandbox testing, a paywall with ongoing value, and server-side authorization for premium report details; do not rely on hiding premium data in the client. Instrument the listed product events and search-demand intelligence while excluding raw sensitive preference details from third-party analytics.

## Phase 8 — Protect users, data, and service integrity

Apply RLS to every user-specific table; restrict canonical content edits to service-role, admin, or editor workflows. Keep service-role, provider, RevenueCat, webhook, and AI secrets off-device and route privileged actions through Edge Functions. Minimize personal data, support data export and account deletion before App Store release, and plan rate limits/CAPTCHA for abuse-prone actions. Use one production database with clearly marked test users, sandbox purchases, test analytics, filtered queries, and cleanup of test-owned records.

## Phase 9 — Verify and ship Discern 1.0

Build unit coverage for matching, preference evaluation, severity, formatting, and schemas; integration coverage for auth, anonymous upgrades, search functions, RLS, premium authorization, RevenueCat webhooks, and deletion; and Maestro end-to-end flows from onboarding through purchase, restore, and deletion. Configure EAS development, preview, and production build profiles that all target the same Supabase project. Complete privacy/legal and App Store materials, subscriptions, screenshots, privacy answers, age rating, and review instructions; test RevenueCat sandbox; then deliver TestFlight and the production App Store release with the specified 1.0 scope.

## Phase 10 — Expand the decision engine and its coverage

Use post-launch data for the planned sequence: 1.1 recently released content alerts; 1.2 streaming discovery; 1.3 games; 1.4 books; and Version 2 family-compatible discovery across services with profile, runtime, genre, and content filters. Preserve the shared report, preference, profile, and subscription model as new media types are added. Grow the long-term data advantage through search demand, structured reports, category annotations, regional differences, correction history, and family preference modeling. Keep the stated out-of-scope 1.0 features excluded unless a later product expansion explicitly brings them in.