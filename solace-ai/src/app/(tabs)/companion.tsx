/**
 * Solace AI - AI Companion Conversational Interface
 * Phase 6: AI Companion Chat Interface & Chat History
 *
 * Faithfully matches Google Stitch design:
 * solace-design-reference/companion/
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
  Keyboard,
  BackHandler,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '@/components/solace';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { isSupabaseConfigured } from '@/services/supabaseClient';
import { chatService } from '@/services/chatService';
import { aiCompanionService } from '@/services/aiCompanionService';
import {
  Conversation,
  ChatMessage,
  SUGGESTED_PROMPTS,
  EMERGENCY_RESOURCES,
} from '@/types/chat';
import { FontFamilies, Radii, Shadows, Spacing, Typography } from '@/constants/theme';

export default function CompanionScreen() {
  const insets = useSafeAreaInsets();
  const { themeColors } = useTheme();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ conversationId?: string }>();

  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [inputText, setInputText] = useState<string>('');
  const [isReflecting, setIsReflecting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showResourcesModal, setShowResourcesModal] = useState<boolean>(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState<boolean>(false);

  const scrollViewRef = useRef<any>(null);
  const isNearBottomRef = useRef<boolean>(true);

  const userName = user?.name ? user.name.split(' ')[0] : 'friend';

  // Listen to keyboard visibility and handle Android hardware back to dismiss keyboard first
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setIsKeyboardVisible(true);
        if (isNearBottomRef.current) {
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 150);
        }
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );

    const onBackPress = () => {
      if (isKeyboardVisible) {
        Keyboard.dismiss();
        return true;
      }
      return false;
    };
    const backSub = BackHandler.addEventListener('hardwareBackPress', onBackPress);

    return () => {
      showSub.remove();
      hideSub.remove();
      backSub.remove();
    };
  }, [isKeyboardVisible]);

  // Track whether user is near the bottom to prevent forcible autoscroll when reviewing past history
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 80;
    const isBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    isNearBottomRef.current = isBottom;
  };

  // Load conversation on focus or when conversationId param changes
  const loadConversation = useCallback(async () => {
    const userId = user?.id || 'guest_user';
    setIsLoading(true);

    try {
      if (params.conversationId) {
        const found = await chatService.getConversationById(userId, params.conversationId);
        if (found) {
          setActiveConversation(found);
          setIsLoading(false);
          return;
        }
      }

      // If no ID or not found, load most recently updated conversation with its full message history
      const list = await chatService.getConversations(userId);
      if (list.length > 0) {
        const fullConv = await chatService.getConversationById(userId, list[0].id);
        setActiveConversation(fullConv || list[0]);
      } else {
        // Create initial fresh conversation
        const fresh = await chatService.createConversation(userId, 'New Reflection');
        setActiveConversation(fresh);
      }
    } catch (error) {
      console.warn('[CompanionScreen] Failed to load conversation:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, params.conversationId]);

  useFocusEffect(
    useCallback(() => {
      loadConversation();
    }, [loadConversation])
  );

  // Auto-scroll to bottom when messages change, respecting manual scroll-up position
  useEffect(() => {
    if (activeConversation?.messages && activeConversation.messages.length > 0) {
      if (isNearBottomRef.current) {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    }
  }, [activeConversation?.messages?.length, isReflecting]);

  const handleStartNewConversation = async () => {
    const userId = user?.id || 'guest_user';
    try {
      const fresh = await chatService.createConversation(userId, 'New Reflection');
      setActiveConversation(fresh);
      setInputText('');
      isNearBottomRef.current = true;
    } catch (error) {
      console.warn('[CompanionScreen] Failed to create new conversation:', error);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || inputText).trim();
    if (!messageText || isReflecting) return;

    isNearBottomRef.current = true;
    const userId = user?.id || 'guest_user';
    let currentConv = activeConversation;

    if (!currentConv) {
      currentConv = await chatService.createConversation(userId, 'New Reflection');
      setActiveConversation(currentConv);
    }

    setInputText('');
    setIsReflecting(true);

    try {
      // Prior message history before adding this new user prompt
      const priorHistory = (currentConv.messages || []).map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      // 1. Persist user message
      const { conversation: convAfterUser } = await chatService.addMessageToConversation(
        userId,
        currentConv.id,
        'user',
        messageText
      );
      setActiveConversation(convAfterUser);

      // 2. Generate AI response (Supabase Edge Function / Gemini with graceful local fallback)
      const reply = await aiCompanionService.generateReply(
        messageText,
        userName,
        currentConv.id,
        priorHistory
      );

      // 3. Persist assistant reply
      const { conversation: convAfterAssistant } = await chatService.addMessageToConversation(
        userId,
        currentConv.id,
        'assistant',
        reply.text,
        reply.isCrisis
      );
      setActiveConversation(convAfterAssistant);
    } catch (error) {
      console.error('[CompanionScreen] Error during conversation exchange:', error);
    } finally {
      setIsReflecting(false);
    }
  };

  const handleRetryLastMessage = async () => {
    if (!activeConversation || isReflecting) return;
    const userMessages = activeConversation.messages.filter((m) => m.sender === 'user');
    if (userMessages.length === 0) return;
    const lastUserMsg = userMessages[userMessages.length - 1];
    const userId = user?.id || 'guest_user';

    setIsReflecting(true);
    isNearBottomRef.current = true;

    // Prior messages before this user message
    const lastUserIndex = activeConversation.messages.findIndex((m) => m.id === lastUserMsg.id);
    const priorHistory = (lastUserIndex > 0 ? activeConversation.messages.slice(0, lastUserIndex) : []).map((m) => ({
      sender: m.sender,
      text: m.text,
    }));

    try {
      const reply = await aiCompanionService.generateReply(
        lastUserMsg.text,
        userName,
        activeConversation.id,
        priorHistory
      );

      const { conversation: convAfterAssistant } = await chatService.addMessageToConversation(
        userId,
        activeConversation.id,
        'assistant',
        reply.text,
        reply.isCrisis
      );
      setActiveConversation(convAfterAssistant);
    } catch (error) {
      console.error('[CompanionScreen] Error during retry:', error);
    } finally {
      setIsReflecting(false);
    }
  };

  const formatMessageTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <View style={[styles.mainWrapper, { backgroundColor: themeColors.background }]}>
          {/* Sub-Header Sanctuary Bar */}
          <View style={styles.topSanctuaryBar}>
            <View style={styles.companionIdentity}>
              <View style={[styles.avatarGlowCircle, { backgroundColor: themeColors.blush }]}>
                <Text style={styles.lotusIcon}>🌿</Text>
              </View>
              <View style={styles.identityDetails}>
                <Text style={[styles.companionTitle, { color: themeColors.primary }]}>
                  Solace Companion
                </Text>
                <View style={styles.presenceRow}>
                  <View style={[styles.liveDot, { backgroundColor: themeColors.primary }]} />
                  <Text style={[styles.presenceText, { color: themeColors.primary }]}>
                    Present & Listening
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.topActionsRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Chat History"
                onPress={() => router.push('/chat-history')}
                style={({ pressed }) => [
                  styles.iconButton,
                  { backgroundColor: themeColors.secondary },
                  pressed && styles.pressed,
                ]}>
                <Text style={[styles.iconButtonText, { color: themeColors.primary }]}>📜</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="New Conversation"
                onPress={handleStartNewConversation}
                style={({ pressed }) => [
                  styles.iconButton,
                  { backgroundColor: themeColors.secondary },
                  pressed && styles.pressed,
                ]}>
                <Text style={[styles.iconButtonText, { color: themeColors.primary }]}>＋</Text>
              </Pressable>
            </View>
          </View>

          {/* Safety & Gentle Care Notice */}
          <View
            style={[
              styles.safetyNoticeBanner,
              { backgroundColor: themeColors.secondary },
            ]}>
            <Text style={styles.safetyIcon}>🌱</Text>
            <Text style={[styles.safetyText, { color: themeColors.textSecondary }]}>
              Solace is a supportive wellness space, not a medical clinic. In crisis?{' '}
              <Text
                onPress={() => setShowResourcesModal(true)}
                style={[styles.safetyLink, { color: themeColors.primary }]}>
                Tap care resources
              </Text>.
            </Text>
          </View>

          {/* Conversation Area */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.chatScrollView}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={styles.chatScrollContent}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={themeColors.primary} size="small" />
              </View>
            ) : !activeConversation?.messages || activeConversation.messages.length === 0 ? (
              /* Empty Conversation: Welcoming Editorial Greeting & Prompts */
              <Pressable onPress={Keyboard.dismiss} style={styles.emptyWelcomeContainer}>
                <View
                  style={[
                    styles.greetingCard,
                    {
                      backgroundColor: themeColors.surfaceElevated,
                      borderColor: themeColors.border,
                    },
                    Shadows.card,
                  ]}>
                  <View style={styles.greetingHeaderRow}>
                    <Text style={styles.greetingSparkle}>✨</Text>
                    <Text style={[styles.greetingCategory, { color: themeColors.primary }]}>
                      GENTLE REFLECTION
                    </Text>
                  </View>
                  <Text style={[styles.greetingTitle, { color: themeColors.primary }]}>
                    Hi {userName}, I'm here for you. What's on your mind today?
                  </Text>
                  <Text style={[styles.greetingSubtext, { color: themeColors.textSecondary }]}>
                    Take your time. No rush, no expectations, zero judgment.
                  </Text>
                </View>

                {/* Conversation Starters */}
                <View style={styles.startersSection}>
                  <Text style={[styles.startersHeader, { color: themeColors.textSecondary }]}>
                    GENTLE STARTERS
                  </Text>
                  <View style={styles.startersGrid}>
                    {SUGGESTED_PROMPTS.map((starter) => (
                      <Pressable
                        key={starter.id}
                        accessibilityRole="button"
                        accessibilityLabel={starter.label}
                        onPress={() => handleSendMessage(starter.prompt)}
                        style={({ pressed }) => [
                          styles.starterChip,
                          {
                            backgroundColor: themeColors.surfaceElevated,
                            borderColor: themeColors.border,
                          },
                          Shadows.card,
                          pressed && styles.pressed,
                        ]}>
                        <Text style={styles.starterEmoji}>{starter.emoji}</Text>
                        <Text style={[styles.starterLabel, { color: themeColors.text }]}>
                          {starter.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </Pressable>
            ) : (
              /* Active Message Stream */
              <View style={styles.messagesList}>
                {activeConversation.messages.map((message) => {
                  const isUser = message.sender === 'user';
                  return (
                    <View
                      key={message.id}
                      style={[
                        styles.messageRow,
                        isUser ? styles.userRow : styles.assistantRow,
                      ]}>
                      {!isUser && (
                        <View
                          style={[
                            styles.assistantAvatar,
                            { backgroundColor: themeColors.secondary },
                          ]}>
                          <Text style={styles.assistantAvatarIcon}>🌿</Text>
                        </View>
                      )}

                      <View
                        style={[
                          styles.messageBubbleWrapper,
                          isUser ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' },
                        ]}>
                        <View
                          style={[
                            styles.messageBubble,
                            isUser
                              ? [
                                  styles.userBubble,
                                  { backgroundColor: themeColors.primary },
                                ]
                              : [
                                  styles.assistantBubble,
                                  {
                                    backgroundColor: message.isCrisis
                                      ? themeColors.errorContainer
                                      : themeColors.surfaceElevated,
                                    borderColor: message.isCrisis
                                      ? themeColors.error
                                      : themeColors.border,
                                    borderWidth: 1,
                                  },
                                  Shadows.card,
                                ],
                          ]}>
                          <Text
                            style={[
                              styles.messageText,
                              {
                                color: isUser
                                  ? themeColors.onPrimary
                                  : message.isCrisis
                                  ? themeColors.error
                                  : themeColors.text,
                              },
                            ]}>
                            {message.text}
                          </Text>
                        </View>

                        {/* Crisis Emergency Shortcut */}
                        {message.isCrisis && (
                          <Pressable
                            onPress={() => setShowResourcesModal(true)}
                            style={[
                              styles.crisisPillButton,
                              { backgroundColor: themeColors.primary },
                            ]}>
                            <Text style={[styles.crisisPillButtonText, { color: themeColors.onPrimary }]}>
                              View 24/7 Lifelines & Emergency Help →
                            </Text>
                          </Pressable>
                        )}

                        {/* Connection Retry Button */}
                        {!isUser && message.text.includes('temporarily unable to connect') && (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Retry reflection"
                            onPress={handleRetryLastMessage}
                            style={[
                              styles.retryPillButton,
                              {
                                backgroundColor: themeColors.surfaceElevated,
                                borderColor: themeColors.border,
                              },
                            ]}>
                            <Text style={[styles.retryPillButtonText, { color: themeColors.primary }]}>
                              ↻ Tap to Retry Reflection
                            </Text>
                          </Pressable>
                        )}

                        <Text style={[styles.timestampText, { color: themeColors.textMuted }]}>
                          {isUser ? userName : 'Solace'} • {formatMessageTime(message.createdAt)}
                        </Text>
                      </View>
                    </View>
                  );
                })}

                {/* Solace Reflecting Indicator */}
                {isReflecting && (
                  <View style={styles.reflectingRow}>
                    <View
                      style={[
                        styles.reflectingPill,
                        { backgroundColor: themeColors.secondary },
                      ]}>
                      <Text style={[styles.reflectingText, { color: themeColors.primary }]}>
                        Solace is reflecting
                      </Text>
                      <ActivityIndicator color={themeColors.primary} size="small" />
                    </View>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Input Sanctuary Capsule */}
          <View
            style={[
              styles.inputContainer,
              { paddingBottom: isKeyboardVisible ? Spacing.sm : Spacing.xs },
            ]}>
            <View
              style={[
                styles.inputCapsule,
                {
                  backgroundColor: themeColors.surfaceElevated,
                  borderColor: themeColors.border,
                },
                Shadows.card,
              ]}>
              <TextInput
                style={[styles.textInput, { color: themeColors.text }]}
                placeholder="Type a thought, feeling, or reflection..."
                placeholderTextColor={themeColors.textMuted}
                multiline
                value={inputText}
                onChangeText={setInputText}
              />

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Send reflection"
                disabled={!inputText.trim() || isReflecting}
                onPress={() => handleSendMessage()}
                style={({ pressed }) => [
                  styles.sendButton,
                  {
                    backgroundColor: inputText.trim()
                      ? themeColors.primary
                      : themeColors.secondary,
                  },
                  pressed && styles.pressed,
                ]}>
                <Text
                  style={[
                    styles.sendButtonArrow,
                    { color: inputText.trim() ? themeColors.onPrimary : themeColors.textMuted },
                  ]}>
                  ↑
                </Text>
              </Pressable>
            </View>

            <Text style={[styles.footnoteText, { color: themeColors.textMuted }]}>
              {isSupabaseConfigured() && user?.email
                ? '✦ Solace AI Sanctuary • Cloud Synchronized'
                : 'Local Mindfulness Mode • Private Local Storage'}
            </Text>
          </View>
        </View>

        {/* Emergency Resources Modal */}
        <Modal
          visible={showResourcesModal}
          transparent
          animationType="fade">
          <View style={[styles.modalOverlay, { backgroundColor: themeColors.overlay }]}>
            <View
              style={[
                styles.resourcesModalCard,
                { backgroundColor: themeColors.surfaceElevated },
                Shadows.floating,
              ]}>
              <Text style={[styles.modalHeading, { color: themeColors.primary }]}>
                Support & Emergency Resources
              </Text>
              <Text style={[styles.modalSubheading, { color: themeColors.textSecondary }]}>
                Solace is a mindfulness space and cannot replace human professional care. Help is free, confidential, and available right now.
              </Text>

              <ScrollView style={styles.resourcesList}>
                {EMERGENCY_RESOURCES.map((item, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.resourceItem,
                      { backgroundColor: themeColors.secondary },
                    ]}>
                    <Text style={[styles.resourceName, { color: themeColors.text }]}>
                      {item.name} ({item.region})
                    </Text>
                    <Text style={[styles.resourceContact, { color: themeColors.primary }]}>
                      {item.contact}
                    </Text>
                    <Text style={[styles.resourceNote, { color: themeColors.textSecondary }]}>
                      {item.note}
                    </Text>
                  </View>
                ))}
              </ScrollView>

              <Pressable
                accessibilityRole="button"
                onPress={() => setShowResourcesModal(false)}
                style={({ pressed }) => [
                  styles.closeModalButton,
                  { backgroundColor: themeColors.primary },
                  pressed && styles.pressed,
                ]}>
                <Text style={[styles.closeModalButtonText, { color: themeColors.onPrimary }]}>
                  Return to Companion
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
  },
  topSanctuaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.marginMobile,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  companionIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarGlowCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lotusIcon: {
    fontSize: 22,
  },
  identityDetails: {
    flex: 1,
  },
  companionTitle: {
    ...Typography.headlineSm,
    fontFamily: FontFamilies.serif.medium,
  },
  presenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  presenceText: {
    fontSize: 12,
    fontFamily: FontFamilies.sans.medium,
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  safetyNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.marginMobile,
    marginVertical: Spacing.xs,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.sm,
    gap: 8,
  },
  safetyIcon: {
    fontSize: 15,
  },
  safetyText: {
    fontSize: 11,
    fontFamily: FontFamilies.sans.regular,
    lineHeight: 16,
    flex: 1,
  },
  safetyLink: {
    fontFamily: FontFamilies.sans.bold,
    textDecorationLine: 'underline',
  },
  chatScrollView: {
    flex: 1,
  },
  chatScrollContent: {
    paddingHorizontal: Spacing.marginMobile,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyWelcomeContainer: {
    gap: Spacing.lg,
    paddingTop: Spacing.xs,
  },
  greetingCard: {
    borderRadius: Radii.md,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  greetingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  greetingSparkle: {
    fontSize: 13,
  },
  greetingCategory: {
    fontSize: 11,
    fontFamily: FontFamilies.sans.bold,
    letterSpacing: 1.2,
  },
  greetingTitle: {
    ...Typography.headlineMd,
    fontFamily: FontFamilies.serif.medium,
    lineHeight: 30,
    marginBottom: 6,
  },
  greetingSubtext: {
    ...Typography.bodySm,
    fontFamily: FontFamilies.sans.regular,
    lineHeight: 20,
  },
  startersSection: {
    gap: 8,
  },
  startersHeader: {
    fontSize: 11,
    fontFamily: FontFamilies.sans.bold,
    letterSpacing: 1.2,
    paddingHorizontal: 2,
  },
  startersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  starterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  starterEmoji: {
    fontSize: 14,
  },
  starterLabel: {
    fontSize: 13,
    fontFamily: FontFamilies.sans.medium,
  },
  messagesList: {
    gap: Spacing.md,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  userRow: {
    justifyContent: 'flex-end',
    paddingLeft: 40,
  },
  assistantRow: {
    justifyContent: 'flex-start',
    paddingRight: 32,
    gap: 8,
  },
  assistantAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  assistantAvatarIcon: {
    fontSize: 16,
  },
  messageBubbleWrapper: {
    flex: 1,
  },
  messageBubble: {
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '100%',
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    borderTopLeftRadius: 4,
  },
  messageText: {
    ...Typography.bodyMd,
    fontFamily: FontFamilies.sans.regular,
    lineHeight: 22,
  },
  crisisPillButton: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
  },
  crisisPillButtonText: {
    fontSize: 11,
    fontFamily: FontFamilies.sans.bold,
  },
  retryPillButton: {
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radii.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  retryPillButtonText: {
    fontSize: 12,
    fontFamily: FontFamilies.sans.bold,
  },
  timestampText: {
    fontSize: 10,
    fontFamily: FontFamilies.sans.regular,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  reflectingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 40,
    marginTop: 4,
  },
  reflectingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radii.full,
  },
  reflectingText: {
    fontSize: 12,
    fontFamily: FontFamilies.sans.medium,
  },
  inputContainer: {
    paddingHorizontal: Spacing.marginMobile,
    paddingBottom: Spacing.xs,
    gap: 4,
  },
  inputCapsule: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: Radii.xl,
    borderWidth: 1,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: FontFamilies.sans.regular,
    minHeight: 38,
    maxHeight: 110,
    paddingTop: 8,
    paddingBottom: 8,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
  },
  sendButtonArrow: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  footnoteText: {
    textAlign: 'center',
    fontSize: 11,
    fontFamily: FontFamilies.sans.regular,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.marginMobile,
  },
  resourcesModalCard: {
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    maxHeight: '80%',
  },
  modalHeading: {
    ...Typography.headlineSm,
    fontFamily: FontFamilies.serif.medium,
    marginBottom: 6,
  },
  modalSubheading: {
    ...Typography.bodySm,
    fontFamily: FontFamilies.sans.regular,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  resourcesList: {
    marginBottom: Spacing.md,
  },
  resourceItem: {
    borderRadius: Radii.sm,
    padding: 10,
    marginBottom: 8,
  },
  resourceName: {
    fontSize: 13,
    fontFamily: FontFamilies.sans.bold,
  },
  resourceContact: {
    fontSize: 13,
    fontFamily: FontFamilies.sans.bold,
    marginTop: 2,
  },
  resourceNote: {
    fontSize: 11,
    fontFamily: FontFamilies.sans.regular,
    marginTop: 1,
  },
  closeModalButton: {
    height: 46,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeModalButtonText: {
    fontSize: 14,
    fontFamily: FontFamilies.sans.bold,
  },
});
