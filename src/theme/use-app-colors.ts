import { useColorScheme } from 'react-native';

import { colorsForScheme } from '@/theme/tokens';

export function useAppColors() {
  return colorsForScheme(useColorScheme());
}
