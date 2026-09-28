import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/services/supabase/client';

type AuthState =
  | { status: 'loading'; session: null; error: null; retry: () => void }
  | { status: 'missing-config'; session: null; error: null; retry: () => void }
  | { status: 'error'; session: null; error: string; retry: () => void }
  | { status: 'ready'; session: Session; error: null; retry: () => void };

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<Omit<AuthState, 'retry'>>(
    supabase ? { status: 'loading', session: null, error: null } : { status: 'missing-config', session: null, error: null },
  );
  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active && session) setState({ status: 'ready', session, error: null });
    });

    void (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;
      if (error) {
        setState({ status: 'error', session: null, error: error.message });
        return;
      }
      if (data.session) {
        setState({ status: 'ready', session: data.session, error: null });
        return;
      }
      const result = await supabase.auth.signInAnonymously();
      if (!active) return;
      if (result.error || !result.data.session) {
        setState({ status: 'error', session: null, error: result.error?.message ?? 'Could not start an anonymous session.' });
        return;
      }
      setState({ status: 'ready', session: result.data.session, error: null });
    })();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [attempt]);

  const value = useMemo(() => ({ ...state, retry }), [state, retry]) as AuthState;
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
