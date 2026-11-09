/**
 * Solace AI - Chat & AI Companion Type Definitions
 * Phase 6: AI Companion Chat Interface & Chat History
 */

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: 'user' | 'assistant';
  text: string;
  isCrisis?: boolean;
  createdAt: string; // ISO 8601 string
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  lastMessageText: string;
  category?: string; // e.g. 'Reflection', 'Calm', 'Intention', 'Mindfulness'
  createdAt: string; // ISO 8601 string
  updatedAt: string; // ISO 8601 string
  messages: ChatMessage[];
}

export interface ConversationGroup {
  period: string; // 'Today' | 'Yesterday' | 'Earlier'
  conversations: Conversation[];
}

export interface CompanionPromptSuggestion {
  id: string;
  emoji: string;
  label: string;
  prompt: string;
}

export const SUGGESTED_PROMPTS: CompanionPromptSuggestion[] = [
  {
    id: 'anxious',
    emoji: '💭',
    label: 'Feeling anxious',
    prompt: "I'm feeling a bit anxious and overwhelmed right now. Can you help me untangle what's on my mind?",
  },
  {
    id: 'clarity',
    emoji: '✨',
    label: 'Need gentle clarity',
    prompt: "I have a lot of racing thoughts today and need gentle clarity on how to prioritize.",
  },
  {
    id: 'wind_down',
    emoji: '🌙',
    label: 'Help me wind down',
    prompt: "It's been a long day. Can you guide me through winding down and letting go of today's tension?",
  },
  {
    id: 'vent',
    emoji: '💬',
    label: 'Just want to vent',
    prompt: "I just need a safe space to vent without any judgment or quick fixes.",
  },
  {
    id: 'calming',
    emoji: '🌬️',
    label: 'Calming exercise',
    prompt: "Can you guide me through a calming breathing exercise?",
  },
];

export interface EmergencyResource {
  region: string;
  name: string;
  contact: string;
  note: string;
}

export const EMERGENCY_RESOURCES: EmergencyResource[] = [
  {
    region: 'United States & Canada',
    name: '988 Suicide & Crisis Lifeline',
    contact: 'Call or text 988',
    note: 'Free, confidential, 24/7 support',
  },
  {
    region: 'United Kingdom',
    name: 'NHS Mental Health / SHOUT',
    contact: 'Call 111 or text SHOUT to 85258',
    note: 'Free, 24/7 crisis text service',
  },
  {
    region: 'International',
    name: 'Befrienders Worldwide & Find A Helpline',
    contact: 'https://findahelpline.com',
    note: 'Free confidential support in your country',
  },
  {
    region: 'Emergency Services',
    name: 'Local Emergency',
    contact: 'Call 911 (US), 999 (UK), 112 (EU)',
    note: 'If you are in immediate danger',
  },
];

