/**
 * Solace AI - AI Companion Conversational Service
 * Connects the mobile client to the Supabase Edge Function 'solace-ai-chat'
 * powered by Google Gemini API (gemini-3.1-flash-lite / gemini-3.5-flash).
 *
 * Never exposes any API keys or secrets in client code (kept securely in Supabase Secrets).
 * Never returns deceptive pre-generated/mocked text pretending to be AI.
 * Transparently reports connection issues with actionable retry paths.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';

export interface CompanionReply {
  text: string;
  isCrisis: boolean;
  suggestedActions?: Array<{ label: string; route?: string }>;
  isLiveAi?: boolean;
  conversationId?: string;
  isError?: boolean;
  canRetry?: boolean;
}

const CRISIS_PATTERNS = [
  /\bkill\s+myself\b/i,
  /\bcommit\s+suicide\b/i,
  /\bwant\s+to\s+die\b/i,
  /\bend\s+my\s+life\b/i,
  /\bsuicid(e|al)\b/i,
  /\bending\s+it\s+all\b/i,
  /\bhurt\s+myself\b/i,
  /\bself[\s-]harm\b/i,
  /\bcan'?t\s+go\s+on(\s+anymore)?\b/i,
  /\bcannot\s+go\s+on\b/i,
  /\boverdose\b/i,
];

export const aiCompanionService = {
  /**
   * Check whether a user message triggers the basic crisis safety fallback.
   * NOTE: Keyword detection is strictly a fallback heuristic, not a medical guarantee.
   */
  isCrisisMessage(message: string): boolean {
    if (!message || !message.trim()) return false;
    const normalized = message.trim().toLowerCase();
    return CRISIS_PATTERNS.some((pattern) => pattern.test(normalized));
  },

  /**
   * Generates a companion response using the Supabase Edge Function 'solace-ai-chat'
   * (Google Gemini API). Never returns deceptive hardcoded templates if the backend fails.
   */
  async generateReply(
    userMessage: string,
    userName: string = 'friend',
    conversationId?: string,
    history: Array<{ sender: 'user' | 'assistant'; text: string }> = []
  ): Promise<CompanionReply> {
    // 1. Immediate Safety Check: Return crisis emergency resources
    if (this.isCrisisMessage(userMessage)) {
      return {
        isCrisis: true,
        isLiveAi: false,
        text: `I hear how deeply painful and exhausting things feel right now, and I care about your safety. Solace is only a simple mindfulness journaling app and cannot provide medical care, crisis support, or human emergency help.\n\nPlease know that you do not have to carry this alone. Support is available right now:\n\n• In the US & Canada: Call or text 988 (free, confidential, 24/7)\n• In the UK: Call 111 or text SHOUT to 85258\n• International: Visit https://findahelpline.com for local crisis lines\n• If you are in immediate danger, please call your local emergency services (911, 999, 112) or go to the nearest emergency center.\n\nPlease reach out to a trusted loved one or professional right now. Your life matters.`,
        suggestedActions: [{ label: 'View Emergency Resources' }],
      };
    }

    // 2. Configuration verification
    if (!isSupabaseConfigured() || !supabase) {
      console.warn('[aiCompanionService] Backend service unconfigured.');
      return {
        text: "I'm temporarily unable to connect to Solace AI. Please ensure your cloud connection is active and try again.",
        isCrisis: false,
        isLiveAi: false,
        isError: true,
        canRetry: true,
      };
    }

    // 3. Invoke Supabase Edge Function 'solace-ai-chat' (Google Gemini)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const { data, error } = await supabase.functions.invoke('solace-ai-chat', {
        headers,
        body: {
          message: userMessage,
          userName,
          conversationId,
          history: history.slice(-8).map((h) => ({
            sender: h.sender,
            text: h.text,
          })),
        },
      });

      if (!error && data?.reply) {
        return {
          text: data.reply,
          isCrisis: Boolean(data.isCrisis),
          isLiveAi: true,
          conversationId: data.conversationId,
        };
      }

      if (error) {
        // Sanitize error logging: log status & code only, never secrets or personal messages
        console.warn(
          '[aiCompanionService] Supabase Edge Function response status:',
          (error as any)?.status || (error as any)?.name || 'Error'
        );
      }
    } catch (err: any) {
      // Sanitize exception logging: avoid logging personal conversation content
      console.warn('[aiCompanionService] Network exception contacting Edge Function:', err?.name || 'NetworkError');
    }

    // 4. Honest, Non-Deceptive Connection Failure Message
    // Never present predefined fallback text as a genuine Gemini response
    return {
      text: "I'm temporarily unable to connect to Solace AI. Please try again.",
      isCrisis: false,
      isLiveAi: false,
      isError: true,
      canRetry: true,
      suggestedActions: [{ label: 'Retry Reflection' }],
    };
  },
};
