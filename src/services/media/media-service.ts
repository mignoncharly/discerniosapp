import { supabase } from '@/services/supabase/client';
import type { MediaProvider, MediaProviderTitle, MediaSearchOptions, MediaSearchResponse, MediaTitle } from '@/services/media/types';

const DEFAULT_LIMIT = 20;

export async function searchMediaCatalog(options: MediaSearchOptions): Promise<MediaSearchResponse> {
  if (!supabase) throw new Error('Search is unavailable until Supabase is configured.');
  const query = options.query.trim().replace(/\s+/g, ' ');
  if (query.length < 2) return { results: [], providerStatus: 'not_needed' };

  const request = {
    action: 'search',
    query,
    mediaType: options.mediaType && options.mediaType !== 'all' ? options.mediaType : null,
    regionCode: options.regionCode ?? null,
    language: options.language ?? 'en-US',
    limit: Math.max(1, Math.min(options.limit ?? DEFAULT_LIMIT, 50)),
  };

  const { data, error } = await supabase.functions.invoke('media-search', { body: request });
  if (!error && data && Array.isArray(data.results)) {
    return data as MediaSearchResponse;
  }

  // Keep local catalog search useful before the provider function is deployed.
  const { data: localResults, error: searchError } = await supabase.rpc('search_media_titles', {
    p_query: query,
    p_media_type: request.mediaType,
    p_limit: request.limit,
  });
  if (searchError) throw searchError;

  void supabase.rpc('record_media_search', {
    p_query: query,
    p_media_type: request.mediaType,
    p_region_code: request.regionCode,
    p_result_count: (localResults ?? []).length,
    p_result_source: 'local',
  });

  return {
    results: (localResults ?? []) as MediaTitle[],
    providerStatus: 'unavailable',
  };
}

async function loadProviderTitle(action: 'movie' | 'tv', providerId: string, regionCode?: string, language?: string) {
  if (!supabase) throw new Error('Title metadata is unavailable until Supabase is configured.');
  const { data, error } = await supabase.functions.invoke('media-search', {
    body: { action, providerId, regionCode: regionCode ?? null, language: language ?? 'en-US' },
  });
  if (error) throw error;
  if (!data?.title) throw new Error('The metadata provider returned no title.');
  return data.title as MediaProviderTitle;
}

/** App features use this provider contract and never call a vendor API directly. */
export const mediaProvider: MediaProvider = {
  async search(options) {
    const response = await searchMediaCatalog(options);
    return response.results;
  },
  getMovie(providerId, options) {
    return loadProviderTitle('movie', providerId, options?.regionCode, options?.language);
  },
  getTvShow(providerId, options) {
    return loadProviderTitle('tv', providerId, options?.regionCode, options?.language);
  },
};
