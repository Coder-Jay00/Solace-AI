// Solace AI - Production Supabase Edge Function 'solace-ai-chat'
// Connects Solace AI Companion to Google Gemini API (gemini-3.1-flash-lite / gemini-3.5-flash)
// Handles authentication, message history, crisis detection, and persistent cloud storage.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

function isCrisis(text: string): boolean {
  if (!text) return false;
  return CRISIS_PATTERNS.some((pattern) => pattern.test(text));
}

serve(async (req: Request) => {
  // 1. Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 2. Validate Authorization & apikey headers
    const authHeader = req.headers.get("Authorization");
    const apikeyHeader = req.headers.get("apikey");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ error: "Supabase environment variables missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isAuthorizedCaller =
      (apikeyHeader && (apikeyHeader === supabaseAnonKey || apikeyHeader.startsWith("sb_publishable_"))) ||
      (authHeader && authHeader.length > 10);

    if (!isAuthorizedCaller) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid authorization credentials" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: authHeader ? { Authorization: authHeader } : {} },
    });

    // 3. Resolve user if authenticated token provided
    let user: any = null;
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      try {
        const { data: userData, error: userError } = await supabaseClient.auth.getUser();
        if (!userError && userData?.user) {
          user = userData.user;
        }
      } catch (authErr) {
        console.warn("User auth verification note:", authErr);
      }
    }

    // 4. Parse request payload
    const body = await req.json();
    const message = (body.message || "").trim();
    const conversationId = body.conversationId;
    let userName = (body.userName || "").trim();
    let history = Array.isArray(body.history) ? body.history : [];

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Resolve user's explicit profile name if available
    if (!userName && user?.user_metadata) {
      userName =
        user.user_metadata.full_name ||
        user.user_metadata.name ||
        user.user_metadata.given_name ||
        "";
    }

    if (!userName && user?.id) {
      try {
        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();
        if (profile?.full_name) {
          userName = profile.full_name;
        }
      } catch {}
    }

    const cleanUserName = userName ? userName.split(" ")[0].trim() : "";

    // 5. Read Gemini API key from Edge Function Secret
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({
          error: "GEMINI_API_KEY secret is not set in Supabase Edge Function Secrets",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Resolve or create Conversation in public.conversations (if authenticated user exists)
    const UUID_REGEX =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    let activeConvId =
      conversationId && UUID_REGEX.test(conversationId) ? conversationId : null;

    if (user?.id) {
      if (activeConvId) {
        const { data: existingConv } = await supabaseClient
          .from("conversations")
          .select("id")
          .eq("id", activeConvId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (!existingConv) {
          activeConvId = null;
        }
      }

      if (!activeConvId) {
        const titleSnippet =
          message.length > 32 ? message.substring(0, 32) + "..." : message;

        const { data: newConv, error: convError } = await supabaseClient
          .from("conversations")
          .insert({
            user_id: user.id,
            title: titleSnippet || "Sanctuary Reflection",
            category: "Reflection",
            last_message_text: message.substring(0, 100),
          })
          .select()
          .single();

        if (!convError && newConv) {
          activeConvId = newConv.id;
        }
      }
    }

    // 7. Persist User Message to public.chat_messages (if authenticated user exists)
    let userMessageRow = null;
    if (user?.id && activeConvId) {
      const { data: userMsg, error: userMsgErr } = await supabaseClient
        .from("chat_messages")
        .insert({
          conversation_id: activeConvId,
          user_id: user.id,
          sender: "user",
          text: message,
          is_crisis: false,
        })
        .select()
        .single();

      if (!userMsgErr && userMsg) {
        userMessageRow = userMsg;
      }
    }

    // 8. Safety check for immediate crisis response
    const crisisDetected = isCrisis(message);
    let replyText = "";

    if (crisisDetected) {
      replyText =
        "I hear how deeply painful and exhausting things feel right now, and I care about your safety. Solace is only a mindfulness reflection space and cannot provide emergency medical care, crisis counseling, or human emergency help.\n\nPlease know that you do not have to carry this alone. Support is available right now:\n\n• In the US & Canada: Call or text 988 (free, confidential, 24/7)\n• In the UK: Call 111 or text SHOUT to 85258\n• International: Visit https://findahelpline.com for local crisis lines\n• If you are in immediate danger, please call your local emergency services (911, 999, 112) or go to the nearest emergency center.\n\nPlease reach out to a trusted loved one or professional right now. Your life matters.";
    } else {
      // 9. Call Google Gemini API (using active gemini-3.1-flash-lite with fallback to gemini-3-flash-preview)
      const primaryModel = Deno.env.get("GEMINI_MODEL") || "gemini-3.1-flash-lite";
      const fallbackModel = "gemini-3-flash-preview";

      // Sanitize client-passed history: exclude current message if already at the end
      if (history.length > 0) {
        const last = history[history.length - 1];
        if (last.sender === "user" && last.text?.trim() === message) {
          history = history.slice(0, -1);
        }
      }

      // Requirement 10: When reopening an existing conversation and no client history was provided,
      // retrieve actual recent message history from public.chat_messages
      if (history.length === 0 && user?.id && activeConvId) {
        try {
          const { data: dbMsgs } = await supabaseClient
            .from("chat_messages")
            .select("sender, text, created_at")
            .eq("conversation_id", activeConvId)
            .order("created_at", { ascending: false })
            .limit(8);

          if (dbMsgs && dbMsgs.length > 0) {
            const pastMsgs = dbMsgs.filter((m: any) => m.text?.trim() !== message);
            history = pastMsgs.reverse();
          }
        } catch (dbHistErr) {
          console.warn("DB history retrieval note:", dbHistErr);
        }
      }

      const nameDirective = cleanUserName
        ? `The user's name is ${cleanUserName}. You may address them warmly by name, but use it sparingly (at most once in your response, never forced or repetitive).`
        : `Address the user warmly as a mindful friend without guessing or assuming a name.`;

      const systemPrompt = `You are Solace, a gentle, compassionate, and mindful AI companion in the Solace AI wellness sanctuary app.

${nameDirective}

CRITICAL CONVERSATIONAL REQUIREMENTS:
1. Warm, Empathetic & Natural: Speak like an attentive, grounded friend. Listen deeply, acknowledge the user's emotional state, and validate their feelings with authentic warmth. Avoid hollow cheerfulness, clinical detachment, or toxic positivity.
2. Length (Strict 80–140 Words): Your entire response MUST be between 80 and 140 words. Be concise, intentional, and focused. Do not write essays, long introductory pleasantries, or multi-paragraph lectures.
3. Specifically Acknowledge Details: Explicitly acknowledge and reference the specific situations, topics, feelings, people, or objects the user mentioned. Never gloss over their words with generic observations.
4. Avoid Motivational Clichés: Never use generic motivational slogans, platitudes, or repetitive wellness phrases (e.g., avoid "Take a deep breath and remember you've got this", "Every cloud has a silver lining", "Life has its ups and downs", "Take it one day at a time", "You've got this", or "You are doing amazing"). Speak genuinely and specifically to their situation.
5. Exactly ONE Practical Suggestion: Offer exactly ONE bite-sized, low-effort, achievable suggestion or reframing tailored directly to their current context. Never provide bulleted lists, numbered tips, or multiple action items.
6. Exactly ONE Follow-Up Question: End your response with exactly ONE gentle, curious, open-ended question that naturally invites the user to reflect deeper or continue the conversation.
7. No Hallucinations or Assumed History: Never invent personal details, background stories, past events, or relationships that the user has not explicitly shared.
8. First Message Rule: If there is no prior conversation history, base your response ONLY on the user's current message and explicitly provided profile information. Do not assume past conversations or pretend to remember unstated history.
9. Multi-Turn Continuity: When conversation history is provided, maintain seamless continuity and context from previous turns without repeating previous advice or re-introducing yourself.
10. Clinical Boundaries: You are a wellness and mindfulness companion, NOT a licensed therapist, psychologist, or healthcare provider. Never offer medical advice, diagnosis, or clinical prescriptions.`;

      // Build Gemini conversation contents with strictly alternating turns
      const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

      const sanitizedHistory = history
        .filter((item: any) => item && typeof item.text === "string" && item.text.trim())
        .map((item: any) => ({
          role: (item.sender === "user" ? "user" : "model") as "user" | "model",
          text: item.text.trim(),
        }));

      if (sanitizedHistory.length > 0) {
        const recentHistory = sanitizedHistory.slice(-8);
        let lastRole = "";

        for (const item of recentHistory) {
          if (item.role !== lastRole) {
            contents.push({
              role: item.role,
              parts: [{ text: item.text }],
            });
            lastRole = item.role;
          }
        }

        // If the last item in contents is 'user', remove it to avoid consecutive 'user' turns with the incoming message
        if (contents.length > 0 && contents[contents.length - 1].role === "user") {
          contents.pop();
        }
      }

      // Add current user prompt as the final turn
      contents.push({
        role: "user",
        parts: [{ text: message }],
      });

      const requestPayload = {
        system_instruction: {
          parts: [{ text: systemPrompt }],
        },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 350,
          topP: 0.95,
        },
      };

      async function callGemini(modelName: string) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;
        const ctrl = new AbortController();
        const timeoutId = setTimeout(() => ctrl.abort(), 18000);
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestPayload),
          signal: ctrl.signal,
        });
        clearTimeout(timeoutId);
        return res;
      }

      let geminiResponse = await callGemini(primaryModel);

      // Graceful fallback to secondary active model if primary returns 503 or 429
      if (!geminiResponse.ok && (geminiResponse.status === 503 || geminiResponse.status === 429)) {
        console.warn(`Primary model ${primaryModel} returned ${geminiResponse.status}, falling back to ${fallbackModel}`);
        geminiResponse = await callGemini(fallbackModel);
      }

      if (!geminiResponse.ok) {
        const errorBody = await geminiResponse.text();
        console.error("Gemini API error response:", errorBody);
        throw new Error(`Gemini API returned error (${geminiResponse.status}): ${geminiResponse.statusText}`);
      }

      const geminiData = await geminiResponse.json();
      const extractedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!extractedText) {
        throw new Error("Gemini API returned an empty candidate response or output was filtered by safety policies.");
      }

      replyText = extractedText;
    }

    // 10. Persist Assistant Message to public.chat_messages (if authenticated user exists)
    let assistantMessageRow = null;
    if (user?.id && activeConvId) {
      const { data: assistantMsg, error: assistantMsgErr } =
        await supabaseClient
          .from("chat_messages")
          .insert({
            conversation_id: activeConvId,
            user_id: user.id,
            sender: "assistant",
            text: replyText,
            is_crisis: crisisDetected,
          })
          .select()
          .single();

      if (!assistantMsgErr && assistantMsg) {
        assistantMessageRow = assistantMsg;
      }

      // 11. Update last message in public.conversations
      await supabaseClient
        .from("conversations")
        .update({
          last_message_text: replyText.substring(0, 100),
          updated_at: new Date().toISOString(),
        })
        .eq("id", activeConvId);
    }

    // 12. Return clean JSON response
    return new Response(
      JSON.stringify({
        reply: replyText,
        isCrisis: crisisDetected,
        isLiveAi: true,
        conversationId: activeConvId,
        userMessage: userMessageRow,
        assistantMessage: assistantMessageRow,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("solace-ai-chat function error:", err);
    return new Response(
      JSON.stringify({
        error: err?.message || "Internal server error occurred while processing companion reflection.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
