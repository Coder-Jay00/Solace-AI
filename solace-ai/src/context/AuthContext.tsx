import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, User, AuthResult } from '@/services/authService';
import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signUp: (
    name: string,
    email: string,
    password: string,
    termsAccepted: boolean
  ) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore existing session from local storage on app launch
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const persistedUser = await authService.getPersistedSession();
        if (isMounted) {
          setUser(persistedUser);
        }
      } catch (err) {
        console.warn('[AuthProvider] Error restoring session:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();

    // Subscribe to reactive Supabase Auth state changes (OAuth logins, tokens refreshed, signouts)
    let authSubscription: { unsubscribe: () => void } | null = null;
    if (isSupabaseConfigured() && supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!isMounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          const sbUser = session.user;
          const name =
            sbUser.user_metadata?.full_name ||
            sbUser.user_metadata?.name ||
            (sbUser.user_metadata?.given_name
              ? `${sbUser.user_metadata.given_name} ${sbUser.user_metadata.family_name || ''}`.trim()
              : '') ||
            sbUser.user_metadata?.user_name ||
            sbUser.email?.split('@')[0] ||
            'Sanctuary Explorer';

          const avatarUrl =
            sbUser.user_metadata?.avatar_url ||
            sbUser.user_metadata?.picture ||
            undefined;

          setUser({
            id: sbUser.id,
            name,
            email: sbUser.email || '',
            avatarUrl,
            createdAt: sbUser.created_at || new Date().toISOString(),
            consentVersion: sbUser.user_metadata?.consent_version || '1.0.0',
            consentAcceptedAt: sbUser.user_metadata?.consent_accepted_at || new Date().toISOString(),
          });
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      });
      authSubscription = data?.subscription ?? null;
    }

    return () => {
      isMounted = false;
      authSubscription?.unsubscribe();
    };
  }, []);

  const handleSignUp = async (
    name: string,
    email: string,
    password: string,
    termsAccepted: boolean
  ): Promise<AuthResult> => {
    const result = await authService.signUp(name, email, password, termsAccepted);
    if (result.success && result.user) {
      setUser(result.user);
    }
    return result;
  };

  const handleSignIn = async (
    email: string,
    password: string
  ): Promise<AuthResult> => {
    const result = await authService.signIn(email, password);
    if (result.success && result.user) {
      setUser(result.user);
    }
    return result;
  };

  const handleGoogleSignIn = async (): Promise<AuthResult> => {
    const result = await authService.signInWithGoogle();
    if (result.success && result.user) {
      setUser(result.user);
    }
    return result;
  };

  const handleSignOut = async (): Promise<void> => {
    await authService.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signUp: handleSignUp,
        signIn: handleSignIn,
        signInWithGoogle: handleGoogleSignIn,
        signOut: handleSignOut,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

