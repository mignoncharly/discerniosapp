-- Phase 3: anonymous-first onboarding and normalized family preferences.
create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  locale text,
  country_code text check (country_code is null or char_length(country_code) = 2),
  onboarding_completed boolean not null default false,
  is_test_user boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.content_categories (
  slug text primary key,
  label text not null,
  sort_order smallint not null unique
);

insert into public.content_categories (slug, label, sort_order) values
  ('sexual_content', 'Sexual content', 1),
  ('nudity', 'Nudity', 2),
  ('language', 'Language', 3),
  ('violence', 'Violence', 4),
  ('gore', 'Gore', 5),
  ('fear_horror', 'Fear / horror', 6),
  ('occult_supernatural', 'Occult / supernatural', 7),
  ('drugs_alcohol_smoking', 'Drugs / alcohol / smoking', 8),
  ('gambling', 'Gambling', 9),
  ('self_harm_suicide', 'Self-harm / suicide', 10),
  ('religious_language', 'Religious language', 11),
  ('mature_themes', 'Mature themes', 12);

create table public.family_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'My Family' check (char_length(name) between 1 and 80),
  age_group text not null check (age_group in ('under_6', '6_8', '9_11', '12_14', '15_17', 'adults')),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index family_profiles_one_default_per_user
  on public.family_profiles (user_id) where is_default;
create index family_profiles_user_id_idx on public.family_profiles (user_id);

create table public.family_preferences (
  id uuid primary key default gen_random_uuid(),
  family_profile_id uuid not null references public.family_profiles (id) on delete cascade,
  category_id text not null references public.content_categories (slug),
  preference text not null check (preference in ('avoid', 'warn', 'allow')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (family_profile_id, category_id)
);

create index family_preferences_family_profile_id_idx on public.family_preferences (family_profile_id);

alter table public.profiles enable row level security;
alter table public.content_categories enable row level security;
alter table public.family_profiles enable row level security;
alter table public.family_preferences enable row level security;

create policy "Users read their profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users create their profile"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users update their profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Anyone can read content categories"
  on public.content_categories for select to anon, authenticated using (true);

create policy "Users manage their family profiles"
  on public.family_profiles for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage preferences for their family profiles"
  on public.family_preferences for all to authenticated
  using (exists (
    select 1 from public.family_profiles fp
    where fp.id = family_profile_id and fp.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.family_profiles fp
    where fp.id = family_profile_id and fp.user_id = (select auth.uid())
  ));

revoke all on public.profiles, public.content_categories, public.family_profiles, public.family_preferences
  from public, anon, authenticated;
grant select on public.content_categories to anon, authenticated;
grant select, insert, update, delete on public.profiles, public.family_profiles, public.family_preferences to authenticated;

-- Persist the onboarding selections atomically. Preferences use one row per category,
-- so a future 0–4 sensitivity scale can be added without replacing a JSON blob.
create or replace function public.complete_family_onboarding(
  p_age_group text,
  p_preferences jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_family_profile_id uuid;
  v_category_count integer;
  v_preference_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_age_group is null or p_age_group not in ('under_6', '6_8', '9_11', '12_14', '15_17', 'adults') then
    raise exception 'Invalid age group' using errcode = '22023';
  end if;
  if pg_catalog.jsonb_typeof(p_preferences) <> 'object' then
    raise exception 'Preferences must be an object' using errcode = '22023';
  end if;

  select pg_catalog.count(*) into v_category_count from public.content_categories;
  select pg_catalog.count(*) into v_preference_count from pg_catalog.jsonb_object_keys(p_preferences);
  if v_preference_count <> v_category_count
     or exists (
       select 1
       from pg_catalog.jsonb_each_text(p_preferences) as pref(category, value)
       left join public.content_categories c on c.slug = pref.category
       where c.slug is null or pref.value not in ('avoid', 'warn', 'allow')
     ) then
    raise exception 'Select avoid, warn, or allow for every content category' using errcode = '22023';
  end if;

  insert into public.profiles (user_id, onboarding_completed)
  values (v_user_id, false)
  on conflict (user_id) do nothing;

  insert into public.family_profiles (user_id, name, age_group, is_default)
  values (v_user_id, 'My Family', p_age_group, true)
  on conflict (user_id) where is_default
  do update set age_group = excluded.age_group, updated_at = now()
  returning id into v_family_profile_id;

  delete from public.family_preferences where family_profile_id = v_family_profile_id;
  insert into public.family_preferences (family_profile_id, category_id, preference)
  select v_family_profile_id, pref.category, pref.value
  from pg_catalog.jsonb_each_text(p_preferences) as pref(category, value);

  update public.profiles
  set onboarding_completed = true, updated_at = now()
  where user_id = v_user_id;

  return v_family_profile_id;
end;
$$;

revoke all on function public.complete_family_onboarding(text, jsonb) from public, anon;
grant execute on function public.complete_family_onboarding(text, jsonb) to authenticated;
