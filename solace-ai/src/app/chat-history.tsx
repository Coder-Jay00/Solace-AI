/**
 * Solace AI - Chat History Screen
 * Phase 6: AI Companion Chat Interface & Chat History
 *
 * Faithfully matches Google Stitch design:
 * solace-design-reference/your_conversations/
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  BackHandler,
  RefreshControl,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '@/components/solace';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { chatService } from '@/services/chatService';
import { Conversation } from '@/types/chat';
import { FontFamilies, Radii, Shadows, Spacing, Typography } from '@/constants/theme';

export default function ChatHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { themeColors } = useTheme();
  const { user } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'archived'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    const onBackPress = () => {
      router.back();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, []);

  // Menu / Modal states
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [renameModalVisible, setRenameModalVisible] = useState<boolean>(false);
  const [renameTitleInput, setRenameTitleInput] = useState<string>('');
  const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);

  const loadConversations = useCallback(async () => {
    const userId = user?.id || 'guest_user';
    setIsLoading(true);
    try {
      const list = await chatService.getConversations(userId);
      setConversations(list);
    } catch (error) {
      console.warn('[ChatHistoryScreen] Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [loadConversations])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadConversations();
    } finally {
      setRefreshing(false);
    }
  }, [loadConversations]);

  const filteredConversations = useMemo(() => {
    if (activeTab === 'archived') {
      return [];
    }

    if (!searchQuery.trim()) {
      return conversations;
    }

    const q = searchQuery.trim().toLowerCase();
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.lastMessageText.toLowerCase().includes(q) ||
        c.messages.some((m) => m.text.toLowerCase().includes(q))
    );
  }, [conversations, searchQuery, activeTab]);

  // Group conversations into Today, Yesterday, and Earlier
  const groupedConversations = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const todayList: Conversation[] = [];
    const yesterdayList: Conversation[] = [];
    const earlierList: Conversation[] = [];

    filteredConversations.forEach((conv) => {
      const dateStr = conv.updatedAt.split('T')[0];
      if (dateStr === todayStr) {
        todayList.push(conv);
      } else if (dateStr === yesterdayStr) {
        yesterdayList.push(conv);
      } else {
        earlierList.push(conv);
      }
    });

    const groups: Array<{ title: string; countText: string; list: Conversation[] }> = [];
    if (todayList.length > 0) {
      groups.push({
        title: 'Today',
        countText: `${todayList.length} ${todayList.length === 1 ? 'reflection' : 'reflections'}`,
        list: todayList,
      });
    }
    if (yesterdayList.length > 0) {
      groups.push({
        title: 'Yesterday',
        countText: `${yesterdayList.length} ${yesterdayList.length === 1 ? 'reflection' : 'reflections'}`,
        list: yesterdayList,
      });
    }
    if (earlierList.length > 0) {
      groups.push({
        title: 'Earlier',
        countText: `${earlierList.length} ${earlierList.length === 1 ? 'reflection' : 'reflections'}`,
        list: earlierList,
      });
    }

    return groups;
  }, [filteredConversations]);

  const handleOpenConversation = (conversationId: string) => {
    router.replace({
      pathname: '/(tabs)/companion',
      params: { conversationId },
    });
  };

  const handleStartNewChat = async () => {
    const userId = user?.id || 'guest_user';
    try {
      const newConv = await chatService.createConversation(userId, 'New Reflection');
      router.replace({
        pathname: '/(tabs)/companion',
        params: { conversationId: newConv.id },
      });
    } catch (error) {
      console.warn('[ChatHistoryScreen] Could not start new chat:', error);
    }
  };

  const handleSaveRename = async () => {
    if (!selectedConversation || !renameTitleInput.trim()) return;
    const userId = user?.id || 'guest_user';
    await chatService.renameConversation(userId, selectedConversation.id, renameTitleInput.trim());
    setRenameModalVisible(false);
    setSelectedConversation(null);
    loadConversations();
  };

  const handleConfirmDelete = async () => {
    if (!selectedConversation) return;
    const userId = user?.id || 'guest_user';
    await chatService.deleteConversation(userId, selectedConversation.id);
    setDeleteModalVisible(false);
    setSelectedConversation(null);
    loadConversations();
  };

  const formatTimestamp = (isoString: string) => {
    const d = new Date(isoString);
    const today = new Date().toISOString().split('T')[0];
    const isToday = isoString.split('T')[0] === today;
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `Today, ${time}`;
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${time}`;
  };

  return (
    <ScreenContainer>
      <View
        style={[
          styles.container,
          {
            backgroundColor: themeColors.background,
            paddingTop: Math.max(insets.top, 16),
          },
        ]}>
        {/* Header Bar */}
        <View style={styles.topHeader}>
          <View style={styles.headerLeft}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.backButton,
                { backgroundColor: themeColors.secondary },
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.backButtonArrow, { color: themeColors.text }]}>←</Text>
            </Pressable>
            <Text style={[styles.headerTitle, { color: themeColors.primary }]}>
              Your Conversations
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="New Conversation"
            onPress={handleStartNewChat}
            style={({ pressed }) => [
              styles.newChatHeaderBtn,
              { backgroundColor: themeColors.secondary },
              pressed && styles.pressed,
            ]}>
            <Text style={styles.newChatHeaderIcon}>✍️</Text>
            <Text style={[styles.newChatHeaderText, { color: themeColors.primary }]}>
              New Chat
            </Text>
          </Pressable>
        </View>

        {/* Search Pill */}
        <View style={styles.searchSection}>
          <View
            style={[
              styles.searchPill,
              {
                backgroundColor: themeColors.surfaceElevated,
                borderColor: themeColors.border,
              },
              Shadows.card,
            ]}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={[styles.searchInput, { color: themeColors.text }]}
              placeholder="Search previous conversations..."
              placeholderTextColor={themeColors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => setSearchQuery('')}
                style={styles.clearSearchBtn}>
                <Text style={[styles.clearSearchText, { color: themeColors.textMuted }]}>✕</Text>
              </Pressable>
            )}
          </View>

          {/* Segmented Filter Pills */}
          <View style={styles.filterPillsRow}>
            <View
              style={[
                styles.segmentContainer,
                { backgroundColor: themeColors.secondary },
              ]}>
              <Pressable
                onPress={() => setActiveTab('all')}
                style={[
                  styles.segmentButton,
                  activeTab === 'all' && [
                    styles.segmentButtonActive,
                    { backgroundColor: themeColors.surfaceElevated },
                    Shadows.card,
                  ],
                ]}>
                <Text
                  style={[
                    styles.segmentText,
                    {
                      color: activeTab === 'all' ? themeColors.primary : themeColors.textSecondary,
                      fontFamily: activeTab === 'all' ? FontFamilies.sans.bold : FontFamilies.sans.medium,
                    },
                  ]}>
                  All ({conversations.length})
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveTab('archived')}
                style={[
                  styles.segmentButton,
                  activeTab === 'archived' && [
                    styles.segmentButtonActive,
                    { backgroundColor: themeColors.surfaceElevated },
                    Shadows.card,
                  ],
                ]}>
                <Text
                  style={[
                    styles.segmentText,
                    {
                      color: activeTab === 'archived' ? themeColors.primary : themeColors.textSecondary,
                      fontFamily: activeTab === 'archived' ? FontFamilies.sans.bold : FontFamilies.sans.medium,
                    },
                  ]}>
                  Archived (0)
                </Text>
              </Pressable>
            </View>

            <View style={[styles.privacyBadge, { backgroundColor: themeColors.secondary }]}>
              <Text style={styles.privacyIcon}>🔒</Text>
              <Text style={[styles.privacyText, { color: themeColors.primary }]}>
                Private & Stored Locally
              </Text>
            </View>
          </View>
        </View>

        {/* Content Stream */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[themeColors.primary]}
              tintColor={themeColors.primary}
            />
          }>
          {isLoading ? (
            <ActivityIndicator style={{ paddingVertical: 40 }} color={themeColors.primary} />
          ) : filteredConversations.length === 0 ? (
            /* Empty State */
            <View
              style={[
                styles.emptyStateCard,
                {
                  backgroundColor: themeColors.surfaceElevated,
                  borderColor: themeColors.border,
                },
                Shadows.card,
              ]}>
              <View style={[styles.emptyEmblemCircle, { backgroundColor: themeColors.blush }]}>
                <Text style={styles.emptyEmblemLotus}>🌿</Text>
              </View>
              <Text style={[styles.emptyStateTitle, { color: themeColors.primary }]}>
                {searchQuery
                  ? 'No matching reflections found'
                  : 'Your conversations will appear here.'}
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: themeColors.textSecondary }]}>
                {searchQuery
                  ? 'Try searching with different keywords or clear the filter.'
                  : 'Whenever you share your thoughts with Solace, your mindful dialogues are preserved securely in this space.'}
              </Text>

              <Pressable
                accessibilityRole="button"
                onPress={handleStartNewChat}
                style={({ pressed }) => [
                  styles.emptyStateCta,
                  { backgroundColor: themeColors.primary },
                  pressed && styles.pressed,
                ]}>
                <Text style={styles.emptyStateCtaIcon}>💬</Text>
                <Text style={[styles.emptyStateCtaText, { color: themeColors.onPrimary }]}>Start a conversation</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.groupsContainer}>
              {groupedConversations.map((group, gIdx) => (
                <View key={gIdx} style={styles.groupSection}>
                  <View style={styles.groupHeaderRow}>
                    <View style={styles.groupTitleRow}>
                      <Text style={[styles.groupTitle, { color: themeColors.primary }]}>
                        {group.title}
                      </Text>
                      <View style={[styles.groupCountPill, { backgroundColor: themeColors.secondary }]}>
                        <Text style={[styles.groupCountText, { color: themeColors.primary }]}>
                          {group.countText}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.syncStatus, { color: themeColors.textMuted }]}>
                      Synchronized
                    </Text>
                  </View>

                  <View style={styles.conversationsList}>
                    {group.list.map((conv) => (
                      <Pressable
                        key={conv.id}
                        onPress={() => handleOpenConversation(conv.id)}
                        style={({ pressed }) => [
                          styles.conversationCard,
                          {
                            backgroundColor: themeColors.surfaceElevated,
                            borderColor: themeColors.border,
                          },
                          Shadows.card,
                          pressed && styles.pressed,
                        ]}>
                        <View style={styles.cardMainRow}>
                          <View
                            style={[
                              styles.cardLotusCircle,
                              { backgroundColor: themeColors.secondary },
                            ]}>
                            <Text style={styles.cardLotusIcon}>🌿</Text>
                          </View>

                          <View style={styles.cardTextContent}>
                            <View style={styles.cardTitleHeader}>
                              <Text
                                numberOfLines={1}
                                style={[styles.cardTitle, { color: themeColors.primary }]}>
                                {conv.title}
                              </Text>

                              <Pressable
                                accessibilityLabel="Conversation options"
                                onPress={(e) => {
                                  e.stopPropagation();
                                  setSelectedConversation(conv);
                                  setRenameTitleInput(conv.title);
                                }}
                                style={styles.cardMoreBtn}>
                                <Text style={[styles.cardMoreIcon, { color: themeColors.textMuted }]}>
                                  ⋮
                                </Text>
                              </Pressable>
                            </View>

                            <Text
                              numberOfLines={2}
                              style={[styles.cardPreviewText, { color: themeColors.textSecondary }]}>
                              {conv.lastMessageText || 'Quiet reflection session started...'}
                            </Text>

                            <View style={styles.cardFooterRow}>
                              <Text style={[styles.cardDateText, { color: themeColors.textMuted }]}>
                                {formatTimestamp(conv.updatedAt)}
                              </Text>
                              <View style={[styles.cardTagPill, { backgroundColor: themeColors.secondary }]}>
                                <Text style={[styles.cardTagText, { color: themeColors.primary }]}>
                                  {conv.messages.length} {conv.messages.length === 1 ? 'msg' : 'msgs'}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.secureStorageFootnote}>
            <Text style={styles.secureFootnoteIcon}>🛡️</Text>
            <Text style={[styles.secureFootnoteText, { color: themeColors.textMuted }]}>
              Stored locally on your device with sanctuary retreat privacy
            </Text>
          </View>
        </ScrollView>

        {/* Options / Action Menu Modal */}
        <Modal
          visible={Boolean(selectedConversation) && !renameModalVisible && !deleteModalVisible}
          transparent
          animationType="fade">
          <Pressable
            onPress={() => setSelectedConversation(null)}
            style={[styles.modalBackdrop, { backgroundColor: themeColors.overlay }]}>
            <View
              style={[
                styles.optionsSheet,
                { backgroundColor: themeColors.surfaceElevated },
                Shadows.floating,
              ]}>
              <Text style={[styles.optionsSheetTitle, { color: themeColors.primary }]}>
                {selectedConversation?.title}
              </Text>

              <Pressable
                onPress={() => {
                  if (selectedConversation) {
                    handleOpenConversation(selectedConversation.id);
                  }
                }}
                style={({ pressed }) => [
                  styles.optionRow,
                  pressed && styles.pressed,
                ]}>
                <Text style={styles.optionRowIcon}>💬</Text>
                <Text style={[styles.optionRowText, { color: themeColors.text }]}>
                  Continue conversation
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setRenameModalVisible(true)}
                style={({ pressed }) => [
                  styles.optionRow,
                  pressed && styles.pressed,
                ]}>
                <Text style={styles.optionRowIcon}>✏️</Text>
                <Text style={[styles.optionRowText, { color: themeColors.text }]}>
                  Rename conversation
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setDeleteModalVisible(true)}
                style={({ pressed }) => [
                  styles.optionRow,
                  pressed && styles.pressed,
                ]}>
                <Text style={styles.optionRowIcon}>🗑️</Text>
                <Text style={[styles.optionRowText, { color: themeColors.error }]}>
                  Delete conversation
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>

        {/* Rename Modal */}
        <Modal
          visible={renameModalVisible}
          transparent
          animationType="fade">
          <View style={[styles.modalBackdrop, { backgroundColor: themeColors.overlay }]}>
            <View
              style={[
                styles.dialogCard,
                { backgroundColor: themeColors.surfaceElevated },
                Shadows.floating,
              ]}>
              <Text style={[styles.dialogTitle, { color: themeColors.primary }]}>
                Rename Conversation
              </Text>
              <TextInput
                style={[
                  styles.dialogInput,
                  {
                    color: themeColors.text,
                    backgroundColor: themeColors.secondary,
                  },
                ]}
                value={renameTitleInput}
                onChangeText={setRenameTitleInput}
                autoFocus
                maxLength={45}
              />

              <View style={styles.dialogActionsRow}>
                <Pressable
                  onPress={() => {
                    setRenameModalVisible(false);
                    setSelectedConversation(null);
                  }}
                  style={[styles.dialogCancelBtn, { backgroundColor: themeColors.secondary }]}>
                  <Text style={[styles.dialogCancelText, { color: themeColors.textSecondary }]}>
                    Cancel
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleSaveRename}
                  style={[styles.dialogConfirmBtn, { backgroundColor: themeColors.primary }]}>
                  <Text style={[styles.dialogConfirmText, { color: themeColors.onPrimary }]}>Save</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          visible={deleteModalVisible}
          transparent
          animationType="fade">
          <View style={[styles.modalBackdrop, { backgroundColor: themeColors.overlay }]}>
            <View
              style={[
                styles.dialogCard,
                { backgroundColor: themeColors.surfaceElevated },
                Shadows.floating,
              ]}>
              <Text style={[styles.dialogTitle, { color: themeColors.error }]}>
                Delete Conversation?
              </Text>
              <Text style={[styles.dialogBody, { color: themeColors.textSecondary }]}>
                This dialogue will be permanently removed from your device storage. This action cannot be undone.
              </Text>

              <View style={styles.dialogActionsRow}>
                <Pressable
                  onPress={() => {
                    setDeleteModalVisible(false);
                    setSelectedConversation(null);
                  }}
                  style={[styles.dialogCancelBtn, { backgroundColor: themeColors.secondary }]}>
                  <Text style={[styles.dialogCancelText, { color: themeColors.textSecondary }]}>
                    Keep
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleConfirmDelete}
                  style={[styles.dialogConfirmBtn, { backgroundColor: themeColors.error }]}>
                  <Text style={[styles.dialogConfirmText, { color: '#FFFFFF' }]}>Delete</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.marginMobile,
    paddingBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonArrow: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerTitle: {
    ...Typography.headlineSm,
    fontFamily: FontFamilies.serif.medium,
  },
  newChatHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.full,
  },
  newChatHeaderIcon: {
    fontSize: 14,
  },
  newChatHeaderText: {
    fontSize: 13,
    fontFamily: FontFamilies.sans.bold,
  },
  searchSection: {
    paddingHorizontal: Spacing.marginMobile,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.full,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 44,
    gap: 8,
  },
  searchIcon: {
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: FontFamilies.sans.regular,
  },
  clearSearchBtn: {
    padding: 4,
  },
  clearSearchText: {
    fontSize: 12,
  },
  filterPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  segmentContainer: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: Radii.full,
  },
  segmentButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  segmentButtonActive: {
    // Active shadow handled in inline style
  },
  segmentText: {
    fontSize: 12,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  privacyIcon: {
    fontSize: 11,
  },
  privacyText: {
    fontSize: 11,
    fontFamily: FontFamilies.sans.medium,
  },
  scrollContent: {
    paddingHorizontal: Spacing.marginMobile,
    paddingBottom: Spacing.xl + 20,
    paddingTop: Spacing.xs,
  },
  emptyStateCard: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    textAlign: 'center',
    marginVertical: Spacing.lg,
  },
  emptyEmblemCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyEmblemLotus: {
    fontSize: 34,
  },
  emptyStateTitle: {
    ...Typography.headlineSm,
    fontFamily: FontFamilies.serif.medium,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    ...Typography.bodySm,
    fontFamily: FontFamilies.sans.regular,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  emptyStateCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Radii.full,
  },
  emptyStateCtaIcon: {
    fontSize: 16,
  },
  emptyStateCtaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FontFamilies.sans.bold,
  },
  groupsContainer: {
    gap: Spacing.lg,
  },
  groupSection: {
    gap: Spacing.sm,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  groupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupTitle: {
    ...Typography.headlineSm,
    fontFamily: FontFamilies.serif.medium,
  },
  groupCountPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  groupCountText: {
    fontSize: 11,
    fontFamily: FontFamilies.sans.bold,
  },
  syncStatus: {
    fontSize: 11,
    fontFamily: FontFamilies.sans.regular,
  },
  conversationsList: {
    gap: 10,
  },
  conversationCard: {
    borderRadius: Radii.md,
    borderWidth: 1,
    padding: Spacing.md,
  },
  cardMainRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cardLotusCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLotusIcon: {
    fontSize: 18,
  },
  cardTextContent: {
    flex: 1,
  },
  cardTitleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: FontFamilies.sans.semiBold,
    flex: 1,
  },
  cardMoreBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cardMoreIcon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardPreviewText: {
    fontSize: 13,
    fontFamily: FontFamilies.sans.regular,
    lineHeight: 18,
    marginTop: 4,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 4,
  },
  cardDateText: {
    fontSize: 11,
    fontFamily: FontFamilies.sans.regular,
  },
  cardTagPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  cardTagText: {
    fontSize: 11,
    fontFamily: FontFamilies.sans.medium,
  },
  secureStorageFootnote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.xl,
    paddingVertical: 8,
  },
  secureFootnoteIcon: {
    fontSize: 13,
  },
  secureFootnoteText: {
    fontSize: 11,
    fontFamily: FontFamilies.sans.regular,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.marginMobile,
  },
  optionsSheet: {
    borderRadius: Radii.lg,
    padding: Spacing.md,
  },
  optionsSheetTitle: {
    fontSize: 14,
    fontFamily: FontFamilies.sans.bold,
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: Radii.sm,
  },
  optionRowIcon: {
    fontSize: 16,
  },
  optionRowText: {
    fontSize: 14,
    fontFamily: FontFamilies.sans.medium,
  },
  dialogCard: {
    borderRadius: Radii.lg,
    padding: Spacing.lg,
  },
  dialogTitle: {
    ...Typography.headlineSm,
    fontFamily: FontFamilies.serif.medium,
    marginBottom: 8,
  },
  dialogBody: {
    fontSize: 13,
    fontFamily: FontFamilies.sans.regular,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  dialogInput: {
    height: 44,
    borderRadius: Radii.sm,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: FontFamilies.sans.regular,
    marginBottom: Spacing.md,
  },
  dialogActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  dialogCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: Radii.full,
  },
  dialogCancelText: {
    fontSize: 13,
    fontFamily: FontFamilies.sans.medium,
  },
  dialogConfirmBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: Radii.full,
  },
  dialogConfirmText: {
    fontSize: 13,
    fontFamily: FontFamilies.sans.bold,
  },
});
