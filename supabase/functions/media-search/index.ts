import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type MediaType = 'movie' | 'tv';
type MediaFilter = MediaType | null;
type SearchOptions = { query: string; mediaType: MediaFilter; regionCode: string | null; language: string; limit: number };
type ProviderTitle = {
  media_type: MediaType;
  title: string;
  original_title: string | null;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string | null;
  release_year: number | null;
  original_language: string | null;
  runtime_minutes: number | null;
  metadata_provider: string;
  metadata_provider_id: string;
  search_aliases: string[];
  external_ids?: Array<{ source: string; external_id: string }>;
  regional_metadata?: Array<{
    region_code: string;
    release_date: string | null;
    rating_label: string | null;
    rating_system: string | null;
  }>;
};

interface MediaProvider {
  search(options: SearchOptions): Promise<ProviderTitle[]>;
  getMovie(providerId: string, options: Pick<SearchOptions, 'regionCode' | 'language'>): Promise<ProviderTitle>;
  getTvShow(providerId: string, options: Pick<SearchOptions, 'regionCode' | 'language'>): Promise<ProviderTitle>;
}

type TmdbItem = {
  id: number;
  media_type?: string;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  original_language?: string;
  runtime?: number;
  external_ids?: Record<string, string | number | null>;
  release_dates?: { results?: Array<{ iso_3166_1?: string; release_dates?: Array<{ certification?: string; release_date?: string }> }> };
  content_ratings?: { results?: Array<{ iso_3166_1?: string; rating?: string }> };
};

class TmdbMediaProvider implements MediaProvider {
  readonly name = 'tmdb';

  constructor(private readonly accessToken: string) {}

  private async request<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`https://api.themoviedb.org/3${path}`);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    const response = await fetch(url, {
      headers: { accept: 'application/json', Authorization: `Bearer ${this.accessToken}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`Metadata provider returned ${response.status}.`);
    return await response.json() as T;
  }

  async search(options: SearchOptions): Promise<ProviderTitle[]> {
    const endpoint = options.mediaType === 'movie' ? '/search/movie' : options.mediaType === 'tv' ? '/search/tv' : '/search/multi';
    const params: Record<string, string> = {
      query: options.query,
      language: options.language,
      page: '1',
      include_adult: 'true',
    };
    if (options.regionCode && options.mediaType !== 'tv') params.region = options.regionCode;
    const payload = await this.request<{ results?: TmdbItem[] }>(endpoint, params);
    return (payload.results ?? [])
      .filter((item) => item.media_type !== 'person')
      .filter((item) => options.mediaType === null || item.media_type === undefined || item.media_type === options.mediaType)
      .slice(0, options.limit)
      .map((item) => this.normalize(item, item.media_type === 'tv' || options.mediaType === 'tv' ? 'tv' : 'movie'));
  }

  async getMovie(providerId: string, options: Pick<SearchOptions, 'regionCode' | 'language'>): Promise<ProviderTitle> {
    const item = await this.request<TmdbItem>(`/movie/${encodeURIComponent(providerId)}`, {
      language: options.language,
      append_to_response: 'external_ids,release_dates',
    });
    const title = this.normalize(item, 'movie');
    title.external_ids = this.externalIds(item.external_ids);
    title.regional_metadata = this.movieRegions(item.release_dates?.results ?? [], options.regionCode);
    return title;
  }

  async getTvShow(providerId: string, options: Pick<SearchOptions, 'regionCode' | 'language'>): Promise<ProviderTitle> {
    const item = await this.request<TmdbItem>(`/tv/${encodeURIComponent(providerId)}`, {
      language: options.language,
      append_to_response: 'external_ids,content_ratings',
    });
    const title = this.normalize(item, 'tv');
    title.external_ids = this.externalIds(item.external_ids);
    title.regional_metadata = this.tvRegions(item.content_ratings?.results ?? [], options.regionCode);
    return title;
  }

  private normalize(item: TmdbItem, mediaType: MediaType): ProviderTitle {
    const releaseDate = validDate(mediaType === 'movie' ? item.release_date : item.first_air_date);
    const title = mediaType === 'movie' ? item.title : item.name;
    const originalTitle = mediaType === 'movie' ? item.original_title : item.original_name;
    return {
      media_type: mediaType,
      title: title?.trim() || originalTitle?.trim() || 'Untitled',
      original_title: originalTitle?.trim() || null,
      overview: item.overview?.trim() || null,
      poster_path: item.poster_path ?? null,
      backdrop_path: item.backdrop_path ?? null,
      release_date: releaseDate,
      release_year: releaseDate ? Number(releaseDate.slice(0, 4)) : null,
      original_language: item.original_language?.trim() || null,
      runtime_minutes: Number.isInteger(item.runtime) && item.runtime! > 0 ? item.runtime! : null,
      metadata_provider: this.name,
      metadata_provider_id: String(item.id),
      search_aliases: originalTitle && originalTitle !== title ? [originalTitle] : [],
    };
  }

  private externalIds(ids: TmdbItem['external_ids']): NonNullable<ProviderTitle['external_ids']> {
    if (!ids) return [];
    return ['imdb_id', 'tvdb_id', 'wikidata_id']
      .map((key) => ({ source: key.replace('_id', ''), external_id: String(ids[key] ?? '') }))
      .filter((value) => value.external_id.length > 0);
  }

  private movieRegions(
    regions: NonNullable<TmdbItem['release_dates']>['results'],
    requestedRegion: string | null,
  ): NonNullable<ProviderTitle['regional_metadata']> {
    const values = new Map<string, NonNullable<ProviderTitle['regional_metadata']>[number]>();
    for (const region of regions ?? []) {
      const regionCode = region.iso_3166_1?.toUpperCase();
      if (!regionCode || !/^[A-Z]{2}$/.test(regionCode)) continue;
      if (requestedRegion && regionCode !== requestedRegion) continue;
      for (const item of region.release_dates ?? []) {
        const releaseDate = validDate(item.release_date);
        const current = values.get(regionCode);
        if (!current || (!current.rating_label && item.certification) || (!current.release_date && releaseDate)) {
          values.set(regionCode, {
            region_code: regionCode,
            release_date: releaseDate ?? current?.release_date ?? null,
            rating_label: item.certification?.trim() || current?.rating_label || null,
            rating_system: null,
          });
        }
      }
    }
    return [...values.values()];
  }

  private tvRegions(
    ratings: NonNullable<TmdbItem['content_ratings']>['results'],
    requestedRegion: string | null,
  ): NonNullable<ProviderTitle['regional_metadata']> {
    return (ratings ?? []).flatMap((entry) => {
      const regionCode = entry.iso_3166_1?.toUpperCase();
      if (!regionCode || !/^[A-Z]{2}$/.test(regionCode) || (requestedRegion && regionCode !== requestedRegion)) return [];
      return [{ region_code: regionCode, release_date: null, rating_label: entry.rating?.trim() || null, rating_system: null }];
    });
  }
}

function validDate(value?: string): string | null {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function normalizeQuery(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const query = value.trim().replace(/\s+/g, ' ');
  return query.length >= 2 && query.length <= 100 ? query : null;
}

function normalizeRegion(value: unknown): string | null {
  return typeof value === 'string' && /^[A-Za-z]{2}$/.test(value) ? value.toUpperCase() : null;
}

function normalizeMediaType(value: unknown): MediaFilter | 'invalid' {
  if (value == null || value === 'all') return null;
  return value === 'movie' || value === 'tv' ? value : 'invalid';
}

async function cacheProviderTitle(admin: ReturnType<typeof createClient>, title: ProviderTitle) {
  const now = new Date().toISOString();
  const { data, error } = await admin.from('media_titles').upsert({
    ...title,
    metadata_updated_at: now,
    updated_at: now,
  }, { onConflict: 'metadata_provider,metadata_provider_id' }).select('id,media_type,title,original_title,overview,poster_path,backdrop_path,release_date,release_year,original_language,runtime_minutes,metadata_provider,metadata_provider_id').single();
  if (error) throw error;

  const allExternalIds = [
    { source: title.metadata_provider, external_id: title.metadata_provider_id },
    ...(title.external_ids ?? []),
  ];
  const externalIds = [...new Map(allExternalIds.map((external) => [external.source, external])).values()]
    .map((external) => ({ media_title_id: data.id, ...external }));
  if (externalIds.length) {
    const { error: externalError } = await admin.from('media_external_ids').upsert(externalIds, { onConflict: 'media_title_id,source' });
    if (externalError) throw externalError;
  }
  const regions = (title.regional_metadata ?? []).map((region) => ({
    media_title_id: data.id,
    ...region,
    metadata_provider: title.metadata_provider,
    metadata_updated_at: now,
    updated_at: now,
  }));
  if (regions.length) {
    const { error: regionError } = await admin.from('media_release_regions').upsert(regions, { onConflict: 'media_title_id,region_code' });
    if (regionError) throw regionError;
  }
  return data;
}

function response(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return response(405, { error: 'Method not allowed.' });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return response(503, { error: 'Media search is not configured.' });

  const authorization = request.headers.get('Authorization');
  if (!authorization) return response(401, { error: 'Authentication required.' });

  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return response(401, { error: 'Authentication required.' });
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return response(400, { error: 'Invalid request body.' });
  }

  const action = body.action;
  const regionCode = normalizeRegion(body.regionCode);
  const language = typeof body.language === 'string' && /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})?$/.test(body.language) ? body.language : 'en-US';
  const accessToken = Deno.env.get('TMDB_ACCESS_TOKEN');

  if (action === 'search') {
    const query = normalizeQuery(body.query);
    const mediaType = normalizeMediaType(body.mediaType);
    if (!query) return response(400, { error: 'Search query must be between 2 and 100 characters.' });
    if (mediaType === 'invalid') return response(400, { error: 'Invalid media type.' });
    const limit = Number.isInteger(body.limit) ? Math.max(1, Math.min(Number(body.limit), 50)) : 20;
    const { data: localResults, error: localError } = await userClient.rpc('search_media_titles', {
      p_query: query,
      p_media_type: mediaType,
      p_limit: limit,
    });
    if (localError) return response(500, { error: 'Catalog search failed.' });
    const catalogResults = localResults ?? [];

    let providerStatus: 'available' | 'not_configured' | 'not_needed' | 'unavailable' = 'not_needed';
    let providerResults: Array<Record<string, unknown>> = [];
    if (catalogResults.length < limit) {
      if (!accessToken) {
        providerStatus = 'not_configured';
      } else {
        try {
          const provider = new TmdbMediaProvider(accessToken);
          const options: SearchOptions = { query, mediaType, regionCode, language, limit: limit - catalogResults.length };
          const externalResults = await provider.search(options);
          const cached = [];
          for (const title of externalResults) cached.push(await cacheProviderTitle(admin, title));
          providerResults = cached;
          providerStatus = 'available';
        } catch {
          providerStatus = 'unavailable';
        }
      }
    }

    const localIds = new Set(catalogResults.map((item: { id: string }) => item.id));
    const newProviderResults = providerResults.filter((item) => !localIds.has(String(item.id)));
    const results = [...catalogResults, ...newProviderResults].slice(0, limit);
    const resultSource = newProviderResults.length ? (catalogResults.length ? 'mixed' : 'provider') : 'local';
    await userClient.rpc('record_media_search', {
      p_query: query,
      p_media_type: mediaType,
      p_region_code: regionCode,
      p_result_count: results.length,
      p_result_source: resultSource,
    });
    return response(200, { results, providerStatus });
  }

  if (action === 'movie' || action === 'tv') {
    const providerId = typeof body.providerId === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(body.providerId) ? body.providerId : null;
    if (!providerId) return response(400, { error: 'Invalid provider title ID.' });
    if (!accessToken) return response(503, { error: 'Metadata provider is not configured.' });
    try {
      const provider = new TmdbMediaProvider(accessToken);
      const options = { regionCode, language };
      const title = action === 'movie'
        ? await provider.getMovie(providerId, options)
        : await provider.getTvShow(providerId, options);
      return response(200, { title: await cacheProviderTitle(admin, title) });
    } catch {
      return response(502, { error: 'The metadata provider could not load this title.' });
    }
  }

  return response(400, { error: 'Unsupported media action.' });
});
