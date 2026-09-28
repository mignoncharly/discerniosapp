import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { useColorScheme } from 'react-native';

import { queryClient } from '@/lib/query-client';
import { colorsForScheme } from '@/theme/tokens';
import { AuthProvider } from '@/features/auth/AuthProvider';

export default function RootLayout() {
  const scheme = useColorScheme();
  const colors = colorsForScheme(scheme);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <AuthProvider>
        <Stack initialRouteName="onboarding" screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
