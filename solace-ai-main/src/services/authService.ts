import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import Constants, { ExecutionEnvironment, AppOwnership } from 'expo-constants';
import { supabase, isSupabaseConfigured } from './supabaseClient';

// Complete any pending browser auth sessions on native/web
WebBrowser.maybeCompleteAuthSession();

// Safe reference whether running in React Native or environment with default export wrapper
const storage = (AsyncStorage as any)?.default ?? AsyncStorage;

/**
 * Solace AI Authentication Service
 * 
 * IMPORTANT ARCHITECTURAL & SECURITY NOTICE:
 * This is a local-first demonstration authentication service intended for prototyping.
 * 
 * In accordance with strict security standards:
 * - Passwords are NEVER persisted in plaintext.
 * - Passwords and password hashes are NEVER written to AsyncStorage.
 * - No custom or pseudo-cryptography is invented.
 * - Credentials exist strictly in volatile memory during the current app execution.
 * - Only the active user profile (id, name, email) and a demonstration session token
 *   are persisted in AsyncStorage to restore the session across restarts.
 * 
 * RESTART LIMITATION:
 * If the user logs out or the in-memory registry is cleared, re-authenticating with
 * a password requires a live backend (such as Supabase Auth in Phase 10). If an unauthenticated
 * user attempts to log in after the in-memory registry has been lost, a clear and honest
 * demonstration notice is returned.
 */

const AUTH_SESSION_KEY = '@solace_auth_session';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
  consentVersion?: string;
  consentAcceptedAt?: string;
}

export interface AuthSession {
  token: string;
  user: User;
  createdAt: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
  isRestartLimitation?: boolean;
  isCancelled?: boolean;
}

// Temporary in-memory user registry for the active runtime session
// Key: normalized email -> Value: { user, password }
const inMemoryUserRegistry = new Map<string, { user: User; password: string }>();

/**
 * Normalizes email address by trimming whitespace and converting to lowercase.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Validates email format using standard regular expression.
 */
export function validateEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Evaluates password strength for UI feedback only (not a cryptographic guarantee).
 * Returns score from 0 to 4 and status label.
 */
export function evaluatePasswordStrength(password: string): {
  score: number;
  label: string;
  isStrong: boolean;
} {
  if (!password) {
    return { score: 0, label: 'Enter password', isStrong: false };
  }
  if (password.length < 8) {
    return { score: 1, label: 'Too short (min 8 chars)', isStrong: false };
  }

  let score = 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  let label = 'Weak';
  if (score === 2) label = 'Fair';
  if (score === 3) label = 'Good';
  if (score >= 4) label = 'Strong sanctuary password';

  return { score, label, isStrong: score >= 3 };
}

/**
 * Accurately determines if the application is currently running inside the Expo Go client.
 */
export function isRunningInExpoGo(): boolean {
  return (
    Constants.appOwnership === AppOwnership.Expo ||
    Constants.appOwnership === 'expo' ||
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
    (Constants.executionEnvironment as string) === 'storeClient' ||
    Boolean(Constants.expoGoConfig) ||
    Boolean(Constants.linkingUri?.startsWith('exp://') || Constants.linkingUri?.startsWith('exps://'))
  );
}

/**
 * Dynamically resolves the exact OAuth callback redirect URI based on runtime environment:
 * - Expo Go: exp://<hostUri>/--/auth/callback (dynamically extracted from Metro bundler host, never hardcoded)
 * - Standalone / Production APK: solaceai://auth/callback (native scheme from app.json)
 */
export function getOAuthRedirectUri(): string {
  const isExpoGo = isRunningInExpoGo();

  if (isExpoGo) {
    // 1. Dynamic host from Metro bundler config (e.g., "192.168.1.15:8081" or "localhost:8081")
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      return `exp://${hostUri}/--/auth/callback`;
    }

    // 2. Linking URI provided by Expo Go launcher (e.g., "exp://192.168.1.15:8081")
    const linkingUri = Constants.linkingUri;
    if (linkingUri && (linkingUri.startsWith('exp://') || linkingUri.startsWith('exps://'))) {
      const cleanBase = linkingUri.replace(/\/--\/.*$/, '').replace(/\/$/, '');
      return `${cleanBase}/--/auth/callback`;
    }

    // 3. Fallback to Linking with explicit 'exp' scheme if available
    try {
      const created = Linking.createURL('auth/callback', { scheme: 'exp' });
      if (created.startsWith('exp://') || created.startsWith('exps://')) {
        return created;
      }
    } catch {
      // Fall through to default localhost
    }

    // 4. Safe fallback for Expo Go local testing
    return 'exp://localhost:8081/--/auth/callback';
  }

  // Standalone Android APK / iOS EAS build scheme
  return 'solaceai://auth/callback';
}

// In-flight code exchange promise deduplication to prevent double-exchange race condition
let activeCodeExchangePromise: Promise<AuthResult> | null = null;
let lastExchangedCodeKey: string | null = null;

export const authService = {
  /**
   * Registers a new user in the temporary in-memory registry and persists the session.
   * Credentials (password) are NEVER written to AsyncStorage.
   */
  async signUp(
    name: string,
    email: string,
    password: string,
    termsAccepted: boolean
  ): Promise<AuthResult> {
    const trimmedName = name.trim();
    const normalizedEmail = normalizeEmail(email);

    // 1. Validation checks
    if (!trimmedName) {
      return { success: false, error: 'Please enter your full name.' };
    }
    if (!normalizedEmail) {
      return { success: false, error: 'Please enter your email address.' };
    }
    if (!validateEmailFormat(normalizedEmail)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!password) {
      return { success: false, error: 'Please enter a password.' };
    }
    if (password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters long.' };
    }
    if (!termsAccepted) {
      return { success: false, error: 'Please accept the Terms of Service and Privacy Policy to continue.' };
    }

    // 2. If Supabase is configured, register with Supabase Auth
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              full_name: trimmedName,
              name: trimmedName,
              consent_version: '1.0.0',
              consent_accepted_at: new Date().toISOString(),
            },
          },
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (data.user) {
          const user: User = {
            id: data.user.id,
            name: trimmedName,
            email: normalizedEmail,
            createdAt: data.user.created_at || new Date().toISOString(),
            consentVersion: '1.0.0',
            consentAcceptedAt: new Date().toISOString(),
          };

          const session: AuthSession = {
            token: data.session?.access_token || `sb_session_${Date.now()}`,
            user,
            createdAt: new Date().toISOString(),
          };

          await storage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));

          return {
            success: true,
            user,
          };
        }
      } catch (err: any) {
        console.warn('[authService] Supabase signUp network error:', err);
        return { success: false, error: err?.message || 'Authentication service error.' };
      }
    }

    // 3. Fallback: Prevent duplicate email registration within current runtime
    if (inMemoryUserRegistry.has(normalizedEmail)) {
      return {
        success: false,
        error: 'An account with this email address already exists in this session. Please sign in.',
      };
    }

    // 4. Create local demonstration user profile
    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: trimmedName,
      email: normalizedEmail,
      createdAt: new Date().toISOString(),
      consentVersion: '1.0.0',
      consentAcceptedAt: new Date().toISOString(),
    };

    // 5. Store credentials ONLY in volatile in-memory registry for the current runtime
    inMemoryUserRegistry.set(normalizedEmail, {
      user: newUser,
      password,
    });

    // 6. Create demonstration session (Contains only User profile and session token, NEVER passwords)
    const session: AuthSession = {
      token: `demo_session_${Date.now()}`,
      user: newUser,
      createdAt: new Date().toISOString(),
    };

    try {
      await storage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    } catch (storageError) {
      console.warn('[authService] Failed to persist session:', storageError);
    }

    return {
      success: true,
      user: newUser,
    };
  },

  /**
   * Authenticates user using Supabase Auth (when configured) or the in-memory registry.
   */
  async signIn(email: string, password: string): Promise<AuthResult> {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return { success: false, error: 'Please enter your email address.' };
    }
    if (!validateEmailFormat(normalizedEmail)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!password) {
      return { success: false, error: 'Please enter your password.' };
    }

    // If Supabase is configured, sign in with Supabase Auth
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (data.user) {
          const name =
            data.user.user_metadata?.full_name ||
            data.user.user_metadata?.name ||
            normalizedEmail.split('@')[0];

          const user: User = {
            id: data.user.id,
            name,
            email: normalizedEmail,
            createdAt: data.user.created_at || new Date().toISOString(),
            consentVersion: data.user.user_metadata?.consent_version || '1.0.0',
            consentAcceptedAt: data.user.user_metadata?.consent_accepted_at,
          };

          const session: AuthSession = {
            token: data.session?.access_token || `sb_session_${Date.now()}`,
            user,
            createdAt: new Date().toISOString(),
          };

          await storage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));

          return {
            success: true,
            user,
          };
        }
      } catch (err: any) {
        console.warn('[authService] Supabase signIn network error:', err);
        return { success: false, error: err?.message || 'Failed to connect to authentication service.' };
      }
    }

    const record = inMemoryUserRegistry.get(normalizedEmail);

    // If account was not created during this current app execution
    if (!record) {
      return {
        success: false,
        error:
          'Account not found in the active demonstration session. Because passwords are never stored locally on device without a cloud backend, accounts created in previous app launches cannot be authenticated with a password. Please create a new account to test.',
        isRestartLimitation: true,
      };
    }

    // Check credentials against in-memory record
    if (record.password !== password) {
      return {
        success: false,
        error: 'Incorrect password. Please verify and try again.',
      };
    }

    // Create and persist demonstration session
    const session: AuthSession = {
      token: `demo_session_${Date.now()}`,
      user: record.user,
      createdAt: new Date().toISOString(),
    };

    try {
      await storage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    } catch (storageError) {
      console.warn('[authService] Failed to persist session:', storageError);
    }

    return {
      success: true,
      user: record.user,
    };
  },

  /**
   * Restores persisted session from Supabase or AsyncStorage on app startup.
   */
  async getPersistedSession(): Promise<User | null> {
    try {
      if (isSupabaseConfigured() && supabase) {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          const sbUser = data.session.user;
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

          return {
            id: sbUser.id,
            name,
            email: sbUser.email || '',
            avatarUrl,
            createdAt: sbUser.created_at,
            consentVersion: sbUser.user_metadata?.consent_version || '1.0.0',
            consentAcceptedAt: sbUser.user_metadata?.consent_accepted_at,
          };
        }
      }

      const raw = await storage.getItem(AUTH_SESSION_KEY);
      if (!raw) return null;

      const parsed: AuthSession = JSON.parse(raw);
      if (parsed && parsed.user && parsed.token) {
        return parsed.user;
      }
      return null;
    } catch (error) {
      console.warn('[authService] Failed to restore session from storage:', error);
      return null;
    }
  },

  /**
   * Helper to construct and persist a standardized Solace User and Session from Supabase user data.
   */
  async buildAndPersistSessionFromSupabase(sbUser: any, token?: string): Promise<AuthResult> {
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

    const email = sbUser.email || sbUser.user_metadata?.email || '';

    const user: User = {
      id: sbUser.id,
      name,
      email,
      avatarUrl,
      createdAt: sbUser.created_at || new Date().toISOString(),
      consentVersion: sbUser.user_metadata?.consent_version || '1.0.0',
      consentAcceptedAt: sbUser.user_metadata?.consent_accepted_at || new Date().toISOString(),
    };

    const session: AuthSession = {
      token: token || `sb_session_${Date.now()}`,
      user,
      createdAt: new Date().toISOString(),
    };

    try {
      await storage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    } catch (e) {
      console.warn('[authService] Failed to persist session:', e);
    }

    // Populate or sync Supabase public.profiles table with Google user metadata
    if (isSupabaseConfigured() && supabase) {
      Promise.resolve(
        supabase
          .from('profiles')
          .upsert(
            {
              id: sbUser.id,
              email,
              full_name: name,
              avatar_url: avatarUrl || null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          )
      )
        .then((res: any) => {
          if (res?.error) console.warn('[authService] profiles upsert note:', res.error.message);
        })
        .catch((err: any) => console.warn('[authService] profiles upsert error:', err));
    }

    return {
      success: true,
      user,
    };
  },

  /**
   * Processes an incoming OAuth deep link callback URL (e.g., solaceai://auth/callback?code=...).
   * Uses in-flight deduplication to ensure PKCE authorization codes are never exchanged twice.
   */
  async handleAuthCallbackUrl(url: string): Promise<AuthResult> {
    if (!isSupabaseConfigured() || !supabase) {
      console.warn('[Auth Stage: Configuration Check] Supabase is not configured');
      return { success: false, error: 'Supabase authentication is not configured.' };
    }

    try {
      console.log('[Auth Stage 4: App redirect received] Processing incoming callback');

      // 1. Check for PKCE authorization code (?code=...)
      const codeMatch = url.match(/[?&]code=([^&#]+)/);
      if (codeMatch) {
        const code = decodeURIComponent(codeMatch[1]);
        console.log('[Auth Stage 3: Supabase callback reached] Detected PKCE authorization code parameter in URL');

        // Check if this exact code was already exchanged
        if (lastExchangedCodeKey === code) {
          console.log('[Auth Stage 4: App redirect received] Code already exchanged. Verifying active session.');
          const { data: currentSession } = await supabase.auth.getSession();
          if (currentSession?.session?.user) {
            console.log('[Auth Stage 5: Session exchange completed] Active session reused from prior exchange');
            return await this.buildAndPersistSessionFromSupabase(
              currentSession.session.user,
              currentSession.session.access_token
            );
          }
        }

        // If an exchange for this code is already in flight, wait for it rather than double-exchanging
        if (activeCodeExchangePromise) {
          console.log('[Auth Stage 4: App redirect received] Parallel exchange detected. Awaiting in-flight exchange.');
          return await activeCodeExchangePromise;
        }

        activeCodeExchangePromise = (async () => {
          try {
            console.log('[Auth Stage 4: App redirect received] Initiating exchangeCodeForSession with Supabase');
            const { data: exchangeData, error: exchangeError } =
              await supabase.auth.exchangeCodeForSession(code);

            if (exchangeError) {
              // Before failing, check if another process already established the session
              console.warn('[Auth Stage 5: Session exchange failed] PKCE exchange error:', exchangeError.message);
              const { data: fallbackSession } = await supabase.auth.getSession();
              if (fallbackSession?.session?.user) {
                console.log('[Auth Stage 5: Session exchange completed] Recovered via active session fallback');
                return await this.buildAndPersistSessionFromSupabase(
                  fallbackSession.session.user,
                  fallbackSession.session.access_token
                );
              }
              return { success: false, error: exchangeError.message };
            }

            if (exchangeData?.user && exchangeData.session) {
              lastExchangedCodeKey = code;
              console.log('[Auth Stage 5: Session exchange completed] PKCE code exchange succeeded');
              return await this.buildAndPersistSessionFromSupabase(
                exchangeData.user,
                exchangeData.session.access_token
              );
            }

            return {
              success: false,
              error: 'Session data not returned from authorization exchange.',
            };
          } finally {
            activeCodeExchangePromise = null;
          }
        })();

        return await activeCodeExchangePromise;
      }

      // 2. Check for implicit grant hash tokens (#access_token=...&refresh_token=...)
      const hashIndex = url.indexOf('#');
      if (hashIndex !== -1) {
        const hashParams = new URLSearchParams(url.substring(hashIndex + 1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          console.log('[Auth Stage 3: Supabase callback reached] Detected implicit grant tokens in hash');
          console.log('[Auth Stage 4: App redirect received] Setting Supabase session from hash tokens');
          const { data: sessionData, error: setSessionError } =
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

          if (setSessionError) {
            console.warn('[Auth Stage 5: Session exchange failed] setSession error:', setSessionError.message);
            return { success: false, error: setSessionError.message };
          }

          if (sessionData?.user && sessionData.session) {
            console.log('[Auth Stage 5: Session exchange completed] Session established from tokens');
            return await this.buildAndPersistSessionFromSupabase(
              sessionData.user,
              sessionData.session.access_token
            );
          }
        }
      }

      // 3. Fallback: check if client already received and cached session
      console.log('[Auth Stage 4: App redirect received] Checking existing client session cache');
      const { data: currentSession } = await supabase.auth.getSession();
      if (currentSession?.session?.user) {
        console.log('[Auth Stage 5: Session exchange completed] Active session found in client cache');
        return await this.buildAndPersistSessionFromSupabase(
          currentSession.session.user,
          currentSession.session.access_token
        );
      }

      console.warn('[Auth Stage 5: Session exchange failed] No valid code, token, or session found in callback');
      return {
        success: false,
        error: 'Authentication did not complete. Please try signing in again.',
      };
    } catch (err: any) {
      console.warn('[Auth Stage 5: Session exchange failed] Exception in handleAuthCallbackUrl:', err?.message || err);
      return {
        success: false,
        error: err?.message || 'Failed to exchange authentication token.',
      };
    }
  },

  /**
   * Initiates actual Google OAuth authentication flow using Supabase Auth.
   * Opens the in-app browser and redirects back to the configured deep link.
   */
  async signInWithGoogle(): Promise<AuthResult> {
    if (!isSupabaseConfigured() || !supabase) {
      console.warn('[Auth Stage 1: OAuth initiated] Supabase credentials missing');
      return {
        success: false,
        error:
          'Supabase credentials are not configured in .env. Please configure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to enable Google OAuth.',
      };
    }

    try {
      // 1. Detect environment and resolve dynamic callback URI (Expo Go vs Standalone)
      const isExpoGo = isRunningInExpoGo();
      const redirectUrl = getOAuthRedirectUri();
      console.log(`[Auth Stage 1: OAuth initiated] Runtime Environment: ${isExpoGo ? 'Expo Go' : 'Standalone Build'}`);
      console.log(`[Auth Stage 1: OAuth initiated] Provider: google | Redirect URI: ${redirectUrl}`);

      // 2. Request OAuth authorization URL from Supabase with the dynamic redirect target
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        console.warn('[Auth Stage 1: OAuth initiated] signInWithOAuth error:', error.message);
        return { success: false, error: error.message };
      }

      if (!data?.url) {
        console.warn('[Auth Stage 1: OAuth initiated] No authorization URL returned');
        return {
          success: false,
          error: 'Unable to initialize Google authentication service.',
        };
      }

      // 3. Inspect and verify redirect_to parameter inside generated authorization URL
      try {
        const parsedAuthUrl = new URL(data.url);
        const serverRedirectTo = parsedAuthUrl.searchParams.get('redirect_to');
        console.log('[Auth Stage 1: OAuth initiated] Supabase authorize URL redirect_to target:', serverRedirectTo);
      } catch {
        // Safe query param logging fallback
        const match = data.url.match(/[?&]redirect_to=([^&#]+)/);
        if (match) {
          console.log('[Auth Stage 1: OAuth initiated] Supabase authorize URL redirect_to target:', decodeURIComponent(match[1]));
        }
      }

      console.log('[Auth Stage 1: OAuth initiated] Opening secure in-app browser session');

      // 4. Open in-app browser session with an active timeout protection
      const AUTH_TIMEOUT_MS = 60000; // 60s timeout
      let timeoutId: any;
      const timeoutPromise = new Promise<{ type: 'timeout' }>((resolve) => {
        timeoutId = setTimeout(() => resolve({ type: 'timeout' }), AUTH_TIMEOUT_MS);
      });

      const browserPromise = WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUrl
      );

      const browserResult = await Promise.race([browserPromise, timeoutPromise]);
      clearTimeout(timeoutId);

      console.log('[Auth Stage 2: Google authorization completed] Browser returned result type:', browserResult.type);

      // Handle timeout
      if (browserResult.type === 'timeout') {
        // Double check if session arrived in the background
        const { data: bgSession } = await supabase.auth.getSession();
        if (bgSession?.session?.user) {
          console.log('[Auth Stage 5: Session exchange completed] Session verified despite browser timeout');
          return await this.buildAndPersistSessionFromSupabase(
            bgSession.session.user,
            bgSession.session.access_token
          );
        }

        try {
          WebBrowser.dismissBrowser?.();
        } catch {}

        console.warn('[Auth Stage 2: Timeout] Google authentication browser session timed out');
        return {
          success: false,
          error: `Google sign-in timed out. If the browser redirected to localhost:3000, please verify that your exact Expo Go redirect URL (${redirectUrl}) is added to your Supabase Project -> Authentication -> URL Configuration -> Redirect URLs.`,
        };
      }

      // Handle user cancellation/dismissal
      if (browserResult.type === 'cancel' || browserResult.type === 'dismiss') {
        // Double check if session was established despite dismiss (common behavior on Android Custom Tabs)
        const { data: checkSession } = await supabase.auth.getSession();
        if (checkSession?.session?.user) {
          console.log('[Auth Stage 5: Session exchange completed] Session recovered after browser dismiss');
          return await this.buildAndPersistSessionFromSupabase(
            checkSession.session.user,
            checkSession.session.access_token
          );
        }

        console.log('[Auth Stage 2: Google authorization completed] User cancelled or dismissed browser');
        return {
          success: false,
          error: 'Sign in was cancelled.',
          isCancelled: true,
        };
      }

      // Handle successful browser redirect
      if (browserResult.type === 'success' && browserResult.url) {
        console.log('[Auth Stage 3: Supabase callback reached] Redirect URL captured from browser result');
        return await this.handleAuthCallbackUrl(browserResult.url);
      }

      // Secondary check: verify if session was established in parallel via deep link
      const { data: activeSession } = await supabase.auth.getSession();
      if (activeSession?.session?.user) {
        console.log('[Auth Stage 5: Session exchange completed] Session established via deep link route');
        return await this.buildAndPersistSessionFromSupabase(
          activeSession.session.user,
          activeSession.session.access_token
        );
      }

      console.warn('[Auth Stage 5: Session exchange failed] No session established after browser closed');
      return {
        success: false,
        error: 'Google authentication was not completed.',
      };
    } catch (err: any) {
      console.warn('[Auth Stage: Exception] Google OAuth flow error:', err?.message || err);
      return {
        success: false,
        error: err?.message || 'An error occurred during Google authentication.',
      };
    }
  },

  /**
   * Signs out the user by clearing the session from Supabase and AsyncStorage.
   */
  async signOut(): Promise<void> {
    try {
      if (isSupabaseConfigured() && supabase) {
        await supabase.auth.signOut().catch(() => {});
      }
      await storage.removeItem(AUTH_SESSION_KEY);
    } catch (error) {
      console.warn('[authService] Failed to clear session:', error);
    }
  },

  /**
   * Clears in-memory registry (for testing or reset actions).
   */
  clearInMemoryRegistry(): void {
    inMemoryUserRegistry.clear();
  },
};
