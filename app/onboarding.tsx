import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useForm, useWatch } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { AppScreen, AppText, Badge, Button, Card } from '@/components/primitives';
import { useAuth } from '@/features/auth/AuthProvider';
import { supabase } from '@/services/supabase/client';
import { fontWeight, radius, spacing } from '@/theme/tokens';
import { useAppColors } from '@/theme/use-app-colors';

const ageGroups = [
  { value: 'under_6', label: 'Under 6' }, { value: '6_8', label: '6–8' },
  { value: '9_11', label: '9–11' }, { value: '12_14', label: '12–14' },
  { value: '15_17', label: '15–17' }, { value: 'adults', label: 'Adults' },
] as const;
const categories = [
  { slug: 'sexual_content', label: 'Sexual content' }, { slug: 'nudity', label: 'Nudity' },
  { slug: 'language', label: 'Language' }, { slug: 'violence', label: 'Violence' },
  { slug: 'gore', label: 'Gore' }, { slug: 'fear_horror', label: 'Fear / horror' },
  { slug: 'occult_supernatural', label: 'Occult / supernatural' },
  { slug: 'drugs_alcohol_smoking', label: 'Drugs / alcohol / smoking' },
  { slug: 'gambling', label: 'Gambling' }, { slug: 'self_harm_suicide', label: 'Self-harm / suicide' },
  { slug: 'religious_language', label: 'Religious language' }, { slug: 'mature_themes', label: 'Mature themes' },
] as const;
type CategorySlug = (typeof categories)[number]['slug'];
type Preference = 'avoid' | 'warn' | 'allow';
type Values = { ageGroup: (typeof ageGroups)[number]['value'] | ''; preferences: Record<CategorySlug, Preference> };
const defaults = Object.fromEntries(categories.map(({ slug }) => [slug, 'warn'])) as Record<CategorySlug, Preference>;
const schema = z.object({
  ageGroup: z.enum(['under_6', '6_8', '9_11', '12_14', '15_17', 'adults']),
  preferences: z.record(z.string(), z.enum(['avoid', 'warn', 'allow'])).refine(
    (prefs) => categories.every(({ slug }) => slug in prefs) && Object.keys(prefs).length === categories.length,
    'Choose a setting for every content category.',
  ),
});

export default function OnboardingScreen() {
  const colors = useAppColors();
  const router = useRouter();
  const auth = useAuth();
  const [step, setStep] = useState(0);
  const [profileState, setProfileState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [profileAttempt, setProfileAttempt] = useState(0);
  const [profileError, setProfileError] = useState('');
  const [saveError, setSaveError] = useState('');
  const form = useForm<Values>({ defaultValues: { ageGroup: '', preferences: defaults } });
  const values = useWatch({ control: form.control }) as Values;
  const selectedAgeGroup = ageGroups.find(({ value }) => value === values.ageGroup);
  const counts = categories.reduce((result, { slug }) => {
    result[values.preferences[slug]] += 1;
    return result;
  }, { avoid: 0, warn: 0, allow: 0 });

  useEffect(() => {
    if (auth.status !== 'ready' || !supabase) return;
    let active = true;
    void (async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('onboarding_completed').eq('user_id', auth.session.user.id).maybeSingle();
        if (!active) return;
        if (error) { setProfileError(error.message); setProfileState('error'); return; }
        if (data?.onboarding_completed) router.replace('/home');
        else setProfileState('ready');
      } catch (error) {
        if (!active) return;
        setProfileError(error instanceof Error ? error.message : 'Could not load family settings.');
        setProfileState('error');
      }
    })();
    return () => { active = false; };
  }, [auth, router, profileAttempt]);

  async function finish(values: Values) {
    const parsed = schema.safeParse(values);
    if (!parsed.success) { setSaveError(parsed.error.issues[0]?.message ?? 'Check your selections and try again.'); return; }
    if (!supabase) return;
    setSaveError('');
    try {
      const { error } = await supabase.rpc('complete_family_onboarding', {
        p_age_group: parsed.data.ageGroup, p_preferences: parsed.data.preferences,
      });
      if (error) { setSaveError(error.message); return; }
      router.replace('/home');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save your family settings. Try again.');
    }
  }

  if (auth.status === 'loading' || (auth.status === 'ready' && profileState === 'loading')) {
    return <MessageScreen title="Getting your family space ready" body="Starting a private family profile…" />;
  }
  if (auth.status === 'missing-config') {
    return <MessageScreen title="One setup step remains" body="Add the Supabase project URL and publishable key to your local environment, then restart the app." />;
  }
  if (auth.status === 'error') {
    return <MessageScreen title="We couldn’t start your family space" body={auth.error} action={<Button label="Try again" onPress={auth.retry} />} />;
  }
  if (auth.status !== 'ready') return null;
  if (profileState === 'error') {
    return <MessageScreen title="We couldn’t load your family settings" body={profileError} action={<Button label="Try again" onPress={() => { setProfileError(''); setProfileState('loading'); setProfileAttempt((value) => value + 1); }} />} />;
  }

  const visibleCategories = step === 2 ? categories.slice(0, 6) : categories.slice(6);
  return (
    <AppScreen contentStyle={styles.content}>
      <View style={styles.topBar}>
        <AppText style={[styles.wordmark, { color: colors.primary }]}>discern</AppText>
        <Badge label={`STEP ${step + 1} OF 5`} tone="accent" />
      </View>
      <View style={[styles.progress, { backgroundColor: colors.surfaceSubtle }]} accessibilityLabel={`Onboarding step ${step + 1} of 5`} accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: 5, now: step + 1 }}>
        <View style={[styles.progressFill, { backgroundColor: colors.accent, width: `${((step + 1) / 5) * 100}%` }]} />
      </View>

      {step === 0 ? <>
        <View style={styles.hero}>
          <AppText variant="caption" tone="accent" style={styles.eyebrow}>A MORE PERSONAL WAY TO CHOOSE</AppText>
          <AppText variant="display" style={styles.headline}>Find out whether entertainment fits your family.</AppText>
          <AppText tone="secondary">Clear details about what’s on screen, shaped around the boundaries you choose.</AppText>
        </View>
        <Card style={styles.card}>
          <AppText variant="subtitle" style={styles.title}>Your choices stay yours</AppText>
          <AppText tone="secondary">Start without an email or password. You can explore first and decide later whether to save your settings to an account.</AppText>
        </Card>
      </> : null}

      {step === 1 ? <View style={styles.section}>
        <AppText variant="heading" style={styles.title}>Who are these settings for?</AppText>
        <AppText tone="secondary">Choose an age range. Exact birthdays and children’s names aren’t needed.</AppText>
        <View style={styles.options}>{ageGroups.map(({ value, label }) =>
          <Choice key={value} label={label} selected={values.ageGroup === value} onPress={() => form.setValue('ageGroup', value, { shouldDirty: true })} />
        )}</View>
      </View> : null}

      {step === 2 || step === 3 ? <View style={styles.section}>
        <AppText variant="heading" style={styles.title}>Set the boundaries that matter</AppText>
        <AppText tone="secondary">Choose how Discern should highlight each topic for your family. You can change these later.</AppText>
        {visibleCategories.map(({ slug, label }) => <Card key={slug} style={styles.categoryCard}>
          <AppText variant="small" style={styles.categoryLabel}>{label}</AppText>
          <View style={styles.preferenceOptions}>{(['avoid', 'warn', 'allow'] as const).map((preference) =>
            <Choice key={preference} compact label={preference === 'warn' ? 'Warn me' : preference === 'allow' ? 'Okay' : 'Avoid'}
              selected={values.preferences[slug] === preference}
              onPress={() => form.setValue(`preferences.${slug}`, preference, { shouldDirty: true })} />
          )}</View>
        </Card>)}
      </View> : null}

      {step === 4 ? <View style={styles.section}>
        <AppText variant="heading" style={styles.title}>Your family, your boundaries</AppText>
        <AppText tone="secondary">Based on your choices, Discern will highlight what matters to your family.</AppText>
        <Card style={styles.card}>
          <Badge label="PERSONALIZED EXAMPLE" tone="accent" />
          <AppText variant="subtitle" style={styles.title}>{selectedAgeGroup?.label ?? 'Your family'} profile</AppText>
          <AppText tone="secondary">We’ll call out {counts.avoid} topics to avoid and give you a heads-up about {counts.warn} topics. Your family’s choices guide the match; they aren’t a universal rating.</AppText>
        </Card>
        <AppText variant="small" tone="secondary">You can adjust these settings later. No child names or exact birth dates are collected.</AppText>
        {saveError ? <AppText variant="small" tone="danger" accessibilityLiveRegion="polite">{saveError}</AppText> : null}
      </View> : null}

      <View style={styles.footer}>
        {step > 0 ? <Button label="Back" variant="secondary" style={styles.footerButton} onPress={() => setStep((value) => value - 1)} /> : null}
        {step < 4 ? <Button label={step === 0 ? 'Set up my family' : 'Continue'} style={styles.footerButton}
          disabled={step === 1 && !values.ageGroup} onPress={() => setStep((value) => value + 1)} />
          : <Button label="Search something" loading={form.formState.isSubmitting} style={styles.footerButton} onPress={form.handleSubmit(finish)} />}
      </View>
    </AppScreen>
  );
}

function Choice({ label, selected, onPress, compact = false }: { label: string; selected: boolean; onPress: () => void; compact?: boolean }) {
  const colors = useAppColors();
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={onPress}
    style={[styles.choice, compact && styles.compactChoice, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.surfaceSubtle : colors.surface }]}>
    <AppText variant="small" style={{ color: selected ? colors.primary : colors.textSecondary, fontWeight: selected ? fontWeight.semibold : fontWeight.regular }}>{label}</AppText>
  </Pressable>;
}

function MessageScreen({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return <AppScreen contentStyle={styles.messageContent}>
    <AppText style={[styles.wordmark, { color: '#29423C' }]}>discern</AppText>
    <AppText variant="heading" style={styles.title}>{title}</AppText><AppText tone="secondary">{body}</AppText>{action}
  </AppScreen>;
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.four, paddingBottom: spacing.eight, gap: spacing.four, maxWidth: 620, width: '100%', alignSelf: 'center' },
  messageContent: { paddingTop: spacing.eight, gap: spacing.four, maxWidth: 560, width: '100%', alignSelf: 'center' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  wordmark: { fontSize: 22, fontWeight: fontWeight.bold, letterSpacing: -0.8 },
  progress: { height: 5, overflow: 'hidden', borderRadius: radius.pill },
  progressFill: { height: '100%', borderRadius: radius.pill },
  hero: { gap: spacing.three, paddingTop: spacing.six },
  eyebrow: { fontWeight: fontWeight.semibold, letterSpacing: 1.1 },
  headline: { maxWidth: 510, fontWeight: fontWeight.semibold, letterSpacing: -0.7 },
  title: { fontWeight: fontWeight.semibold },
  section: { gap: spacing.four, paddingTop: spacing.three },
  card: { gap: spacing.three },
  options: { gap: spacing.two },
  choice: { minHeight: 48, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderRadius: radius.medium, paddingHorizontal: spacing.three, paddingVertical: spacing.two },
  compactChoice: { flex: 1, minHeight: 42, paddingHorizontal: spacing.one },
  categoryCard: { gap: spacing.three, padding: spacing.three },
  categoryLabel: { fontWeight: fontWeight.semibold },
  preferenceOptions: { flexDirection: 'row', gap: spacing.two },
  footer: { flexDirection: 'row', gap: spacing.two, paddingTop: spacing.two },
  footerButton: { flex: 1 },
});
