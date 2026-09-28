import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ModalProps,
  type PressableProps,
  type ScrollViewProps,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fontSize, fontWeight, radius, shadow, spacing } from '@/theme/tokens';
import { useAppColors } from '@/theme/use-app-colors';

type AppScreenProps = ScrollViewProps & {
  children: ReactNode;
  contentStyle?: ViewProps['style'];
};

export function AppScreen({ children, contentStyle, ...props }: AppScreenProps) {
  const colors = useAppColors();
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.fill, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.screenContent, contentStyle]}
        keyboardShouldPersistTaps="handled"
        {...props}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

type AppTextProps = TextProps & {
  variant?: 'display' | 'heading' | 'subtitle' | 'body' | 'small' | 'caption';
  tone?: 'primary' | 'secondary' | 'accent' | 'warning' | 'danger' | 'success';
};

export function AppText({ variant = 'body', tone = 'primary', style, ...props }: AppTextProps) {
  const colors = useAppColors();
  const toneColor = {
    primary: colors.textPrimary,
    secondary: colors.textSecondary,
    accent: colors.accent,
    warning: colors.warning,
    danger: colors.danger,
    success: colors.success,
  }[tone];
  const size = {
    display: fontSize.display,
    heading: fontSize.heading,
    subtitle: fontSize.subtitle,
    body: fontSize.body,
    small: fontSize.bodySmall,
    caption: fontSize.caption,
  }[variant];
  return (
    <Text
      allowFontScaling
      style={[{ color: toneColor, fontSize: size, lineHeight: size * 1.42 }, style]}
      {...props}
    />
  );
}

type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: 'primary' | 'secondary' | 'quiet';
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, variant = 'primary', loading = false, disabled, style, ...props }: ButtonProps) {
  const colors = useAppColors();
  const backgroundColor = variant === 'primary' ? colors.primary : variant === 'secondary' ? colors.surfaceSubtle : 'transparent';
  const foregroundColor = variant === 'primary' ? colors.onPrimary : colors.textPrimary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, busy: loading }}
      disabled={disabled || loading}
      style={[
        styles.button,
        { backgroundColor, opacity: disabled ? 0.5 : 1 },
        variant === 'secondary' && { borderWidth: 1, borderColor: colors.border },
        style,
      ]}
      {...props}>
      {loading ? <ActivityIndicator color={foregroundColor} /> : <AppText style={[styles.buttonText, { color: foregroundColor }]}>{label}</AppText>}
    </Pressable>
  );
}

type IconButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  icon: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({ label, icon, style, ...props }: IconButtonProps) {
  const colors = useAppColors();
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={8}
      style={[styles.iconButton, { backgroundColor: colors.surfaceSubtle }, style]}
      {...props}>
      {icon}
    </Pressable>
  );
}

export function Card({ children, style, ...props }: ViewProps & { children: ReactNode }) {
  const colors = useAppColors();
  return <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style]} {...props}>{children}</View>;
}

type BadgeProps = ViewProps & { label: string; tone?: 'neutral' | 'accent' | 'warning' | 'danger' | 'success' };

export function Badge({ label, tone = 'neutral', style }: BadgeProps) {
  const colors = useAppColors();
  const color = tone === 'neutral' ? colors.textSecondary : colors[tone];
  return <View style={[styles.badge, { backgroundColor: `${color}18` }, style]}><AppText variant="caption" style={{ color, fontWeight: fontWeight.semibold }}>{label}</AppText></View>;
}

export function Divider({ style }: ViewProps) {
  const colors = useAppColors();
  return <View accessibilityElementsHidden style={[styles.divider, { backgroundColor: colors.border }, style]} />;
}

type InputProps = TextInputProps & { label: string; hint?: string; error?: string };

export function Input({ label, hint, error, accessibilityLabel, style, ...props }: InputProps) {
  const colors = useAppColors();
  const help = error ?? hint;
  return (
    <View style={styles.inputGroup}>
      <AppText variant="small" style={styles.inputLabel}>{label}</AppText>
      <TextInput
        accessibilityLabel={accessibilityLabel ?? label}
        allowFontScaling
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, { backgroundColor: colors.surface, borderColor: error ? colors.danger : colors.border, color: colors.textPrimary }, style]}
        {...props}
      />
      {help ? <AppText variant="caption" tone={error ? 'danger' : 'secondary'} accessibilityLiveRegion={error ? 'polite' : 'none'}>{help}</AppText> : null}
    </View>
  );
}

export function SearchInput({ accessibilityLabel = 'Search titles', placeholder = 'Search movies and series', style, ...props }: TextInputProps) {
  const colors = useAppColors();
  return (
    <View style={[styles.searchInput, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>
      <AppText accessibilityElementsHidden style={{ color: colors.textSecondary, fontSize: 19 }}>⌕</AppText>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        allowFontScaling
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        returnKeyType="search"
        style={[styles.searchText, { color: colors.textPrimary }]}
        {...props}
      />
    </View>
  );
}

type OverlayProps = Omit<ModalProps, 'children'> & { children: ReactNode; onClose?: () => void };

export function AppModal({ children, onClose, ...props }: OverlayProps) {
  const colors = useAppColors();
  return (
    <Modal animationType="none" transparent onRequestClose={onClose} {...props}>
      <View style={[styles.modalScrim, { backgroundColor: colors.scrim }]}>
        <View accessibilityViewIsModal style={[styles.modalCard, { backgroundColor: colors.surface }]}>{children}</View>
      </View>
    </Modal>
  );
}

export function Sheet({ children, onClose, ...props }: OverlayProps) {
  const colors = useAppColors();
  return (
    <Modal animationType="none" transparent onRequestClose={onClose} {...props}>
      <View style={[styles.sheetScrim, { backgroundColor: colors.scrim }]}>
        <View accessibilityViewIsModal style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
          {children}
        </View>
      </View>
    </Modal>
  );
}

export function Skeleton({ width = '100%', height = 18, style }: { width?: number | `${number}%`; height?: number; style?: ViewProps['style'] }) {
  const colors = useAppColors();
  return <View accessibilityLabel="Loading" accessibilityRole="progressbar" style={[{ width, height, borderRadius: radius.small, backgroundColor: colors.surfaceSubtle }, style]} />;
}

export function Poster({ uri, accessibilityLabel = 'Title poster', style }: { uri?: string; accessibilityLabel?: string; style?: ViewProps['style'] }) {
  const colors = useAppColors();
  return (
    <View accessibilityLabel={accessibilityLabel} style={[styles.poster, { backgroundColor: colors.surfaceSubtle }, style]}>
      {uri ? <Image source={{ uri }} contentFit="cover" transition={0} style={StyleSheet.absoluteFill} accessibilityLabel={accessibilityLabel} /> : <AppText tone="secondary" variant="caption">DISCERN</AppText>}
    </View>
  );
}

export function SeverityMeter({ label, value, maximum = 4 }: { label: string; value: number; maximum?: number }) {
  const colors = useAppColors();
  const safeMaximum = Math.max(1, maximum);
  const safeValue = Math.min(safeMaximum, Math.max(0, value));
  return (
    <View accessibilityLabel={`${label}: ${safeValue} of ${safeMaximum}`} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: safeMaximum, now: safeValue }} style={styles.meterRow}>
      <AppText variant="small" style={styles.meterLabel}>{label}</AppText>
      <View accessibilityElementsHidden style={styles.meterTrack}>
        {Array.from({ length: safeMaximum }, (_, index) => <View key={index} style={[styles.meterSegment, { backgroundColor: index < safeValue ? colors.accent : colors.surfaceSubtle }]} />)}
      </View>
      <AppText variant="caption" tone="secondary">{safeValue}/{safeMaximum}</AppText>
    </View>
  );
}

export function ContentIndicator({ category, description, severity }: { category: string; description: string; severity: number }) {
  const colors = useAppColors();
  return (
    <View style={styles.indicator}>
      <View style={[styles.indicatorDot, { backgroundColor: severity >= 4 ? colors.danger : severity >= 2 ? colors.warning : colors.success }]} />
      <View style={styles.fill}>
        <AppText style={styles.indicatorTitle}>{category}</AppText>
        <AppText variant="small" tone="secondary">{description}</AppText>
      </View>
      <AppText accessibilityLabel={`Severity ${severity} of 4`} variant="caption" tone="secondary">{severity}/4</AppText>
    </View>
  );
}

export function MatchBadge({ match }: { match: 'fits' | 'review' | 'conflict' | 'unknown' }) {
  const label = { fits: 'Fits your boundaries', review: 'Review recommended', conflict: 'Boundary conflict', unknown: 'Not reviewed yet' }[match];
  const tone = { fits: 'success', review: 'warning', conflict: 'danger', unknown: 'neutral' }[match] as BadgeProps['tone'];
  return <Badge label={label} tone={tone} accessibilityLabel={label} />;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  screenContent: { padding: spacing.six, gap: spacing.four, paddingBottom: spacing.twelve },
  button: { minHeight: 52, borderRadius: radius.medium, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.five, paddingVertical: spacing.three },
  buttonText: { fontSize: fontSize.body, fontWeight: fontWeight.semibold },
  iconButton: { width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  card: { borderWidth: 1, borderRadius: radius.large, padding: spacing.five, gap: spacing.three, ...shadow.card },
  badge: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: spacing.three, paddingVertical: spacing.one },
  divider: { height: StyleSheet.hairlineWidth, width: '100%' },
  inputGroup: { gap: spacing.two },
  inputLabel: { fontWeight: fontWeight.semibold },
  input: { minHeight: 50, borderWidth: 1, borderRadius: radius.medium, paddingHorizontal: spacing.four, fontSize: fontSize.body },
  searchInput: { minHeight: 54, borderWidth: 1, borderRadius: radius.medium, paddingHorizontal: spacing.four, flexDirection: 'row', alignItems: 'center', gap: spacing.three },
  searchText: { flex: 1, minHeight: 50, fontSize: fontSize.body },
  modalScrim: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.six },
  modalCard: { width: '100%', maxWidth: 440, borderRadius: radius.large, padding: spacing.six, gap: spacing.four },
  sheetScrim: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: radius.large, borderTopRightRadius: radius.large, padding: spacing.six, paddingBottom: spacing.eight, gap: spacing.four },
  sheetHandle: { width: 38, height: 4, borderRadius: radius.pill, alignSelf: 'center', marginBottom: spacing.two },
  poster: { width: 112, aspectRatio: 2 / 3, borderRadius: radius.medium, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  meterRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.three },
  meterLabel: { flex: 1 },
  meterTrack: { flexDirection: 'row', gap: 3, width: 92 },
  meterSegment: { height: 8, flex: 1, borderRadius: radius.pill },
  indicator: { flexDirection: 'row', alignItems: 'center', gap: spacing.three },
  indicatorDot: { width: 9, height: 9, borderRadius: radius.pill },
  indicatorTitle: { fontWeight: fontWeight.semibold },
});
