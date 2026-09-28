-- Phase 4: provider-neutral media catalog, regional metadata, and privacy-minimized search demand.
create table public.media_titles (
  id uuid primary key default gen_random_uuid(),
  media_type text not null check (media_type in ('movie', 'tv')),
  title text not null check (char_length(title) between 1 and 300),
  original_title text,
  overview text,
  poster_path text,
  backdrop_path text,
  release_date date,
  release_year smallint check (release_year is null or release_year between 1800 and 2200),
  original_language text check (original_language is null or char_length(original_language) between 2 and 16),
  runtime_minutes integer check (runtime_minutes is null or runtime_minutes > 0),
  search_aliases text[] not null default '{}',
  metadata_provider text not null check (char_length(metadata_provider) between 1 and 64),
  metadata_provider_id text not null check (char_length(metadata_provider_id) between 1 and 128),
  metadata_updated_at timestamptz not null default now(),
  search_document tsvector not null default ''::tsvector,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (metadata_provider, metadata_provider_id)
);

create or replace function public.set_media_title_search_document()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.search_document :=
    pg_catalog.setweight(pg_catalog.to_tsvector('simple'::pg_catalog.regconfig, coalesce(new.title, '')), 'A') ||
    pg_catalog.setweight(pg_catalog.to_tsvector('simple'::pg_catalog.regconfig, coalesce(new.original_title, '')), 'B') ||
    pg_catalog.setweight(pg_catalog.to_tsvector('simple'::pg_catalog.regconfig, coalesce(pg_catalog.array_to_string(new.search_aliases, ' '), '')), 'C');
  return new;
end;
$$;

create trigger media_titles_search_document_trigger
  before insert or update of title, original_title, search_aliases on public.media_titles
  for each row execute function public.set_media_title_search_document();

create index media_titles_search_document_idx on public.media_titles using gin (search_document);
create index media_titles_type_release_idx on public.media_titles (media_type, release_year desc nulls last);

create table public.media_external_ids (
  id uuid primary key default gen_random_uuid(),
  media_title_id uuid not null references public.media_titles (id) on delete cascade,
  source text not null check (char_length(source) between 1 and 64),
  external_id text not null check (char_length(external_id) between 1 and 128),
  created_at timestamptz not null default now(),
  unique (source, external_id),
  unique (media_title_id, source)
);

create index media_external_ids_title_idx on public.media_external_ids (media_title_id);

create table public.media_release_regions (
  id uuid primary key default gen_random_uuid(),
  media_title_id uuid not null references public.media_titles (id) on delete cascade,
  region_code text not null check (region_code ~ '^[A-Z]{2}$'),
  release_date date,
  rating_label text,
  rating_system text,
  metadata_provider text not null check (char_length(metadata_provider) between 1 and 64),
  metadata_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (media_title_id, region_code)
);

create index media_release_regions_region_idx on public.media_release_regions (region_code, media_title_id);

create table public.media_search_events (
  id uuid primary key default gen_random_uuid(),
  query_normalized text not null check (char_length(query_normalized) between 2 and 100),
  media_type text check (media_type is null or media_type in ('movie', 'tv')),
  region_code text check (region_code is null or region_code ~ '^[A-Z]{2}$'),
  result_count integer not null check (result_count between 0 and 50),
  result_source text not null check (result_source in ('local', 'provider', 'mixed')),
  created_at timestamptz not null default now()
);

create index media_search_events_created_idx on public.media_search_events (created_at desc);
create index media_search_events_query_created_idx on public.media_search_events (query_normalized, created_at desc);

alter table public.media_titles enable row level security;
alter table public.media_external_ids enable row level security;
alter table public.media_release_regions enable row level security;
alter table public.media_search_events enable row level security;

create policy "Anyone can read catalog titles"
  on public.media_titles for select to anon, authenticated using (true);
create policy "Anyone can read external title identifiers"
  on public.media_external_ids for select to anon, authenticated using (true);
create policy "Anyone can read regional title metadata"
  on public.media_release_regions for select to anon, authenticated using (true);

revoke all on public.media_titles, public.media_external_ids, public.media_release_regions, public.media_search_events
  from public, anon, authenticated;
grant select on public.media_titles, public.media_external_ids, public.media_release_regions to anon, authenticated;

create or replace function public.search_media_titles(
  p_query text,
  p_media_type text default null,
  p_limit smallint default 20
)
returns table (
  id uuid,
  media_type text,
  title text,
  original_title text,
  overview text,
  poster_path text,
  backdrop_path text,
  release_date date,
  release_year smallint,
  original_language text,
  runtime_minutes integer,
  metadata_provider text,
  metadata_provider_id text
)
language sql
stable
security invoker
set search_path = ''
as $$
  with search_input as (
    select pg_catalog.btrim(p_query) as query_text,
           pg_catalog.plainto_tsquery('simple'::pg_catalog.regconfig, pg_catalog.btrim(p_query)) as query_terms
  )
  select t.id, t.media_type, t.title, t.original_title, t.overview, t.poster_path, t.backdrop_path,
         t.release_date, t.release_year, t.original_language, t.runtime_minutes,
         t.metadata_provider, t.metadata_provider_id
  from public.media_titles as t
  cross join search_input as q
  where pg_catalog.char_length(q.query_text) between 2 and 100
    and (p_media_type is null or p_media_type in ('movie', 'tv'))
    and (p_media_type is null or t.media_type = p_media_type)
    and (
      t.search_document @@ q.query_terms
      or pg_catalog.strpos(pg_catalog.lower(t.title), pg_catalog.lower(q.query_text)) > 0
      or pg_catalog.strpos(pg_catalog.lower(coalesce(t.original_title, '')), pg_catalog.lower(q.query_text)) > 0
    )
  order by
    (pg_catalog.lower(t.title) = pg_catalog.lower(q.query_text)) desc,
    (pg_catalog.left(pg_catalog.lower(t.title), pg_catalog.char_length(q.query_text)) = pg_catalog.lower(q.query_text)) desc,
    pg_catalog.ts_rank(t.search_document, q.query_terms) desc,
    t.release_year desc nulls last,
    t.title asc
  limit greatest(1, least(coalesce(p_limit, 20), 50));
$$;

revoke all on function public.search_media_titles(text, text, smallint) from public;
grant execute on function public.search_media_titles(text, text, smallint) to anon, authenticated;

create or replace function public.record_media_search(
  p_query text,
  p_media_type text,
  p_region_code text,
  p_result_count integer,
  p_result_source text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_query text := pg_catalog.lower(pg_catalog.regexp_replace(pg_catalog.btrim(p_query), '\s+', ' ', 'g'));
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if pg_catalog.char_length(v_query) not between 2 and 100 then
    raise exception 'Search query must be between 2 and 100 characters' using errcode = '22023';
  end if;
  if p_media_type is not null and p_media_type not in ('movie', 'tv') then
    raise exception 'Invalid media type' using errcode = '22023';
  end if;
  if p_region_code is not null and p_region_code !~ '^[A-Z]{2}$' then
    raise exception 'Region code must be a two-letter uppercase code' using errcode = '22023';
  end if;
  if p_result_count is null or p_result_count not between 0 and 50 then
    raise exception 'Invalid result count' using errcode = '22023';
  end if;
  if p_result_source not in ('local', 'provider', 'mixed') then
    raise exception 'Invalid result source' using errcode = '22023';
  end if;

  insert into public.media_search_events (query_normalized, media_type, region_code, result_count, result_source)
  values (v_query, p_media_type, p_region_code, p_result_count, p_result_source);
end;
$$;

revoke all on function public.record_media_search(text, text, text, integer, text) from public, anon;
grant execute on function public.record_media_search(text, text, text, integer, text) to authenticated;
