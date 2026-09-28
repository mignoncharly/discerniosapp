import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';

import { AppScreen, AppText, Badge, Button, Card, SearchInput } from '@/components/primitives';
import { searchMediaCatalog } from '@/services/media/media-service';
import type { MediaSearchResponse, MediaTypeFilter } from '@/services/media/types';
import { fontWeight, spacing } from '@/theme/tokens';
import { useAppColors } from '@/theme/use-app-colors';

export default function HomeScreen() {
  const colors = useAppColors();
  const [searchInput, setSearchInput] = useState('');
  const [mediaType, setMediaType] = useState<MediaTypeFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchError, setSearchError] = useState('');
  const normalizedSearch = searchTerm.trim().replace(/\s+/g, ' ');
  const search = useQuery<MediaSearchResponse>({
    queryKey: ['media-search', normalizedSearch, mediaType],
    queryFn: () => searchMediaCatalog({ query: normalizedSearch, mediaType, limit: 20 }),
    enabled: normalizedSearch.length >= 2,
  });

  function submitSearch() {
    const query = searchInput.trim().replace(/\s+/g, ' ');
    if (query.length < 2) {
      setSearchError('Enter at least 2 characters to search.');
      return;
    }
    setSearchError('');
    setSearchTerm(query);
  }

  function changeMediaType(value: MediaTypeFilter) {
    setMediaType(value);
  }
  return (
    <AppScreen contentStyle={styles.content}>
      <View style={styles.topBar}>
        <AppText style={[styles.wordmark, { color: colors.primary }]}>discern</AppText>
        <Badge label="FAMILY SETTINGS SAVED" tone="success" />
      </View>
      <View style={styles.hero}>
        <AppText variant="caption" tone="accent" style={styles.eyebrow}>A MORE PERSONAL WAY TO CHOOSE</AppText>
        <AppText variant="display" style={styles.headline}>Know what matters to your family.</AppText>
        <AppText tone="secondary">Your family profile and content boundaries are ready.</AppText>
      </View>
      <Card style={styles.card}>
        <AppText variant="subtitle" style={styles.title}>Search movies and series</AppText>
        <AppText tone="secondary">Search Discern’s catalog first. Broader metadata results appear when a provider is configured.</AppText>
        <SearchInput
          value={searchInput}
          onChangeText={setSearchInput}
          onSubmitEditing={submitSearch}
          accessibilityLabel="Search the media catalog"
          placeholder="Try a movie or series title"
        />
        {searchError ? <AppText tone="danger" variant="small" accessibilityLiveRegion="polite">{searchError}</AppText> : null}
        <View style={styles.filters} accessibilityRole="radiogroup" accessibilityLabel="Filter media type">
          {(['all', 'movie', 'tv'] as const).map((value) => {
            const selected = mediaType === value;
            const label = value === 'all' ? 'All titles' : value === 'movie' ? 'Movies' : 'Series';
            return (
              <Button
                key={value}
                label={label}
                variant={selected ? 'primary' : 'secondary'}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => changeMediaType(value)}
                style={styles.filterButton}
              />
            );
          })}
        </View>
        <Button label="Search" onPress={submitSearch} disabled={searchInput.trim().length < 2} />
      </Card>
      {search.isFetching ? <AppText tone="secondary" accessibilityLiveRegion="polite">Searching the catalog…</AppText> : null}
      {search.isError ? (
        <Card style={styles.card}>
          <AppText variant="subtitle" style={styles.title}>Search couldn’t load</AppText>
          <AppText tone="secondary">Check your connection and try again.</AppText>
          <Button label="Try again" variant="secondary" onPress={() => void search.refetch()} />
        </Card>
      ) : null}
      {search.data?.providerStatus === 'unavailable' ? (
        <AppText variant="small" tone="secondary">The metadata provider could not be reached; any local catalog matches are shown.</AppText>
      ) : null}
      {search.data?.providerStatus === 'not_configured' && search.data.results.length === 0 ? (
        <AppText variant="small" tone="secondary">No match in the current catalog. Broader metadata search is not configured yet.</AppText>
      ) : null}
      {search.data?.results.map((title) => (
        <Card key={title.id} style={styles.resultCard}>
          <View style={styles.resultHeading}>
            <AppText variant="subtitle" style={styles.title}>{title.title}</AppText>
            <Badge label={title.media_type === 'movie' ? 'MOVIE' : 'SERIES'} />
          </View>
          <AppText variant="small" tone="secondary">
            {[title.release_year, title.original_language?.toUpperCase()].filter(Boolean).join(' · ') || 'Release details unknown'}
          </AppText>
          {title.overview ? <AppText numberOfLines={3} tone="secondary">{title.overview}</AppText> : null}
          <AppText variant="caption" tone="secondary">Metadata only · Discern report not available here</AppText>
        </Card>
      ))}
      {normalizedSearch.length >= 2 && search.data?.results.length === 0 && search.data.providerStatus !== 'not_configured' ? (
        <AppText tone="secondary">No matches found. Missing metadata is not an indication that a title has no content concerns.</AppText>
      ) : null}
      <AppText variant="small" tone="secondary">You can update family profiles and preferences as Discern grows.</AppText>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.four, gap: spacing.six, maxWidth: 620, width: '100%', alignSelf: 'center' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  wordmark: { fontSize: 22, fontWeight: fontWeight.bold, letterSpacing: -0.8 },
  hero: { gap: spacing.three, paddingTop: spacing.four },
  eyebrow: { fontWeight: fontWeight.semibold, letterSpacing: 1.1 },
  headline: { maxWidth: 470, fontWeight: fontWeight.semibold, letterSpacing: -0.7 },
  title: { fontWeight: fontWeight.semibold },
  card: { gap: spacing.three },
  filters: { flexDirection: 'row', gap: spacing.two, flexWrap: 'wrap' },
  filterButton: { minHeight: 42, paddingHorizontal: spacing.three, paddingVertical: spacing.two },
  resultCard: { gap: spacing.two },
  resultHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.three },
});
