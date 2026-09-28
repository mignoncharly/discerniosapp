export type MediaType = 'movie' | 'tv';
export type MediaTypeFilter = MediaType | 'all';

export type MediaTitle = {
  id: string;
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
};

export type MediaSearchResponse = {
  results: MediaTitle[];
  providerStatus: 'available' | 'not_configured' | 'not_needed' | 'unavailable';
};

export type MediaSearchOptions = {
  query: string;
  mediaType?: MediaTypeFilter;
  regionCode?: string;
  language?: string;
  limit?: number;
};

export type MediaProviderTitle = Omit<MediaTitle, 'id'> & {
  externalIds?: { source: string; externalId: string }[];
  regionalMetadata?: {
    regionCode: string;
    releaseDate?: string | null;
    ratingLabel?: string | null;
    ratingSystem?: string | null;
  }[];
};

/** Implementations run behind the media service; provider credentials stay server-side. */
export interface MediaProvider {
  search(options: MediaSearchOptions): Promise<MediaProviderTitle[]>;
  getMovie(providerId: string, options?: Pick<MediaSearchOptions, 'regionCode' | 'language'>): Promise<MediaProviderTitle>;
  getTvShow(providerId: string, options?: Pick<MediaSearchOptions, 'regionCode' | 'language'>): Promise<MediaProviderTitle>;
}
