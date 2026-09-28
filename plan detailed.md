One important technical choice first: as of September 28, 2026, **Expo SDK 57 is the current stable release** and SDK 58 is still beta. I would start Discern on SDK 57, not the beta. SDK 57 uses React Native 0.86. :chatgpt-content-reference{index="1"}

---

# 1. Product definition

Discern is not:

> "Is this movie Christian?"

It is:

> **"Does this movie match the boundaries I chose for my family?"**

That distinction needs to exist all the way down into the database architecture.

We will never store:

```text
is_christian_safe = true
```

Instead we store objective-ish structured observations such as:

```text
sexual_content.severity = 1
violence.severity = 3
occult_supernatural.severity = 4
language.severity = 2
substance_use.severity = 1
```

The family defines its own thresholds.

Discern then computes:

```text
TITLE DATA
      +
FAMILY PREFERENCES
      ↓
PERSONALIZED MATCH
```

This is the core engine and moat.

---

# 2. Initial technology stack

## Mobile

**Expo SDK 57**
**React Native 0.86**
**TypeScript strict mode**
**Expo Router**
**React Hook Form**
**Zod**
**TanStack Query**
**Zustand**
**Expo SecureStore**
**Expo Image**
**Reanimated**
**RevenueCat**

Expo Router remains Expo's recommended file-based navigation approach. :chatgpt-content-reference{index="2"}

I would avoid large UI frameworks.

No Tamagui.

No React Native Paper.

No huge component library.

We build our own small design system.

That gives you much more control over making the application feel premium rather than "template React Native."

---

# 3. Backend

Use:

**Supabase**

Specifically:

- PostgreSQL
- Supabase Auth
- Row Level Security
- Edge Functions
- Storage
- scheduled jobs where required
- database functions/RPC
- pg_trgm/full-text search where useful

And yes:

## ONE Supabase hosted project.

Something like:

```text
discern-production
```

No:

```text
discern-dev
discern-staging
discern-production
```

You don't need that overhead now.

We test against the same database.

But we distinguish:

```text
test users
sandbox purchases
test events
production users
production purchases
```

inside the system.

---

# 4. Important rule about the production database

One database does **not** mean careless database management.

Everything still goes through migrations.

Repository:

```text
supabase/
    migrations/
        202609280001_initial_schema.sql
        202609280002_rls.sql
        202609280003_media.sql
        202609280004_family_profiles.sql
        ...
```

Never reach the point where we don't know why a table exists because Codex manually changed Supabase six weeks earlier.

Once real users exist:

**schema changes are migrations only.**

---

# 5. Overall system architecture

```text
                        ┌───────────────────────┐
                        │      iOS App          │
                        │ Expo / React Native   │
                        └──────────┬────────────┘
                                   │
                       authenticated requests
                                   │
                  ┌────────────────▼─────────────┐
                  │          Supabase            │
                  │                              │
                  │ Auth                         │
                  │ PostgreSQL                   │
                  │ RLS                          │
                  │ Edge Functions               │
                  │ Storage                      │
                  └─────┬──────────┬─────────────┘
                        │          │
                  ┌─────▼────┐ ┌───▼─────────────┐
                  │ Metadata │ │   RevenueCat    │
                  │ Provider │ │ subscriptions   │
                  └──────────┘ └─────────────────┘

                           │
                           ▼
                  ┌─────────────────┐
                  │ Content Engine  │
                  │                 │
                  │ Discern-owned   │
                  │ reports         │
                  │ classifications │
                  │ evidence        │
                  │ confidence      │
                  └─────────────────┘
```

---

# 6. Repository structure

I'd keep this as **one repository**.

```text
discern/
│
├── app/
│   ├── _layout.tsx
│
│   ├── (onboarding)/
│   ├── (tabs)/
│   ├── title/
│   ├── settings/
│   ├── subscription/
│   └── admin/
│
├── src/
│   ├── components/
│   ├── features/
│   │   ├── auth/
│   │   ├── onboarding/
│   │   ├── search/
│   │   ├── titles/
│   │   ├── preferences/
│   │   ├── matching/
│   │   ├── watchlist/
│   │   ├── subscription/
│   │   └── feedback/
│   │
│   ├── services/
│   │   ├── supabase/
│   │   ├── revenuecat/
│   │   ├── analytics/
│   │   └── media/
│   │
│   ├── hooks/
│   ├── stores/
│   ├── schemas/
│   ├── types/
│   ├── constants/
│   ├── theme/
│   └── utils/
│
├── supabase/
│   ├── migrations/
│   ├── functions/
│   │   ├── media-search/
│   │   ├── media-details/
│   │   ├── report-details/
│   │   ├── subscription-webhook/
│   │   └── account-delete/
│   └── seed/
│
├── scripts/
│   ├── import-titles.ts
│   ├── verify-reports.ts
│   └── cleanup-test-users.ts
│
├── assets/
├── docs/
├── app.config.ts
├── eas.json
├── package.json
└── tsconfig.json
```

---

# PHASE 0 — Product rules before programming

This takes priority because otherwise the database will encode bad assumptions.

Define the content taxonomy.

Initial categories:

```text
sexual_content
nudity
language
violence
gore
fear_horror
occult_supernatural
drugs_alcohol_smoking
gambling
self_harm_suicide
religious_language
mature_themes
```

I would **not** create categories such as:

```text
LGBT content
non-Christian characters
bad worldview
anti-Christian
```

Those become subjective very quickly.

Instead Discern describes actual content and lets parents decide.

For example:

```text
religious_language:
    contains_mockery: true
    blasphemous_language: moderate
```

instead of:

```text
anti_christian = true
```

---

# PHASE 1 — Project foundation

Create:

```bash
npx create-expo-app@latest discern
```

Pin stable Expo 57.

Do not start on SDK 58 beta. :chatgpt-content-reference{index="3"}

Configure:

```text
TypeScript strict
Expo Router
ESLint
Prettier
path aliases
environment validation
EAS
GitHub
```

Environments:

```text
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
EXPO_PUBLIC_REVENUECAT_IOS_KEY
```

Secrets such as metadata provider API keys never go into:

```text
EXPO_PUBLIC_*
```

They stay server-side.

---

# PHASE 2 — Design system

Before creating 30 screens, create primitives.

```text
<AppScreen>
<AppText>
<Button>
<IconButton>
<Card>
<Badge>
<Divider>
<Input>
<SearchInput>
<Sheet>
<Modal>
<Skeleton>
<Poster>
<ContentIndicator>
<SeverityMeter>
<MatchBadge>
```

Design tokens:

```typescript
spacing
radius
fontSize
fontWeight
shadow
surface
background
textPrimary
textSecondary
warning
danger
success
```

Support immediately:

```text
dark mode
dynamic text
VoiceOver
safe areas
reduced motion
```

We don't postpone accessibility until phase 14.

---

# PHASE 3 — Supabase foundation

Create one production Supabase project.

Enable:

```text
Auth
RLS
Edge Functions
Storage
```

Use the **publishable key** in the application, with RLS protecting data. Supabase's current Expo guidance explicitly recommends RLS and publishable client credentials for this architecture. :chatgpt-content-reference{index="4"}

---

# 7. Initial database architecture

Core tables:

```text
profiles

family_profiles
family_preferences

media_titles
media_external_ids
media_release_regions

content_categories
content_reports
content_report_items
content_report_sources
content_report_revisions

watchlists
watchlist_items

title_requests
report_corrections

subscriptions
subscription_events

search_events
title_view_events

admins
audit_logs
```

---

# 8. `profiles`

```sql
profiles
--------
id uuid PK -> auth.users
display_name text
locale text
country_code text
onboarding_completed boolean
is_test_user boolean
created_at timestamptz
updated_at timestamptz
```

Do not store unnecessary personal data.

We don't need:

```text
child names
birth dates
address
church
denomination
```

---

# PHASE 4 — Anonymous-first onboarding

This is important.

I don't want:

```text
WELCOME TO DISCERN

Create account
Email
Password
Confirm password
Accept
```

before the user sees anything.

Supabase supports anonymous authenticated users and later conversion to permanent identities. :chatgpt-content-reference{index="5"}

So:

```text
Install
   ↓
Anonymous Supabase account
   ↓
Configure boundaries
   ↓
Search movie
   ↓
See personalized result
   ↓
Later:
"Save your family settings"
   ↓
Sign in with Apple / email
```

This dramatically improves first-run experience.

---

# 9. Onboarding

Approximately 5 screens.

### Screen 1

> Find out whether entertainment fits your family.

### Screen 2

Children age ranges:

```text
Under 6
6–8
9–11
12–14
15–17
Adults
```

Do not require exact birthdays.

### Screen 3–4

Set boundaries.

Example:

**Violence**

```text
● Avoid
○ Warn me
○ Okay
```

**Occult / supernatural**

```text
● Avoid
○ Warn me
○ Okay
```

etc.

### Screen 5

Example personalization.

> Based on your choices, Discern will highlight what matters to your family.

Then:

**Search something**

---

# 10. Family preference schema

Don't hardcode this into a giant JSON blob.

Use normalized data.

```text
family_profiles
---------------
id
user_id
name
age_group
is_default
created_at


family_preferences
------------------
id
family_profile_id
category_id
preference

preference:
avoid
warn
allow
```

Later we could support:

```text
sensitivity 0-4
```

without schema destruction.

---

# PHASE 5 — Media catalog

This requires careful architecture.

Do **not** build Discern around a vendor-specific movie API.

Create an abstraction:

```typescript
interface MediaProvider {
  search(query: string): Promise<MediaSearchResult[]>
  getMovie(id: string): Promise<MovieMetadata>
  getTvShow(id: string): Promise<TvMetadata>
}
```

Today implementation might be:

```text
TmdbMediaProvider
```

Tomorrow:

```text
WatchmodeProvider
LicensedProvider
InternalProvider
```

Discern doesn't care.

---

# 11. Important TMDB issue

TMDB is useful technically:

- titles
- poster art
- release date
- cast
- genres
- external IDs

But TMDB explicitly has a separate commercial service/contact process. :chatgpt-content-reference{index="6"}

Since Discern is intended to become commercial, before public monetized release I would resolve commercial usage/licensing rather than simply assume the public API license covers everything.

Therefore:

**Provider abstraction from day one.**

No:

```typescript
tmdb.getMovie()
```

scattered across 70 components.

Everything goes through:

```typescript
mediaService.getTitle()
```

---

# PHASE 6 — Search architecture

Search sequence:

```text
User types "Wednesday"

        ↓

Search local Discern database

        ↓

Enough results?
   ↙            ↘
 YES              NO

return       call metadata provider
                 ↓
             normalize
                 ↓
            cache title
                 ↓
             return
```

Benefits:

- faster popular searches
- lower API usage
- resilience
- provider can later change

---

# 12. `media_titles`

Example:

```text
id UUID

media_type
    movie
    tv

title
original_title
overview
poster_path
backdrop_path

release_date
release_year

original_language

runtime_minutes

metadata_provider
metadata_provider_id

metadata_updated_at
created_at
updated_at
```

Unique:

```text
(metadata_provider, metadata_provider_id)
```

---

# PHASE 7 — Build the actual Discern dataset

This is arguably more important than the application code.

A title receives a:

```text
content_report
```

A report has:

```text
report status

draft
reviewing
published
needs_review
archived
```

---

# 13. Content reports

```text
content_reports
---------------
id
media_title_id
status
confidence_score
spoiler_level
reviewed_at
reviewed_by
version
created_at
updated_at
```

And then:

```text
content_report_items
--------------------
id
content_report_id
category_id

severity
frequency

summary
details
confidence

contains_spoilers

created_at
updated_at
```

Severity:

```text
0 = none
1 = mild
2 = moderate
3 = strong
4 = extreme
```

Frequency:

```text
0 = none
1 = isolated
2 = occasional
3 = recurring
4 = pervasive
```

This is much richer than:

```text
violence = true
```

---

# 14. Example

For one title:

```json
{
  "category": "violence",
  "severity": 3,
  "frequency": 2,
  "summary": "Several violent confrontations and visible injuries.",
  "confidence": 0.94
}
```

Another:

```json
{
  "category": "occult_supernatural",
  "severity": 4,
  "frequency": 4,
  "summary": "Supernatural and occult themes are central to the story.",
  "confidence": 0.98
}
```

---

# PHASE 8 — Content provenance

We need trust.

Every published report should know:

```text
who reviewed it
when
what evidence existed
which version
confidence
```

Not necessarily shown publicly in full.

Internally:

```text
content_report_sources
----------------------
id
report_id
source_type
source_reference
retrieved_at
notes
```

But extremely important:

## We don't copy competitor reviews.

No scraping:

- Common Sense Media
- Plugged In
- IMDb parental guides
- Movieguide

to reproduce their datasets.

Our published text must be ours.

---

# 15. AI's proper role

AI can absolutely help us operationally.

But it should be:

```text
assistant
```

not:

```text
truth source
```

Pipeline later:

```text
raw evidence
      ↓
automated extraction
      ↓
structured draft
      ↓
human validation
      ↓
published report
```

Not:

```text
"GPT, is Wednesday suitable for Christians?"
      ↓
publish
```

Never.

---

# PHASE 9 — Matching engine

This is the core.

Given:

```text
Family:
violence = warn
sexual_content = avoid
occult = avoid
language = allow
```

And title:

```text
violence = 2
sexual_content = 1
occult = 4
language = 2
```

Discern returns:

```text
2 conflicts
1 warning
9 compatible categories
```

---

# 16. Deterministic matching

Do not use AI for this.

Something like:

```typescript
evaluatePreference(
    preference,
    severity,
    frequency
)
```

Result:

```typescript
type MatchStatus =
  | 'clear'
  | 'notice'
  | 'warning'
  | 'conflict'
  | 'unknown'
```

Then overall:

```typescript
type TitleMatch = {
  conflicts: number
  warnings: number
  clear: number
  unknown: number
  status: 'good_match' | 'review' | 'strong_conflict'
}
```

This ensures:

same data + same preferences = same result.

No random AI changing its opinion tomorrow.

---

# PHASE 10 — Main application structure

Bottom navigation:

```text
Home
Search
Saved
Profile
```

Nothing more initially.

---

# 17. Home

Home should not be a social feed.

It should answer:

> "What do you want to check?"

Top:

```text
🔍 Search movies & TV
```

Below:

```text
Trending now
Recently checked
Popular with families
New this week
```

Later personalization can improve it.

---

# 18. Search results

Cards:

```text
[Poster]

Wednesday
2022 · Series

Discern report available
```

or:

```text
The Wild Robot
2024 · Movie

Matches your settings
```

or:

```text
Report requested
```

Never pretend to know when we don't have sufficient data.

---

# PHASE 11 — Title screen

This should be Discern's signature screen.

Example:

```text
Wednesday
Season 1

────────────

Based on your family settings:

2 CONFLICTS
2 WARNINGS
8 WITHIN YOUR SETTINGS

────────────

⚠ Occult / supernatural
Strong · frequent

You chose:
AVOID

────────────

⚠ Violence
Moderate · occasional

You chose:
WARN ME

────────────

✓ Language
Within your setting

✓ Nudity
Within your setting
```

CTA:

```text
View full report
Save
```

---

# 19. Important language choice

Never:

> "This movie is safe."

Never:

> "This movie is sinful."

Never:

> "Christians should not watch this."

Use:

> "This conflicts with the boundaries you selected."

or:

> "No conflicts were found in the categories currently reviewed."

Much more defensible.

Much more useful.

---

# PHASE 12 — Missing title/report workflow

One very strong feature:

User searches something and Discern has metadata but no report.

Show:

> **We haven't reviewed this yet.**

Buttons:

```text
Request review
Save title
```

Database:

```text
title_requests
--------------
id
media_title_id
user_id
created_at
status
```

Then admin dashboard:

```text
Most requested reports

1. Movie A       384
2. Movie B       271
3. Series C      204
```

Now the community tells us what content to prioritize.

This prevents us from trying to review 100,000 titles.

---

# PHASE 13 — Internal editorial dashboard

This is essential.

I would build the admin interface using the same Expo project with Expo Web initially.

Routes:

```text
/admin
/admin/titles
/admin/requests
/admin/reports
/admin/reports/[id]
/admin/corrections
/admin/users
/admin/subscriptions
/admin/analytics
```

Admin route visibility isn't security.

Database authorization must enforce:

```text
admins table
+
RLS
+
server-side verification
```

---

# 20. Admin report editor

Editor:

```text
TITLE

Violence
Severity:   [0 1 2 3 4]
Frequency:  [0 1 2 3 4]
Summary:
Details:
Confidence:

Sexual content
...

Occult/supernatural
...
```

Actions:

```text
Save draft
Send for review
Publish
Archive
```

Even if you're the only reviewer initially.

---

# PHASE 14 — Correction system

Users need to be able to say:

> Discern missed something.

But don't allow public edits initially.

Button:

```text
Report inaccurate information
```

Options:

```text
Missing content
Severity seems incorrect
Wrong title information
Report contains spoiler
Other
```

Creates:

```text
report_corrections
```

Nothing appears publicly until reviewed.

Therefore we avoid building a moderation nightmare.

---

# PHASE 15 — Authentication properly

Initial:

```text
anonymous Supabase account
```

Later:

```text
Sign in with Apple
Email magic link / OTP
```

I would skip passwords.

Supabase supports Expo/React Native authentication and Apple-based social auth. :chatgpt-content-reference{index="7"}

Sign-in happens after value is demonstrated.

Apple itself recommends delaying sign-in until it provides actual value rather than blocking users immediately. :chatgpt-content-reference{index="8"}

---

# PHASE 16 — Subscription architecture

RevenueCat.

One entitlement:

```text
discern_pro
```

Products:

```text
discern_monthly
discern_yearly
```

Initial target pricing:

```text
$2.99/month

$24.99/year
```

Potential launch trial:

```text
7 days
```

But we can test that later.

Apple requires in-app purchase for digital functionality unlocked inside an iOS application, so this needs StoreKit/IAP rather than Stripe inside the iOS app. :chatgpt-content-reference{index="9"}

RevenueCat handles the subscription abstraction.

---

# 21. Expo Go caveat

Most of Discern can be developed through:

```text
Expo Go
```

However RevenueCat requires an **Expo development build** for real native purchase testing. :chatgpt-content-reference{index="10"}

So workflow:

```text
PHASES 1–15
Expo Go primarily

          ↓

RevenueCat integration
          ↓

EAS Development Build

          ↓

TestFlight
```

We do not eject Expo.

---

# 22. RevenueCat identity

Because we're anonymous-first, I recommend:

Supabase creates anonymous authenticated user.

Use that UUID as:

```text
RevenueCat appUserID
```

Example:

```typescript
Purchases.configure({
    apiKey,
    appUserID: supabaseUser.id
})
```

That keeps identities consistent from day one.

Supabase supports anonymous users being upgraded later to permanent accounts. :chatgpt-content-reference{index="11"}

RevenueCat also supports anonymous-to-identified identity transitions, but having our own stable ID reduces complexity. :chatgpt-content-reference{index="12"}

---

# PHASE 17 — Subscription synchronization

RevenueCat remains payment truth.

Supabase stores a convenient copy.

```text
subscriptions
-------------
user_id
entitlement
status
product_id
expires_at
store
environment
updated_at
```

RevenueCat webhook:

```text
RevenueCat
     ↓
Supabase Edge Function
     ↓
verify webhook
     ↓
subscription_events
     ↓
subscriptions
```

Never trust:

```typescript
user.isPremium = true
```

coming from the client.

---

# 23. Paywall strategy

Do not put the paywall immediately after launch.

Let them:

```text
onboard
search
see personalized result
```

Then lock deeper value.

Possible free tier:

```text
3–5 full personalized checks/month
basic summaries
1 family profile
```

Pro:

```text
unlimited personalized checks
full category details
multiple family profiles
watchlist
new-title alerts
history
```

Apple explicitly supports metered paywalls as a subscription model. :chatgpt-content-reference{index="13"}

---

# PHASE 18 — Premium data protection

Important architectural detail.

Don't download the entire Discern premium database to the mobile app and hide it behind:

```typescript
if (!isPremium) blur()
```

Anyone can bypass that.

Instead:

Public DB/view:

```text
title
poster
year
report_available
basic summary
```

Premium endpoint:

```text
GET report-details
```

Edge Function checks:

```text
JWT
      ↓
user
      ↓
subscription
      ↓
authorized?
```

Then returns detailed report.

---

# PHASE 19 — Watchlists

Simple first:

```text
watchlists
watchlist_items
```

Default:

```text
My Watchlist
```

Don't build:

```text
Dad's favorites
Friday movies
Christmas
Mom approved
Kids bedroom
```

until users ask.

---

# PHASE 20 — Multiple children/profiles

This can become a powerful premium differentiator.

Example:

```text
Emma
Age group: 6–8

Daniel
Age group: 12–14
```

Same movie:

```text
Emma: Strong conflict

Daniel: Review recommended
```

Parent can switch:

```text
Checking for: Emma ▼
```

That is much stronger than generic parental ratings.

---

# PHASE 21 — Region architecture

Build region-awareness from day one.

User:

```text
country_code = US
locale = en-US
```

Title metadata may vary.

Store:

```text
media_release_regions
---------------------
media_title_id
country_code
rating
release_date
```

Eventually:

```text
US
Canada
UK
Germany
France
```

Don't make the classic mistake of assuming:

```text
PG-13 == universal.
```

---

# PHASE 22 — Localization

Architecture should support:

```text
en
de
fr
```

from day one.

But launch content:

## English first.

Because US market first.

Use translation files:

```text
locales/
    en.json
    de.json
    fr.json
```

No strings like:

```tsx
<Text>Search movies</Text>
```

everywhere.

Use:

```typescript
t('search.placeholder')
```

German/French UI can come shortly after English product-market signal.

---

# PHASE 23 — Analytics

We need to know:

```text
install
onboarding_started
onboarding_completed

search_performed
search_no_result
title_viewed

report_available
report_missing
review_requested

family_profile_created

paywall_viewed
trial_started
subscription_started
subscription_restored
subscription_cancelled

watchlist_added

correction_submitted
```

I would use:

**PostHog**

but absolutely never send sensitive preference details as raw analytics properties.

For example:

Good:

```text
preferences_configured = 9
```

Avoid:

```text
user_avoids_sexual_content = true
```

There's no reason a third-party analytics provider needs those details.

---

# PHASE 24 — Search analytics becomes product intelligence

We need:

```text
search_events
```

because this tells us what to review.

Example:

```text
Wednesday            8,241 searches
Minecraft Movie      7,917
Stranger Things      6,330
...
```

Then:

```text
report coverage × searches
```

becomes the editorial priority score.

---

# PHASE 25 — Content coverage strategy

Don't start with:

```text
100,000 movies.
```

Start with approximately:

### 500 high-demand titles.

But make those 500 genuinely good.

Suggested:

```text
Top 100 current movies
Top 100 current TV shows
Top 100 family titles
Top 100 teen/pop culture titles
Top 100 evergreen titles
```

Then title requests determine expansion.

Goal:

```text
90% of actual user searches
```

not:

```text
90% of IMDb.
```

Huge difference.

---

# PHASE 26 — Content confidence

Every category should have:

```text
confidence
```

And report overall:

```text
High confidence
Medium confidence
Needs review
```

If something is unknown:

Say:

> Not enough information yet.

Never convert missing data into:

> No issues.

That mistake would destroy trust.

---

# PHASE 27 — Caching/offline

Use TanStack Query.

Cache:

```text
recent searches
recent title pages
watchlist
family profile
preferences
```

If internet disappears:

Previously viewed reports remain viewable where allowed.

Do not try to make the entire catalog offline.

---

# PHASE 28 — Security

Every user-specific table receives RLS.

Example:

```sql
user_id = auth.uid()
```

Tables:

```text
family_profiles
family_preferences
watchlists
watchlist_items
title_requests
corrections
```

Canonical content cannot be modified by normal users.

Only:

```text
service role
admin
editor workflow
```

---

# PHASE 29 — Secrets

Never expose:

```text
service_role_key
metadata provider secret
RevenueCat secret API key
webhook secret
AI API key
```

Client only receives:

```text
Supabase publishable key
RevenueCat public SDK key
```

Privileged operations go through Edge Functions.

---

# PHASE 30 — Abuse protection

Eventually:

```text
rate-limit searches
rate-limit title requests
rate-limit correction submissions
CAPTCHA where appropriate
```

Anonymous authentication can otherwise create large numbers of accounts. Supabase explicitly notes anonymous users behave as authenticated users, so RLS must account for them appropriately. :chatgpt-content-reference{index="14"}

---

# PHASE 31 — Account deletion

Must exist before App Store release.

Settings:

```text
Account
 ├─ Export my data
 ├─ Sign out
 └─ Delete account
```

Deletion flow:

```text
confirm
     ↓
Edge Function
     ↓
delete user-owned data
     ↓
delete Auth user
```

Canonical title reports remain because they are not user-owned.

---

# PHASE 32 — Privacy design

Store minimal information.

We need:

```text
user UUID
country
locale
family age groups
content preferences
watchlists
subscription status
```

We don't need children's:

```text
real names
birth dates
photos
school
church
location
```

If a parent wants to label:

```text
"7-year-old"
```

that's enough.

---

# PHASE 33 — Testing architecture

Three levels.

### Unit tests

Especially:

```text
matching algorithm
preference evaluation
severity logic
formatting
schema validation
```

Core matching engine should have very high coverage.

Example:

```text
avoid + severity 4 => conflict
warn + severity 2 => warning
allow + severity 4 => notice/clear depending policy
unknown report => unknown
```

---

# PHASE 34 — Integration tests

Test:

```text
Supabase auth
anonymous upgrade
search Edge Function
RLS
premium report authorization
RevenueCat webhook
account deletion
```

---

# PHASE 35 — E2E

Use Maestro.

Flows:

```text
fresh install
onboarding
search
open title
change boundaries
result changes
save title
request missing report
sign in
purchase
restore
delete account
```

Expo currently has first-class Maestro/EAS testing support. :chatgpt-content-reference{index="15"}

---

# PHASE 36 — One-production-DB test convention

Since you specifically don't want staging:

Test users:

```text
is_test_user = true
```

RevenueCat:

```text
environment = SANDBOX
```

Analytics:

```text
is_test = true
```

Queries exclude them:

```sql
WHERE is_test_user = false
```

Test-generated:

```text
watchlists
requests
analytics events
```

can periodically be cleaned.

Canonical media records don't need duplication.

---

# PHASE 37 — EAS setup

Profiles:

```json
{
  "build": {
    "development": {},
    "preview": {},
    "production": {}
  }
}
```

Important:

these are **build profiles**, not different databases.

All still use:

```text
Discern production Supabase
```

Development:

your iPhone.

Preview:

internal/TestFlight.

Production:

App Store.

Expo supports EAS Build and EAS Submit directly. :chatgpt-content-reference{index="16"}

---

# PHASE 38 — App Store/TestFlight

Before submission:

```text
privacy policy
terms
support URL
account deletion
restore purchases
subscription terms
App Store screenshots
App Privacy answers
age rating
review credentials/instructions
```

Subscriptions:

```text
monthly
yearly
```

RevenueCat sandbox fully tested.

Apple requires subscription apps to provide ongoing value, which Discern can legitimately satisfy through continuously expanding and updated content coverage. :chatgpt-content-reference{index="17"}

---

# PHASE 39 — First production scope

This is what I would ship as **Discern 1.0**.

### Included

✅ premium visual design

✅ anonymous onboarding

✅ family boundary configuration

✅ movies

✅ TV series

✅ media search

✅ personalized matching

✅ detailed content categories

✅ Discern-owned reports

✅ multiple family profiles

✅ title requests

✅ corrections

✅ watchlist

✅ Sign in with Apple

✅ email authentication

✅ RevenueCat subscriptions

✅ analytics

✅ admin editorial dashboard

✅ content confidence

✅ US regional ratings

✅ account deletion

✅ privacy/legal

✅ TestFlight

✅ production App Store release

That's already a serious product.

---

# 40. What is deliberately NOT in 1.0

Not because it is an MVP.

Because these are different product expansions.

❌ video games

❌ books

❌ YouTube channel analysis

❌ individual YouTube videos

❌ browser extension

❌ Safari extension

❌ parental-control VPN

❌ Netflix integration

❌ streaming-service integration

❌ social network

❌ comments

❌ public ratings

❌ Christian movie recommendations

❌ church accounts

❌ homeschool accounts

❌ Android

❌ automatic screen blocking

❌ AI chatbot

❌ AI spiritual advice

❌ public contributor system

---

# PHASE 41 — Version 1.1

After launch data.

Add:

### Recently released content alerts

User follows:

```text
TV series
```

New season appears.

Discern report ready:

> "The new season of Wednesday has been reviewed."

---

# PHASE 42 — Version 1.2

### Streaming discovery

Example:

```text
Show me family-compatible movies
available on:

Netflix
Disney+
Prime Video
```

This becomes very interesting.

Instead of:

> "Is this one okay?"

Discern can answer:

> "What can we watch tonight?"

That increases usage frequency considerably.

---

# PHASE 43 — Version 1.3

## Games

This is probably the strongest second vertical.

```text
Minecraft
Fortnite
Roblox experiences
Call of Duty
Baldur's Gate
Hogwarts Legacy
etc.
```

Same family preference engine.

No architectural rewrite.

`media_titles` becomes:

```text
media_type:
movie
tv
game
```

---

# PHASE 44 — Version 1.4

Books.

Again:

```text
media_type:
book
```

Same content engine.

Same profiles.

Same preferences.

Same subscription.

---

# PHASE 45 — Version 2

The very interesting future:

## "What can my family watch?"

Instead of search-only:

```text
Netflix
+
my profiles
+
my preferences
+
Discern reports
```

Output:

```text
42 titles match
```

Then filters:

```text
Under 90 minutes
Comedy
Tonight
Kids 8+
No strong violence
No occult themes
```

Now Discern stops merely being a review database.

It becomes:

# a personalized entertainment decision engine.

That's where I think the product becomes much more defensible.

---

# 46. Long-term data moat

The code is not the moat.

Anyone can reproduce:

```text
Expo
Supabase
RevenueCat
search bar
```

The moat becomes:

```text
millions of searches
+
thousands of structured reports
+
category-level annotations
+
regional differences
+
correction history
+
family preference model
+
title demand data
```

After several years:

```text
Title × Content × Context × Region × Family preference
```

That is difficult to reproduce.

---

# 47. Recommended development order

I would implement in exactly this sequence:

| Phase | Work |
|---|---|
| 0 | Product taxonomy/rules |
| 1 | Expo project + repository |
| 2 | Design system |
| 3 | Supabase + migrations + RLS |
| 4 | Anonymous auth |
| 5 | Onboarding/preferences |
| 6 | Metadata provider abstraction |
| 7 | Search/catalog |
| 8 | Content-report database |
| 9 | Matching engine |
| 10 | Home/search/title UI |
| 11 | Missing-report requests |
| 12 | Admin editorial workflow |
| 13 | Corrections |
| 14 | Apple/email account linking |
| 15 | Watchlists |
| 16 | Multiple family profiles |
| 17 | RevenueCat |
| 18 | Premium server authorization |
| 19 | Analytics |
| 20 | Content ingestion/review tooling |
| 21 | 500-title initial dataset |
| 22 | Unit/integration/E2E tests |
| 23 | Privacy/account deletion |
| 24 | EAS development build |
| 25 | TestFlight |
| 26 | App Store production release |

---

# 48. The three things I would be extremely strict about

### 1. No fake comprehensiveness

If Discern doesn't know:

> **"Not reviewed yet."**

Trust > coverage.

### 2. No AI-generated moral judgments

AI can help extract and normalize data.

But:

```text
LLM decides whether content is Christian
```

is exactly the product we said we didn't want.

### 3. Own the report model

The real company is not:

> an Expo app.

The company is ultimately:

> **a structured entertainment-content intelligence database personalized to individual family boundaries.**

That's what we should architect from day one.

---

## One final technical decision I strongly recommend

Despite supporting anonymous onboarding, I would create a Supabase anonymous user **on first launch**, rather than purely local guest state.

That gives us immediately:

```text
stable UUID
RLS
search history
preferences
title requests
RevenueCat identity
later account linking
```

without asking for an email.

Supabase explicitly supports this flow: anonymous users can later link an email or OAuth identity while preserving the account. :chatgpt-content-reference{index="18"}

And when we reach RevenueCat, we switch from ordinary Expo Go to an **EAS development build**, while keeping Expo/React Native exactly as-is. :chatgpt-content-reference{index="19"}

So there should be **no technical rewrite between development and the real App Store app**.
