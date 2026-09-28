import type { ColorSchemeName } from 'react-native';

const light = {
  background: '#F6F6F1',
  surface: '#FFFFFF',
  surfaceSubtle: '#ECEFE9',
  textPrimary: '#1C2825',
  textSecondary: '#66736D',
  border: '#DCE3DC',
  primary: '#29423C',
  onPrimary: '#FFFFFF',
  accent: '#B88345',
  warning: '#A85C1A',
  danger: '#A33F3B',
  success: '#42705A',
  scrim: 'rgba(18, 28, 25, 0.46)',
} as const;

const dark = {
  background: '#121A18',
  surface: '#1B2522',
  surfaceSubtle: '#25312D',
  textPrimary: '#F0F2ED',
  textSecondary: '#A8B3AC',
  border: '#35423C',
  primary: '#B7CEC2',
  onPrimary: '#14201B',
  accent: '#D2A66C',
  warning: '#EAA85E',
  danger: '#E1847C',
  success: '#8BC0A0',
  scrim: 'rgba(0, 0, 0, 0.68)',
} as const;

export type AppColors = { [Key in keyof typeof light]: string };

export const colorsForScheme = (scheme: ColorSchemeName): AppColors =>
  scheme === 'dark' ? dark : light;

export const spacing = {
  zero: 0,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
  eight: 32,
  ten: 40,
  twelve: 48,
} as const;

export const radius = {
  small: 8,
  medium: 14,
  large: 20,
  pill: 999,
} as const;

export const fontSize = {
  caption: 12,
  bodySmall: 14,
  body: 16,
  subtitle: 18,
  heading: 24,
  display: 34,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const shadow = {
  card: {
    shadowColor: '#17231E',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
} as const;
