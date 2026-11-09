import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontFamilies, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { validateEmailFormat } from '@/services/authService';
import { isSupabaseConfigured } from '@/services/supabaseClient';
import { SolaceButton } from '@/components/solace';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { themeColors } = useTheme();
  const { signIn, signInWithGoogle } = useAuth();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Validation & feedback state
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [isRestartLimitation, setIsRestartLimitation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  useEffect(() => {
    const onBackPress = () => {
      if (router.canGoBack()) {
        router.back();
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, []);

  const validateForm = (): boolean => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setGeneralError('');
    setIsRestartLimitation(false);

    if (!email.trim()) {
      setEmailError('Email address is required.');
      isValid = false;
    } else if (!validateEmailFormat(email)) {
      setEmailError('Please enter a valid email address (e.g. you@sanctuary.com).');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required.');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const result = await signIn(email, password);

      if (result.success) {
        // Navigate to home on success
        router.replace('/(tabs)/home');
      } else {
        setGeneralError(result.error || 'Authentication failed.');
        if (result.isRestartLimitation) {
          setIsRestartLimitation(true);
        }
      }
    } catch (err) {
      setGeneralError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Demonstration Prototype Notice',
      'Password recovery requires a connected remote authentication service (such as Supabase in Phase 10). In this local prototype, accounts exist only in temporary memory during the current app run.',
      [{ text: 'Understood' }]
    );
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleSubmitting(true);
    setGeneralError('');

    try {
      const result = await signInWithGoogle();
      if (result.success) {
        router.replace('/(tabs)/home');
      } else if (!result.isCancelled) {
        setGeneralError(result.error || 'Google sign in failed. Please try again.');
      }
    } catch (err: any) {
      setGeneralError(err?.message || 'An unexpected error occurred during Google sign in.');
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: themeColors.background,
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}>
        {/* Ambient Top Glow */}
        <View
          style={[
            styles.ambientGlow,
            { backgroundColor: themeColors.secondary, opacity: 0.3 },
          ]}
        />

        {/* Top Navigation Row */}
        <View style={styles.topRow}>
          {router.canGoBack() ? (
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={[
                styles.backButton,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                },
              ]}>
              <Text style={[styles.backIcon, { color: themeColors.primary }]}>←</Text>
            </Pressable>
          ) : (
            <View style={{ width: 40 }} />
          )}

          <View
            style={[
              styles.headerPill,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
              },
            ]}>
            <View
              style={[
                styles.headerPillDot,
                { backgroundColor: themeColors.primary },
              ]}
            />
            <Text
              style={[
                styles.headerPillText,
                { color: themeColors.primary },
              ]}>
              Welcome back
            </Text>
          </View>

          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Header & Botanical Emblem */}
          <View style={styles.headerBlock}>
            <View style={styles.emblemContainer}>
              <View
                style={[
                  styles.emblemHalo,
                  { backgroundColor: themeColors.blush, opacity: 0.5 },
                ]}
              />
              <View
                style={[
                  styles.emblemCircle,
                  {
                    backgroundColor: themeColors.surfaceElevated,
                    borderColor: themeColors.border,
                    ...Shadows.card,
                  },
                ]}>
                <Text style={styles.emblemIcon}>🌿</Text>
              </View>
            </View>

            <Text style={[styles.title, { color: themeColors.text }]}>
              Welcome back to your sanctuary.
            </Text>
            <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
              Your peaceful space is waiting for you.
            </Text>
          </View>

          {/* Mindful Pause Card Strip */}
          <View
            style={[
              styles.pauseCard,
              {
                backgroundColor: themeColors.secondary,
                borderColor: themeColors.border,
              },
            ]}>
            <View style={styles.pauseLeft}>
              <Text
                style={[
                  styles.pauseEyebrow,
                  { color: themeColors.primary },
                ]}>
                MINDFUL PAUSE
              </Text>
              <Text style={[styles.pauseTitle, { color: themeColors.text }]}>
                Breathe in stillness, exhale the day.
              </Text>
            </View>
            <View
              style={[
                styles.pauseBubble,
                { backgroundColor: themeColors.blush },
              ]}>
              <Text style={styles.pauseBubbleIcon}>🌸</Text>
            </View>
          </View>

          {/* General Error Banner */}
          {generalError ? (
            <View
              style={[
                styles.errorBanner,
                {
                  backgroundColor: isRestartLimitation
                    ? themeColors.surfaceLow
                    : themeColors.errorContainer,
                  borderColor: isRestartLimitation
                    ? themeColors.secondary
                    : themeColors.error,
                },
              ]}>
              <Text
                style={[
                  styles.errorBannerText,
                  {
                    color: isRestartLimitation
                      ? themeColors.primary
                      : themeColors.error,
                  },
                ]}>
                {generalError}
              </Text>
              {isRestartLimitation ? (
                <Pressable
                  onPress={() => router.push('/signup')}
                  style={styles.errorBannerAction}>
                  <Text
                    style={[
                      styles.errorBannerActionText,
                      { color: themeColors.secondary },
                    ]}>
                    Create a new test account →
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {/* Form */}
          <View style={styles.form}>
            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: themeColors.text }]}>
                Email address
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: emailError
                      ? themeColors.error
                      : themeColors.border,
                    ...Shadows.card,
                  },
                ]}>
                <Text style={styles.inputIcon}>✉</Text>
                <TextInput
                  style={[styles.input, { color: themeColors.text }]}
                  placeholder="you@sanctuary.com"
                  placeholderTextColor={themeColors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailError) setEmailError('');
                    if (generalError) setGeneralError('');
                  }}
                />
              </View>
              {emailError ? (
                <Text style={[styles.inlineError, { color: themeColors.error }]}>
                  {emailError}
                </Text>
              ) : null}
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <View style={styles.passwordLabelRow}>
                <Text style={[styles.inputLabel, { color: themeColors.text }]}>
                  Password
                </Text>
                <Pressable onPress={handleForgotPassword}>
                  <Text
                    style={[
                      styles.forgotPasswordText,
                      { color: themeColors.secondary },
                    ]}>
                    Forgot password?
                  </Text>
                </Pressable>
              </View>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: passwordError
                      ? themeColors.error
                      : themeColors.border,
                    ...Shadows.card,
                  },
                ]}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={[styles.input, { color: themeColors.text }]}
                  placeholder="••••••••••••"
                  placeholderTextColor={themeColors.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (passwordError) setPasswordError('');
                    if (generalError) setGeneralError('');
                  }}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
                  <Text style={styles.eyeIcon}>
                    {showPassword ? '👁‍🗨' : '👁'}
                  </Text>
                </Pressable>
              </View>
              {passwordError ? (
                <Text style={[styles.inlineError, { color: themeColors.error }]}>
                  {passwordError}
                </Text>
              ) : null}
            </View>

            {/* Primary Submit Button */}
            <SolaceButton
              title="Sign In"
              onPress={handleSubmit}
              loading={isSubmitting}
              variant="primary"
              size="lg"
              style={styles.submitButton}
            />
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View
              style={[
                styles.dividerLine,
                { backgroundColor: themeColors.surfaceHighest },
              ]}
            />
            <Text style={[styles.dividerText, { color: themeColors.textMuted }]}>
              or continue with
            </Text>
            <View
              style={[
                styles.dividerLine,
                { backgroundColor: themeColors.surfaceHighest },
              ]}
            />
          </View>

          {/* Google Sign In Button */}
          <Pressable
            onPress={handleGoogleSignIn}
            disabled={isGoogleSubmitting || isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
            style={({ pressed }) => [
              styles.socialButton,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
                opacity: isGoogleSubmitting || isSubmitting ? 0.7 : 1,
                ...Shadows.card,
              },
              pressed && { opacity: 0.8 },
            ]}>
            {isGoogleSubmitting ? (
              <ActivityIndicator size="small" color={themeColors.primary} />
            ) : (
              <>
                <Text style={styles.socialIcon}>G</Text>
                <Text style={[styles.socialText, { color: themeColors.text }]}>
                  Continue with Google
                </Text>
                {!isSupabaseConfigured() && (
                  <View
                    style={[
                      styles.demoTag,
                      { backgroundColor: themeColors.surfaceLow },
                    ]}>
                    <Text
                      style={[
                        styles.demoTagText,
                        { color: themeColors.textMuted },
                      ]}>
                      Demo
                    </Text>
                  </View>
                )}
              </>
            )}
          </Pressable>

          {/* Sign Up Navigation Link */}
          <View style={styles.footerLinkRow}>
            <Text
              style={[
                styles.footerNormalText,
                { color: themeColors.textSecondary },
              ]}>
              New to Solace?{' '}
            </Text>
            <Pressable onPress={() => router.push('/signup')}>
              <Text
                style={[
                  styles.footerActionText,
                  { color: themeColors.primary },
                ]}>
                Create an account
              </Text>
            </Pressable>
          </View>

          {/* Privacy & Trust Badge */}
          <View
            style={[
              styles.trustBadge,
              {
                backgroundColor: themeColors.surfaceLow,
                borderColor: themeColors.border,
              },
            ]}>
            <Text style={styles.trustBadgeIcon}>🔒</Text>
            <Text
              style={[
                styles.trustBadgeText,
                { color: themeColors.textSecondary },
              ]}>
              {isSupabaseConfigured()
                ? 'Cloud Sanctuary • Secure & Private Session'
                : 'Demonstration Prototype • Local-First Session'}
            </Text>
          </View>

          {/* Legal Links Footer */}
          <View style={styles.legalLinksRow}>
            <Pressable
              onPress={() => router.push('/terms')}
              accessibilityRole="button"
              accessibilityLabel="View Terms of Service">
              <Text style={[styles.legalLink, { color: themeColors.secondary }]}>
                Terms of Service
              </Text>
            </Pressable>
            <Text style={[styles.legalDot, { color: themeColors.textMuted }]}>•</Text>
            <Pressable
              onPress={() => router.push('/privacy')}
              accessibilityRole="button"
              accessibilityLabel="View Privacy Policy">
              <Text style={[styles.legalLink, { color: themeColors.secondary }]}>
                Privacy Policy
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.marginMobile,
  },
  ambientGlow: {
    position: 'absolute',
    top: -40,
    alignSelf: 'center',
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    minHeight: 44,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  headerPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  headerPillText: {
    fontFamily: FontFamilies.sans.bold,
    fontSize: 11,
    letterSpacing: 0.4,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: Spacing.lg,
  },
  headerBlock: {
    alignItems: 'center',
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  emblemContainer: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  emblemHalo: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  emblemCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemIcon: {
    fontSize: 28,
  },
  title: {
    fontFamily: FontFamilies.serif.medium,
    fontSize: 26,
    lineHeight: 32,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.bodySm,
    fontFamily: FontFamilies.sans.regular,
    textAlign: 'center',
    maxWidth: 280,
  },
  pauseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: Radii.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  pauseLeft: {
    flex: 1,
    paddingRight: 8,
  },
  pauseEyebrow: {
    fontFamily: FontFamilies.sans.bold,
    fontSize: 9,
    letterSpacing: 1,
    marginBottom: 2,
  },
  pauseTitle: {
    fontFamily: FontFamilies.serif.medium,
    fontSize: 14,
    lineHeight: 18,
  },
  pauseBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseBubbleIcon: {
    fontSize: 20,
  },
  errorBanner: {
    padding: 12,
    borderRadius: Radii.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  errorBannerText: {
    fontFamily: FontFamilies.sans.medium,
    fontSize: 12,
    lineHeight: 18,
  },
  errorBannerAction: {
    marginTop: 6,
  },
  errorBannerActionText: {
    fontFamily: FontFamilies.sans.bold,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontFamily: FontFamilies.sans.semiBold,
    fontSize: 13,
    marginBottom: 6,
    paddingLeft: 4,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingLeft: 4,
  },
  forgotPasswordText: {
    fontFamily: FontFamilies.sans.medium,
    fontSize: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.full,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 50,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 10,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    fontFamily: FontFamilies.sans.regular,
    fontSize: 15,
    height: '100%',
  },
  eyeButton: {
    padding: 6,
  },
  eyeIcon: {
    fontSize: 16,
    opacity: 0.7,
  },
  inlineError: {
    fontFamily: FontFamilies.sans.medium,
    fontSize: 11,
    marginTop: 4,
    paddingLeft: 8,
  },
  submitButton: {
    marginTop: Spacing.xs,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontFamily: FontFamilies.sans.medium,
    fontSize: 11,
    paddingHorizontal: 10,
    textTransform: 'lowercase',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: Radii.full,
    borderWidth: 1,
    position: 'relative',
  },
  socialIcon: {
    fontSize: 16,
    fontFamily: FontFamilies.sans.bold,
    marginRight: 8,
    color: '#4285F4',
  },
  socialText: {
    fontFamily: FontFamilies.sans.semiBold,
    fontSize: 14,
  },
  demoTag: {
    position: 'absolute',
    right: 14,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radii.full,
  },
  demoTagText: {
    fontFamily: FontFamilies.sans.bold,
    fontSize: 9,
    textTransform: 'uppercase',
  },
  footerLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  footerNormalText: {
    fontFamily: FontFamilies.sans.regular,
    fontSize: 13,
  },
  footerActionText: {
    fontFamily: FontFamilies.sans.bold,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radii.full,
    borderWidth: 1,
    alignSelf: 'center',
    marginTop: Spacing.sm,
  },
  trustBadgeIcon: {
    fontSize: 11,
    marginRight: 5,
  },
  trustBadgeText: {
    fontFamily: FontFamilies.sans.medium,
    fontSize: 10,
  },
  legalLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  legalLink: {
    fontFamily: FontFamilies.sans.medium,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  legalDot: {
    marginHorizontal: 8,
    fontSize: 12,
  },
});
