import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import { hasSupabaseConfiguration, publicEnvironment } from '@/lib/env';

const authStorage = {
  getItem: (key: string) =>
    Platform.OS === 'web'
      ? Promise.resolve(typeof localStorage === 'undefined' ? null : localStorage.getItem(key))
      : SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
      return Promise.resolve();
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
      return Promise.resolve();
    }
    return SecureStore.deleteItemAsync(key);
  },
};

export const supabase = hasSupabaseConfiguration
  ? createClient(
      publicEnvironment.EXPO_PUBLIC_SUPABASE_URL!,
      publicEnvironment.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        auth: {
          storage: authStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      },
    )
  : null;
