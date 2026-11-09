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
import { validateEmailFormat, evaluatePasswordStrength } from '@/services/authService';
import { isSupabaseConfigured } from '@/services/supabaseClient';
import { SolaceButton } from '@/components/solace';

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const { themeColors } = useTheme();
  const { signUp, signInWithGoogle } = useAuth();

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation & feedback state
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [termsError, setTermsError] = useState('');
  const [generalError, setGeneralError] = useState('');
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

  // Dynamic password strength (UI feedback only)
  const strength = evaluatePasswordStrength(password);

  const validateForm = (): boolean => {
    let isValid = true;
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setTermsError('');
    setGeneralError('');

    if (!name.trim()) {
      setNameError('Full name is required.');
      isValid = false;
    }

    if (!email.trim()) {
      setEmailError('Email address is required.');
      isValid = false;
    } else if (!validateEmailFormat(email)) {
      setEmailError('Please enter a valid email address.');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required.');
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password.');
      isValid = false;
    } else if (confirmPassword !== password) {
      setConfirmPasswordError('Passwords do not match.');
      isValid = false;
    }

    if (!termsAccepted) {
      setTermsError('You must agree to the Terms of Service to continue.');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const result = await signUp(name, email, password, termsAccepted);

      if (result.success) {
        // Navigate to home on success
        router.replace('/(tabs)/home');
      } else {
        setGeneralError(result.error || 'Account creation failed.');
      }
    } catch (err) {
      setGeneralError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTermsInfo = () => {
    Alert.alert(
      'Terms & Privacy Policy (Demo)',
      'Solace AI is a mental wellness prototype. By using this application, you understand that reflections and check-ins are for personal mindfulness only and do not constitute clinical psychological or medical advice. In this prototype, data is stored locally on your device.',
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
              Welcome to Solace
            </Text>
          </View>

          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Header Block with Glowing Emblem */}
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
                <View
                  style={[
                    styles.sparkleBadge,
                    { backgroundColor: themeColors.blush },
                  ]}>
                  <Text style={styles.sparkleIcon}>✨</Text>
                </View>
              </View>
            </View>

            <Text style={[styles.title, { color: themeColors.text }]}>
              Begin your journey to a calmer you.
            </Text>
            <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
              Create your personal wellness sanctuary.
            </Text>
          </View>

          {/* Mindful Intention Card Strip */}
          <View
            style={[
              styles.intentionCard,
              {
                backgroundColor: themeColors.secondary,
                borderColor: themeColors.border,
              },
            ]}>
            <View
              style={[
                styles.intentionIconBubble,
                { backgroundColor: themeColors.surface },
              ]}>
              <Text style={styles.intentionIcon}>🍃</Text>
            </View>
            <View style={styles.intentionTextWrapper}>
              <Text
                style={[
                  styles.intentionEyebrow,
                  { color: themeColors.secondary },
                ]}>
                MINDFUL INTENTION
              </Text>
              <Text
                style={[
                  styles.intentionQuote,
                  { color: themeColors.primary },
                ]}>
                “Your peace begins with a single breath.”
              </Text>
            </View>
          </View>

          {/* General Error Banner */}
          {generalError ? (
            <View
              style={[
                styles.errorBanner,
                {
                  backgroundColor: themeColors.errorContainer,
                  borderColor: themeColors.error,
                },
              ]}>
              <Text style={[styles.errorBannerText, { color: themeColors.error }]}>
                {generalError}
              </Text>
            </View>
          ) : null}

          {/* Form */}
          <View style={styles.form}>
            {/* Full Name Field */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: themeColors.text }]}>
                Full name
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: nameError
                      ? themeColors.error
                      : themeColors.border,
                    ...Shadows.card,
                  },
                ]}>
                <Text style={styles.inputIcon}>👤</Text>
                <TextInput
                  style={[styles.input, { color: themeColors.text }]}
                  placeholder="Maya Lin"
                  placeholderTextColor={themeColors.textMuted}
                  autoCapitalize="words"
                  autoCorrect={false}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (nameError) setNameError('');
                    if (generalError) setGeneralError('');
                  }}
                />
              </View>
              {nameError ? (
                <Text style={[styles.inlineError, { color: themeColors.error }]}>
                  {nameError}
                </Text>
              ) : null}
            </View>

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
              <Text style={[styles.inputLabel, { color: themeColors.text }]}>
                Password
              </Text>
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

              {/* Dynamic Password Strength Indicator (UI Feedback Only) */}
              {password.length > 0 ? (
                <View style={styles.strengthBlock}>
                  <View style={styles.strengthBarRow}>
                    <View
                      style={[
                        styles.strengthSegment,
                        {
                          backgroundColor:
                            strength.score >= 1
                              ? themeColors.secondary
                              : themeColors.surfaceHighest,
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.strengthSegment,
                        {
                          backgroundColor:
                            strength.score >= 2
                              ? themeColors.secondary
                              : themeColors.surfaceHighest,
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.strengthSegment,
                        {
                          backgroundColor:
                            strength.score >= 3
                              ? themeColors.primary
                              : themeColors.surfaceHighest,
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.strengthSegment,
                        {
                          backgroundColor:
                            strength.score >= 4
                              ? themeColors.primaryDark
                              : themeColors.surfaceHighest,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.strengthLabelRow}>
                    <Text
                      style={[
                        styles.strengthLabel,
                        { color: themeColors.secondary },
                      ]}>
                      {strength.isStrong ? '✓ ' : ''}
                      {strength.label}
                    </Text>
                    <Text
                      style={[
                        styles.strengthHelper,
                        { color: themeColors.textMuted },
                      ]}>
                      Min 8 characters
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>

            {/* Confirm Password Field */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: themeColors.text }]}>
                Confirm password
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: confirmPasswordError
                      ? themeColors.error
                      : themeColors.border,
                    ...Shadows.card,
                  },
                ]}>
                <Text style={styles.inputIcon}>🔐</Text>
                <TextInput
                  style={[styles.input, { color: themeColors.text }]}
                  placeholder="••••••••••••"
                  placeholderTextColor={themeColors.textMuted}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (confirmPasswordError) setConfirmPasswordError('');
                    if (generalError) setGeneralError('');
                  }}
                />
                <Pressable
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                  accessibilityRole="button"
                  accessibilityLabel={
                    showConfirmPassword ? 'Hide password' : 'Show password'
                  }>
                  <Text style={styles.eyeIcon}>
                    {showConfirmPassword ? '👁‍🗨' : '👁'}
                  </Text>
                </Pressable>
              </View>
              {confirmPasswordError ? (
                <Text style={[styles.inlineError, { color: themeColors.error }]}>
                  {confirmPasswordError}
                </Text>
              ) : null}
            </View>

            {/* Terms and Conditions Acceptance Checkbox */}
            <View style={styles.termsWrapper}>
              <Pressable
                onPress={() => {
                  setTermsAccepted(!termsAccepted);
                  if (termsError) setTermsError('');
                }}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: termsAccepted }}
                accessibilityLabel="Accept Terms of Service and Privacy Policy"
                style={styles.termsRow}>
                <View
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: termsAccepted
                        ? themeColors.primary
                        : themeColors.surface,
                      borderColor: termsError
                        ? themeColors.error
                        : termsAccepted
                        ? themeColors.primary
                        : themeColors.border,
                    },
                  ]}>
                  {termsAccepted ? (
                    <Text style={styles.checkboxCheck}>✓</Text>
                  ) : null}
                </View>

                <View style={styles.termsTextWrapper}>
                  <Text
                    style={[
                      styles.termsNormalText,
                      { color: themeColors.textSecondary },
                    ]}>
                    I agree to the{' '}
                    <Text
                      onPress={() => router.push('/terms')}
                      style={[
                        styles.termsLinkText,
                        { color: themeColors.secondary },
                      ]}>
                      Terms of Service
                    </Text>{' '}
                    and acknowledge the{' '}
                    <Text
                      onPress={() => router.push('/privacy')}
                      style={[
                        styles.termsLinkText,
                        { color: themeColors.secondary },
                      ]}>
                      Privacy Policy
                    </Text>
                  </Text>
                </View>
              </Pressable>
              {termsError ? (
                <Text style={[styles.inlineError, { color: themeColors.error }]}>
                  {termsError}
                </Text>
              ) : null}
            </View>

            {/* Primary Submit Button */}
            <SolaceButton
              title="Create Account"
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

          {/* Sign In Navigation Link */}
          <View style={styles.footerLinkRow}>
            <Text
              style={[
                styles.footerNormalText,
                { color: themeColors.textSecondary },
              ]}>
              Already have an account?{' '}
            </Text>
            <Pressable onPress={() => router.push('/login')}>
              <Text
                style={[
                  styles.footerActionText,
                  { color: themeColors.primary },
                ]}>
                Sign In
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
    paddingBottom: Spacing.xl,
  },
  headerBlock: {
    alignItems: 'center',
    textAlign: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  emblemContainer: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
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
    position: 'relative',
  },
  emblemIcon: {
    fontSize: 28,
  },
  sparkleBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleIcon: {
    fontSize: 10,
  },
  title: {
    fontFamily: FontFamilies.serif.medium,
    fontSize: 24,
    lineHeight: 30,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.bodySm,
    fontFamily: FontFamilies.sans.regular,
    textAlign: 'center',
    maxWidth: 280,
  },
  intentionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: Radii.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  intentionIconBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  intentionIcon: {
    fontSize: 18,
  },
  intentionTextWrapper: {
    flex: 1,
  },
  intentionEyebrow: {
    fontFamily: FontFamilies.sans.bold,
    fontSize: 9,
    letterSpacing: 1,
    marginBottom: 2,
  },
  intentionQuote: {
    fontFamily: FontFamilies.serif.medium,
    fontSize: 13,
    lineHeight: 17,
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
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: Spacing.sm + 4,
  },
  inputLabel: {
    fontFamily: FontFamilies.sans.semiBold,
    fontSize: 13,
    marginBottom: 6,
    paddingLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.full,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 10,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    fontFamily: FontFamilies.sans.regular,
    fontSize: 14,
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
  strengthBlock: {
    marginTop: 6,
    paddingHorizontal: 4,
  },
  strengthBarRow: {
    flexDirection: 'row',
    gap: 4,
    width: '100%',
    marginBottom: 4,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  strengthLabel: {
    fontFamily: FontFamilies.sans.semiBold,
    fontSize: 11,
  },
  strengthHelper: {
    fontFamily: FontFamilies.sans.regular,
    fontSize: 10,
  },
  termsWrapper: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
    paddingHorizontal: 4,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  checkboxCheck: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  termsTextWrapper: {
    flex: 1,
  },
  termsNormalText: {
    fontFamily: FontFamilies.sans.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  termsLinkText: {
    fontFamily: FontFamilies.sans.bold,
    textDecorationLine: 'underline',
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
});
