# Solace AI — Project Context & Architectural Reference

This document is the definitive reference for the Solace AI mobile application. Any developer or AI assistant working on this repository must read this document thoroughly before proposing or implementing changes.

---

## 1. Project Overview
Solace AI is a mobile mental wellness companion crafted to offer an intimate, therapeutic environment reminiscent of a luxury restorative sanctuary. It provides mindful reflection, grounded conversational AI companionship, emotional check-ins, guided somatic breathing exercises, and holistic well-being analytics.

---

## 2. Project Objective
To provide a calm, low-strain digital space for individuals navigating cognitive overload and emotional fatigue, empowering users to track emotional patterns, practice mindfulness, and reflect with an AI companion that grounds its feedback in real user data.

---

## 3. Target Users
- Individuals managing daily stress, emotional fatigue, or cognitive overwhelm.
- Users seeking structured mindfulness and breathwork without aggressive gamification.
- Mindful journalers wanting gentle, data-grounded AI dialogue and longitudinal emotional insights.

---

## 4. Technology Stack

| Layer | Technology | Decision Status | Notes |
|---|---|---|---|
| Framework | **React Native 0.88.1 (Expo SDK ~58.0.23)** | **Confirmed** | Compatible with Expo Go |
| Language | **TypeScript ~6.0.3** | **Confirmed** | Strict typing across codebase |
| Routing | **Expo Router ~58.0.30 (File-based)** | **Confirmed** | `src/app/` layout structure |
| Styling | **Native StyleSheet / Theme Tokens** | **Confirmed** | Implemented in `src/constants/theme.ts` from Stitch tokens |
| Icons | **@expo/vector-icons** (Lucide/Feather/Ionicons) | **Confirmed** | Bundled with Expo; replaces web inline SVGs |
| Typography | **@expo-google-fonts/newsreader & manrope** | **Confirmed** | Loaded via `useFonts` in root `_layout.tsx` |
| Local Storage | **@react-native-async-storage/async-storage 2.2.0** | **Confirmed** | Installed for offline mood & chat persistence |
| AI Integration | **Google Gemini API** | **Pending Approval** | Direct or Edge-function proxied; not yet configured |
| Backend/Auth | **Supabase** or Local Mock Session | **Pending Approval** | Local mock session first |

---

## 5. Development Environment
- **Host OS:** Windows 11
- **Node.js:** v22.23.2
- **npm:** 10.9.8
- **Git:** 2.55.0
- **Editor:** VS Code & Antigravity
- **Verification Target:** Android physical device / emulator via Expo Go
- **Resource Constraints:** Limited development time; prioritize free tools, local offline capabilities, and zero-cost service tiers.

---

## 6. Project Folder Structure

```text
solace-ai/
├── .expo/                                  # Expo build cache
├── assets/                                 # Static app icons, splash images, fonts
├── src/
│   ├── app/                                # Expo Router screens & layouts
│   │   ├── (tabs)/                         # Main bottom tab routes
│   │   │   ├── home.tsx                    # Home Dashboard
│   │   │   ├── companion.tsx               # AI Companion
│   │   │   ├── insights.tsx                # Wellness Insights
│   │   │   ├── profile.tsx                 # Profile / Sanctuary
│   │   │   └── _layout.tsx                 # 4-tab bottom navigation
│   │   ├── _layout.tsx                     # Root stack navigator
│   │   ├── index.tsx                       # Initial entry / splash router
│   │   ├── onboarding.tsx                  # 3-step onboarding flow
│   │   ├── login.tsx                       # Sign-in screen
│   │   ├── signup.tsx                      # Create account screen
│   │   ├── mood-check-in.tsx               # Daily mood check-in modal/screen
│   │   ├── breathing.tsx                   # Find Your Calm breathing exercise
│   │   ├── chat-history.tsx                # Conversation archives
│   │   └── settings.tsx                    # Accessible via Profile
│   ├── components/
│   │   ├── ui/                             # Reusable atomic buttons, cards, inputs
│   │   ├── breathing/                      # Animated breath pacer rings
│   │   ├── companion/                      # Message bubbles, prompt chips
│   │   ├── mood/                           # Sentiment chips, intensity sliders
│   │   └── navigation/                     # Custom tab bar and headers
│   ├── constants/
│   │   └── theme.ts                        # Design tokens (colors, typography, radii, spacing)
│   ├── hooks/                              # Custom React hooks (useTheme, useTimer)
│   ├── services/                           # Storage, AI prompt engine, analytics helpers
│   └── types/                              # TypeScript interfaces and data models
├── AGENTS.md                               # AI assistant operational rules
├── PROJECT_CONTEXT.md                      # This architectural document
├── app.json                                # Expo app configuration
├── package.json                            # Dependencies and scripts
└── tsconfig.json                           # TypeScript configuration
```

---

## 7. Design Reference Location
The complete, authoritative Google Stitch design export is preserved in the sibling directory:
- **Reference Path:** `C:\Users\Admin\OneDrive\Desktop\New Project\solace-design-reference\`
- **Contents:** 15 subfolders containing 29 total files (14 `code.html`, 14 `screen.png`, and authoritative `DESIGN.md` in `solace_sanctuary/`).

---

## 8. Design System and Color Palette
Directly extracted and verified from `solace-design-reference/solace_sanctuary/DESIGN.md`:

### Palette Tokens
- **Canvas Base (Background):** `#FAF6FF` (Warm ambient lavender-tinted background)
- **Surface Pure:** `#FFFFFF` (Floating cards, elevated modules)
- **Surface Low / Card Base:** `#F3EEFB` / `#EDE5FA` (Soft containers, response bubbles)
- **Primary Violet:** `#2D1B69` / `#180052` (Deep restorative nightfall, headings, main buttons)
- **Secondary Lavender:** `#8B78C6` / `#8B78D8` (Kinetic feedback, active selection, accents)
- **Tertiary / Glow Wisteria:** `#A594F9` (Badges, breathing pacer highlights, halo glows)
- **Neutral Copy:** `#29223A` / `#1C1831` (Primary high-contrast text)
- **Neutral Muted / Border:** `#716B89` / `#797582` (Secondary text, hairline strokes `rgba(113, 107, 137, 0.12)`)

### Shape & Elevation
- **Card Radii:** Smooth `rounded-lg` (2rem / 32px) and `rounded-xl` (3rem / 48px).
- **Control Radii:** Full pill (`rounded-full` / 9999px) for buttons, chips, and selectors.
- **Elevation:** Low-strain, soft atmospheric shadows tinted with deep violet; 1px inner hairline stroke on elevated cards.

---

## 9. Typography
- **Headlines / Display:** `Newsreader` (Editorial serif; communicates empathy, warmth, and reflective poise).
  - Sizes: Display (44px), Headline Lg (36px / 28px mobile), Headline Md (24px), Headline Sm (20px).
- **Body & Labels:** `Manrope` / `Plus Jakarta Sans` (Clean humanist sans-serif; high legibility for chat, inputs, and stats).
  - Sizes: Body Lg (18px), Body Md (16px), Body Sm (14px), Label Lg (15px), Label Md (13px), Label Sm (11px).

---

## 10. Complete Screen Inventory

| # | Screen Name | Reference Subfolder | Key Features to Implement |
|---|---|---|---|
| 1 | **Splash Screen** | `splash_screen` | Pulsing botanical halo, luxury serif brand mark, smooth onboarding route transition. |
| 2 | **Onboarding (3 Steps)** | `onboarding_ai_companion`<br>`onboarding_emotional_space`<br>`onboarding_meaningful_habits` | Swipeable carousel/pager, 3 value propositions, step progress indicators, "Begin Sanctuary" action. |
| 3 | **Login (Sign In)** | `sign_in` | Email/password input fields, password toggle, validation, routing to Signup and Dashboard. |
| 4 | **Signup (Create Account)** | `create_account` | Name, email, password fields, terms agreement toggle, account creation handler. |
| 5 | **Home Dashboard** | `home` | Daily greeting, current mood status, quick breathing launcher, today's reflection quote, recent activity. |
| 6 | **AI Companion** | `companion` | Real chat conversation interface, suggested prompt chips, grounded empathetic replies, message persistence. |
| 7 | **Daily Mood Check-in** | `daily_mood_check_in` | Interactive sentiment selectors, energy slider, contextual tags (Work, Sleep, Relationships), notes field. |
| 8 | **Wellness Insights** | `your_wellness_insights` | Mood trend chart (7-day/30-day), emotional distribution breakdown, genuine insight summaries from user entries. |
| 9 | **Profile (My Sanctuary)** | `my_sanctuary` | User profile overview, streak counts, mindful minutes accumulated, navigation link to Settings. |
| 10 | **Breathing Exercise** | `find_your_calm` | 4-7-8 and Box breathing routines, working timer, animated expanding/contracting pacer ring, pause/resume. |
| 11 | **Chat History** | `your_conversations` | Archived companion chats grouped by date, search query filter, conversation deletion and resumption. |
| 12 | **Settings** | `settings` | Notification toggles, sound/haptic toggles, data export, data clear, privacy statement. |

---

## 11. Application Navigation
- **Root Stack Navigator:** Coordinates non-tab screens (Splash, Onboarding, Auth, Mood Check-in modal, Breathing Exercise, Chat History, Settings).
- **Primary Bottom Tab Navigator (Strict 4-Tab Layout):**
  1. **Home** (`/home`)
  2. **Companion** (`/companion`)
  3. **Insights** (`/insights`)
  4. **Profile** (`/profile`)
- **Settings Access:** Accessible exclusively via a gear/settings icon inside the Profile screen.
- *Strict Rule:* Do not introduce a 5th tab or alter this hierarchy without explicit approval.

---

## 12. Core Functional Requirements
- **No Decorative Placeholders:** Every button, tab, and slider must have a real state handler or action.
- **Empty States:** First-time users must receive thoughtfully written empty states on the Dashboard, Insights, and Chat History explaining how to begin.
- **Responsiveness:** All layouts must adapt fluidly across various Android screen ratios and densities.

---

## 13. Authentication Requirements
- **Current Decision:** Option B Local Demonstration Authentication (**Confirmed & Implemented**).
- **Architecture:** Separated service (`src/services/authService.ts`) and React Context provider (`src/context/AuthContext.tsx`).
- **Data Persisted:** Only non-sensitive session metadata (`token`, `user.id`, `user.name`, `user.email`, `createdAt`) is stored in AsyncStorage under key `'@solace_auth_session'`.
- **Data NOT Persisted:** Passwords and password hashes are **NEVER** stored in AsyncStorage or device storage. They exist exclusively in volatile memory during the active application run.
- **Restart Limitation:** Because passwords are not persisted locally, credential-based login after an app restart requires re-registration in demo mode until Supabase Auth is integrated. The UI and service return an honest, non-technical explanation rather than a generic error.
- **Future Supabase Migration:** `authService` mirrors the standard session, user, and error interfaces, allowing drop-in replacement with `@supabase/supabase-js` without modifying UI screen logic.
- **Navigation Flow:**
  - Fresh install: Splash → Onboarding → Login/Signup → Home
  - Returning authenticated user: Splash → Home
  - Returning unauthenticated user: Splash → Login
  - Logout: Clears AsyncStorage session → redirects to Login. Onboarding state remains completed.

---

## 14. AI Companion Requirements
- **Implementation Status:** Phase 6 Confirmed & Implemented.
- **Model (`src/types/chat.ts`):**
  - `ChatMessage`: `id`, `conversationId`, `sender` (`'user' | 'assistant'`), `text`, `isCrisis`, `createdAt`.
  - `Conversation`: `id`, `userId`, `title`, `lastMessageText`, `createdAt`, `updatedAt`, `messages`.
  - `SUGGESTED_PROMPTS`: "Feeling anxious", "Need gentle clarity", "Help me wind down", "Just want to vent", "Calming exercise".
  - `EMERGENCY_RESOURCES`: US/Canada 988, UK 111/85258, international findahelpline.com, local 911/999/112.
- **Persistence (`src/services/chatService.ts`):**
  - Scoped to authenticated user with AsyncStorage key `@solace_conversations_${userId}`.
  - User isolation: switching user accounts completely isolates dialogues.
  - Sorting: conversations sorted by `updatedAt` descending; messages sorted chronologically.
  - Auto-titling: automatically names new conversation from first user reflection (up to 36 chars) if still default.
  - Full CRUD: create, fetch by ID, add message, rename, search, delete, and clear.
  - Resilience: graceful recovery on corrupted JSON, empty array fallback.
- **Local Demonstration AI Service (`src/services/aiCompanionService.ts`):**
  - **Honest AI Limitation:** Strictly local demonstration service. No live AI model, remote LLM, or cloud API is connected in Phase 6. No external network transmission of user thoughts or reflections.
  - **Supportive Tone:** Non-clinical, empathetic, non-judgmental guidance without diagnosing, prescribing, or claiming to replace human healthcare.
  - **Crisis Safety Fallback:**
    - Basic keyword-based heuristic detection (e.g., self-harm, suicidal intent phrases).
    - Returns empathetic response with verified 24/7 crisis hotlines (988, 111, findahelpline.com) and dedicated safety pill button.
    - Limitation Disclosure: Keyword detection is a basic safeguard and NOT a clinical or emergency monitoring system.
- **UI Screens:**
  - `src/app/(tabs)/companion.tsx`: High-fidelity conversational interface derived from Stitch `companion/` with sanctuary status bar, safety banner, welcoming editorial card with suggested prompt chips, user and assistant message bubbles, "Solace is reflecting" indicator, multiline input capsule with send button, emergency care modal, and keyboard-safe layout.
  - `src/app/chat-history.tsx`: History screen derived from Stitch `your_conversations/` with real-time text search, date grouping ("Today", "Yesterday", "Earlier"), conversation cards with message count tags, action modal (continue, rename, delete with double-confirmation), and empty sanctuary state.

---

## 15. Mood Tracking Requirements
- **Implementation Status:** Phase 5 Confirmed & Implemented.
- **Model (`src/types/mood.ts`):**
  - Primary Moods: `happy` (Radiant), `calm` (Calm), `neutral` (Neutral), `sad` (Heavy), `anxious` (Flutter).
  - Intensity continuum: 1 (Gentle whisper) to 5 (Deep & profound).
  - Nuanced micro-tags: dynamic per primary mood (e.g. Grounded, Content, Serene, Reflective, Peaceful).
  - Context tags: `#Morning`, `#Rest`, `#Work`, `#Gratitude`, `#Relationships`, `#Nature`, `#Health`, `#Creativity`.
  - Optional private reflection note (up to 300 characters).
- **Persistence (`src/services/moodService.ts`):**
  - Scoped to authenticated user via AsyncStorage key `@solace_mood_entries_${userId}` (fallback to `guest_user`).
  - Immutable chronologically-ordered entries (newest first).
  - Zero-fabrication streak and summary calculator (`getWellnessJourneySummary`): streak starts at 0 if no check-ins exist, counting strictly consecutive active calendar days (today/yesterday).
  - Current calendar week (Mon–Sun) timeline mapping entries to actual days.
- **UI Screens:**
  - `src/app/(tabs)/home.tsx`: High-fidelity dashboard featuring personalized greeting, quick 1-tap check-in, verified status feedback pill, companion highlight card ("Talk to Solace"), daily intention quote with working like toggle, mindful practice quick hub (Box Breathing, Daily Reflection, Body Scan), real 7-day progress timeline, and honest empty state when 0 check-ins exist.
  - `src/app/mood-check-in.tsx`: Full Stitch check-in flow with 5 mood cards, dynamic nuance tags, 5-node intensity track with fill animation, private reflection note with character counter and context tag pills, Solace listening card, and post-save confirmation sheet linking to breathing grounding exercise.

---

## 16. Breathing Exercise Requirements
- **Implementation Status:** Phase 7 Confirmed & Implemented (including Custom Breathing Studio).
- **Model & Types (`src/types/breathing.ts`):**
  - `BreathingPhaseType`: `'inhale' | 'holdIn' | 'exhale' | 'holdOut'`.
  - `ActivePhaseInfo`: `type`, `label`, `shortLabel`, `durationSeconds`, `scaleTarget`.
  - `BreathingPattern`: `id`, `name`, `tagline`, `description`, `inhale` (1-15s), `holdIn` (0-15s), `exhale` (1-20s), `holdOut` (0-15s).
  - Presets included:
    1. **Box Breathing**: Inhale 4s, Hold 4s, Exhale 4s, Hold 4s (16s cycle).
    2. **Gentle Long Exhale**: Inhale 4s, Exhale 6s (0s holds skipped, 10s cycle).
    3. **Extended Exhale**: Inhale 4s, Exhale 8s (0s holds skipped, 12s cycle).
    4. **4-7-8 Breathing**: Inhale 4s, Hold 7s, Exhale 8s (0s holdOut skipped, 19s cycle).
    5. **Short Rhythm**: Inhale 2s, Exhale 2s (0s holds skipped, 4s cycle).
    6. **Custom Studio**: User-configured timings with live validation and cycle preview.
- **Engine Logic (`src/services/breathingEngine.ts`):**
  - Pure calculation and validation logic separated from UI.
  - Zero-second hold skipping: `getPhasesForPattern()` omits phases with 0 duration so cycles transition naturally without stutter.
  - Duration validation: enforces physiologically safe bounds (no hyperventilation, total cycle >= 2s).
  - Timer and backgrounding tracking: calculates time deltas via `Date.now()` and React Native `AppState` to prevent timer freezing or drift when switching apps.
- **Visual Pacer & Studio UI (`src/app/breathing.tsx`):**
  - Derived from Stitch `find_your_calm/` with ambient luminous glow rings and organic core orb.
  - Synchronized React Native `Animated` scaling: orb expands smoothly to 1.14 during inhale, holds during breath retention, and contracts to 0.90 during exhale.
  - Phase indicators: dynamic pills reflecting active pattern with current phase highlight.
  - Controls: Start, Pause, Resume, Reset, and End & Reflect.
  - Studio Modal: pattern picker, custom steppers, and sound/haptic toggles.
  - Completion Modal: stats summary (time breathed, cycles completed, pattern used), repeat session option, daily mood check-in shortcut, and return Home navigation.
  - Safety & Medical Disclosures: prominent note to breathe gently and stop if experiencing dizziness; explicit non-medical mindfulness scope.

---

## 17. Insights and Analytics Requirements
- All charts and statistics must be computed strictly from the user's stored check-in entries.
- If fewer than 3 records exist, display an encouraging "Gathering data" empty state rather than fabricated trend lines.

---

## 18. Chat History Requirements
- Group previous conversation threads chronologically (Today, Yesterday, Last 7 Days).
- Include working text search to filter threads by topic or message keyword.
- Include thread deletion to respect user autonomy.

---

## 19. Settings Requirements
- Settings toggles (e.g., Daily Reminder, Haptic Feedback, Dark Mode preview) must actually update local app preferences and immediately reflect changes.
- Provide a working "Clear All Data" action with double-confirmation modal.

---

## 20. Data Storage and Backend Decisions
- **Current Decision:** Local-First storage (**Confirmed**).
- **Persistence Method:** `AsyncStorage` for user preferences and state; JSON-serialized local storage for mood logs and chat messages.
- **Cloud Backend (Supabase):** *Pending Approval* — not configured in the current phase.
- **AI Service (Gemini API):** *Pending Approval* — mock local companion generator used until API key and proxy strategy are finalized.

---

## 21. Security and Privacy Requirements
- Zero client-side API secret exposure.
- No false claims of end-to-end encryption or HIPAA compliance unless technically implemented and verified.
- Clear disclosure that wellness insights and reflections are for mindfulness support and not medical advice.

---

## 22. Development Roadmap
- **Phase 1: Foundation & Design System (Current)**
  - Context & Git setup
  - Color, typography, and theme token extraction in `src/constants/theme.ts`
  - Font package installation (`Newsreader`, `Manrope`)
- **Phase 2: Navigation & Screen Scaffolding**
  - Expo Router configuration with 4-tab layout and modal routes
  - Empty screen structures with design-compliant headers
- **Phase 3: Core Feature Implementation**
  - Splash & Onboarding
  - Home Dashboard & Daily Mood Check-in flow
  - Local persistence engine
  - Somatic Breathing Exercise engine
- **Phase 4: AI Companion & Analytics**
  - Chat interface & conversation store
  - Insights computation engine
  - Settings & data management
- **Phase 5: Refinement, Polish & Device Testing**
  - Android Expo Go verification
  - Micro-interactions, animations, and sound/haptics

---

## 23. Completed Tasks
- [x] Inspected extracted Stitch export in `solace-ai/stitch_solace_ai_wellness_dashboard`.
- [x] Verified presence of all 12 requested Solace AI screens across 15 subfolders.
- [x] Copied complete export to sibling reference folder `solace-design-reference/` (29 files preserved).
- [x] Verified repository-local Git identity configured to `Coder-Jay00` (`coderjt25@gmail.com`).
- [x] Created `AGENTS.md` with strict AI guidelines.
- [x] Created `PROJECT_CONTEXT.md` comprehensive architectural reference.
- [x] Added `stitch_solace_ai_wellness_dashboard/` to `.gitignore` to keep application Git commits clean.
- [x] Installed approved dependencies: `@expo-google-fonts/newsreader`, `@expo-google-fonts/manrope`, and `@react-native-async-storage/async-storage`.
- [x] Implemented authoritative design tokens in `src/constants/theme.ts` (colors, typography, spacing, radii, atmospheric shadows).
- [x] Configured font loading in root `src/app/_layout.tsx` using `useFonts` with graceful splash overlay synchronization.
- [x] Passed 20/20 diagnostics in `npx expo-doctor` and verified Metro bundler startup.
- [x] Created reusable typed UI primitives in `src/components/solace/`: `ScreenContainer`, `SolaceCard`, `SolaceButton`, `SolaceHeader`, `MoodChip`, `LoadingIndicator`.
- [x] Built custom 4-tab bottom navigation bar (`SolaceTabBar`) with safe-area insets, distinct active states, and non-clipping touch targets.
- [x] Configured Expo Router layout with 4 main tabs (`/(tabs)/home`, `/(tabs)/companion`, `/(tabs)/insights`, `/(tabs)/profile`).
- [x] Registered all secondary stack routes (`onboarding`, `login`, `signup`, `mood-check-in`, `breathing`, `chat-history`, `settings`).
- [x] Scaffolded typed placeholder screens for all 4 tabs and secondary routes with shared components.
- [x] Implemented Phase 3 Splash screen in `src/app/index.tsx` featuring botanical emblem, floating ambient glow, pulsing indicator dot, "Mindful Companion" pill, Newsreader brand typography, micro wellness badges, animated breathing progress bar, and seamless font/splash synchronization.
- [x] Created typed onboarding persistence service in `src/services/onboardingStorage.ts` utilizing AsyncStorage with key `'@solace_has_completed_onboarding'`.
- [x] Implemented comprehensive 3-step Onboarding flow in `src/app/onboarding.tsx` derived from Stitch references (`onboarding_emotional_space`, `onboarding_ai_companion`, `onboarding_meaningful_habits`) with responsive visual canvases, step indicators, working Next/Back/Skip navigation, and "Get Started" persistence handler.
- [x] Verified launch routing: fresh installs navigate Splash → Onboarding; returning users seamlessly route Splash → `/(tabs)/home`.
- [x] Implemented Phase 4 Option B Local Demonstration Authentication:
  - Created typed `src/services/authService.ts` handling email normalization, validation, volatile in-memory registry, session persistence, and honest restart limitation handling.
  - Implemented `src/context/AuthContext.tsx` with startup session restoration and clean UI hooks.
  - Built high-fidelity Login screen in `src/app/login.tsx` matching Stitch `sign_in` design with email validation, password visibility toggle, loading feedback, inline error banner, demo forgot password notice, and unavailable Google sign-in tag.
  - Built high-fidelity Signup screen in `src/app/signup.tsx` matching Stitch `create_account` design with dynamic password strength indicator, confirm password matching, interactive Terms & Conditions checkbox, inline validation, and demo notices.
  - Updated `src/app/(tabs)/profile.tsx` with dynamic user profile display and functional "Sign Out" flow.
  - Executed 21/21 automated unit and integration tests covering empty inputs, invalid emails, password mismatches, terms acceptance, duplicate registrations, login, session restoration, and logout.

- [x] Implemented Phase 5: Home Dashboard & Mood Check-in:
  - Created typed data model in `src/types/mood.ts` (`MoodType`, `MOOD_OPTIONS`, `INTENSITY_LEVELS`, `CONTEXT_TAG_SUGGESTIONS`, `MoodEntry`, `DayActivity`, `WellnessJourneySummary`).
  - Created robust scoped local persistence service in `src/services/moodService.ts` utilizing AsyncStorage key `@solace_mood_entries_${userId}`, chronological sorting, corruption recovery, and authentic zero-fabrication streak calculator.
  - Implemented high-fidelity Home Dashboard in `src/app/(tabs)/home.tsx` featuring time-aware personalized greeting (`user?.name`), 1-tap quick mood check-in with verified status feedback pill, full-fidelity "Talk to Solace" companion highlight card, daily intention card with interactive quote liking, mindful practices quick hub (Box Breathing, Daily Reflection, Body Scan), live 7-day week progress timeline, and an honest empty state for new users.
  - Implemented comprehensive Daily Mood Check-In screen in `src/app/mood-check-in.tsx` derived from Stitch `daily_mood_check_in` with 5 primary mood states (Radiant, Calm, Neutral, Heavy, Flutter), dynamic nuance micro-tags, 5-node intensity track, private journal note with character count and context tag pills, "Solace is listening" active care card, and an interactive confirmation modal with immediate grounding breath CTA.
  - Executed 15/15 automated unit and integration tests covering user isolation, validation, chronological sorting, corruption recovery, streak calculations, and deletion.
  - Passed 20/20 checks on `npx expo-doctor`.

- [x] Implemented Phase 6: AI Companion Conversational Interface & Chat History:
  - Created typed data models in `src/types/chat.ts` (`ChatMessage`, `Conversation`, `ConversationGroup`, `CompanionPromptSuggestion`, `EMERGENCY_RESOURCES`, `SUGGESTED_PROMPTS`).
  - Created scoped conversation persistence service in `src/services/chatService.ts` with AsyncStorage key `@solace_conversations_${userId}`, user isolation, chronological message ordering, updatedAt-based conversation sorting, auto-titling, search, rename, and delete.
  - Implemented local demonstration AI response & crisis safety service in `src/services/aiCompanionService.ts` providing supportive non-clinical responses, transparent demo limitations, and heuristic crisis keyword safety fallback with verified 24/7 hotline numbers (US/Canada 988, UK 111/85258, international findahelpline.com).
  - Built high-fidelity Companion Chat Interface in `src/app/(tabs)/companion.tsx` derived from Stitch `companion/` with presence status bar, safety banner, welcoming editorial card, suggested prompt chips, user and assistant message bubbles, reflecting indicator, multiline input capsule with send button, emergency care modal, and keyboard-safe layout.
  - Built comprehensive Chat History screen in `src/app/chat-history.tsx` derived from Stitch `your_conversations/` with real-time text search, date grouping ("Today", "Yesterday", "Earlier"), conversation cards with message count tags, action menu (continue, rename, delete with double-confirmation), and empty sanctuary state.
  - Executed 17/17 automated unit and integration tests covering empty storage, conversation creation, message persistence, demo responses, app restart simulation, message ordering, conversation sorting, multi-user isolation, deletion, corrupted JSON recovery, crisis fallback behavior, and duplicate prevention.
  - Passed 20/20 checks on `npx expo-doctor`.
  - Compiled Android production bundle (`npx expo export --platform android`) with 1700 modules and zero errors.

- [x] Implemented Phase 7: Guided Breathing Exercise & Custom Breathing Studio:
  - Created typed data models in `src/types/breathing.ts` (`BreathingPhaseType`, `ActivePhaseInfo`, `BreathingPresetId`, `BreathingPattern`, `BREATHING_PRESETS`, `BreathingSessionConfig`, `BreathingSessionStats`).
  - Created breathing engine in `src/services/breathingEngine.ts` handling phase sequencing, zero-second hold skipping, custom pattern validation, cycle calculations, and time formatting.
  - Implemented 6 breathing patterns: Box Breathing (4-4-4-4), Gentle Long Exhale (4-6), Extended Exhale (4-8), 4-7-8 Breathing, Short Rhythm (2-2), and Custom Studio with configurable 1-15s inhale, 0-15s holds, 1-20s exhale.
  - Implemented high-fidelity Breathing Screen in `src/app/breathing.tsx` matching Stitch `find_your_calm/` with ambient glow halos, smooth React Native Animated pacer orb scaling, dynamic phase step indicators, session goal timer with cycle count, Start/Pause/Resume/Reset controls, and a completion modal with session stats, repeat action, and mood log shortcut.
  - Built AppState backgrounding tracker to prevent timer drift and ensure smooth foreground resumption.
  - Executed 26/26 automated unit and integration tests covering presets, hold skipping, validation, timer state machine, phase transitions, backgrounding, target cycles, and reset.
  - Passed 20/20 checks on `npx expo-doctor`.
  - Compiled Android production bundle (`npx expo export --platform android`) with 1702 modules and zero errors.

- [x] Implemented Phase 7.5: UX Polish, Navigation, Theme & Feature Integration:
  - **Work Area 1: Loading States, Screen Transitions & Back Gestures:** Added polished indicators, submit button disabled/loading states with visual feedback, and comprehensive Android hardware back press navigation (`BackHandler`) across all modal and stack routes (`login`, `signup`, `terms`, `privacy`, `settings`, `mood-check-in`, `breathing`, `companion`, `chat-history`, `onboarding`).
  - **Work Area 2: Terms & Conditions, Privacy Policy & Legal Consent:** Created `src/app/terms.tsx` and `src/app/privacy.tsx` detailing draft status, non-medical disclaimer, clinical psychotherapy boundaries, local-first storage, zero third-party tracking, and 24/7 crisis resources; integrated mandatory consent checkbox into `src/app/signup.tsx` (unchecked by default, blocks account creation until accepted), linking to both documents; recorded `consentVersion: '1.0.0'` and `consentAcceptedAt` in demo user profile metadata.
  - **Work Area 3: Mood Selection Feedback on Home:** Enhanced quick mood selection on `src/app/(tabs)/home.tsx` with instant inline confirmation card/toast ("You selected {Mood}. Thank you for checking in with yourself."), quick action link ("Add reflection & notes →"), debounced rapid tapping (700ms threshold), and subtle saving indicator.
  - **Work Area 4: Android Chat Keyboard & Composer Layout:** Resolved Android keyboard/composer layout conflict by hiding `SolaceTabBar` on mobile whenever the soft keyboard is active via `Keyboard.addListener`; tracked `isNearBottomRef` to prevent forcible autoscroll when reviewing past reflections while maintaining auto-scroll on send/receive; ensured hardware back dismisses keyboard before navigating.
  - **Work Area 5: Global Light & Dark Theme System:** Implemented `src/context/ThemeContext.tsx` providing `themeMode` ('system' | 'light' | 'dark'), live `activeTheme`, and `themeColors` persisted via `@solace_theme_preference`; migrated all screens, layouts, and reusable components from static color schemes to dynamic `useTheme()` hooks.
  - **Work Area 6: Settings Screen & Sanctuary Empty States:** Built complete `src/app/settings.tsx` with 3-way visual theme selector (System Default, Light Sanctuary, Dark Nightfall), account information card with demo status badge, legal links, app technical details, double-confirmation Clear All Local Data action (removing all `@solace_` storage keys), and logout flow; upgraded `src/app/(tabs)/profile.tsx` with real metrics pulled from `moodService`, `chatService`, and `breathingService`, honest Stitch-inspired empty state ("Your sanctuary is waiting for its first breath") with direct CTAs, and settings gear button.
  - **Work Area 7: Pull-to-Refresh Interaction:** Added native `RefreshControl` with theme color tinting across all 4 primary scrollable views (`home.tsx`, `insights.tsx`, `profile.tsx`, `chat-history.tsx`).
  - **Work Area 8: Breathing Exercise Integration Across Solace:** Created `src/types/breathingSession.ts` and `src/services/breathingService.ts` scoped to `@solace_breathing_sessions_${userId}`; connected `src/app/breathing.tsx` completion flow to persist real sessions; surfaced breathing metrics on Home ("X min breathed", "Last: {pattern}"), Profile, and Insights.
  - Executed 12/12 automated unit and integration tests in `solace-ai/scripts/test_phase7_5.mjs` verifying file presence, legal disclosures, consent handling, breathing calculations, theme parity, keyboard handling, and settings actions.
  - Passed 20/20 checks on `npx expo-doctor`.
  - Compiled Android production bundle (`npx expo export --platform android --no-bytecode`) with 1706 modules and zero errors.

---

## 24. Sky & Rose Design System — Complete Visual Rebranding

### 24.1 Rebranding Overview
- Successfully transitioned Solace AI from the legacy purple/white scheme to the comforting **Sky & Rose Design System** across both Light (*Morning Sky*) and Dark (*Evening Sky*) modes.
- Preserved 100% of application logic, demo authentication, local persistence, breathing mechanics, and navigation architecture without performing an application rebuild.
- Brand personality: Gentle, compassionate, warm, reassuring, modern, premium, emotionally welcoming.

### 24.2 Complete Palette Specification
| Token | Light (Morning Sky) | Dark (Evening Sky) | Semantic Usage |
| :--- | :--- | :--- | :--- |
| `background` | `#EAF2F8` | `#192A38` | Screen backdrop (Soft Sky Blue / Deep Slate Twilight) |
| `surface` | `#F9FBFD` | `#243847` | Base card and container surface |
| `surfaceElevated` | `#FFFFFF` | `#2D4353` | Floating cards, modals, interactive elements |
| `primary` | `#A85F72` | `#D59AA7` | Brand accent, primary action buttons, selected highlights (Rose / Dusty Rose) |
| `primaryPressed` | `#914D60` | `#E0AFB9` | Pressed state feedback |
| `onPrimary` | `#FFFFFF` | `#283541` | High-contrast label on primary (Dark text on rose in dark mode!) |
| `secondary` | `#DCEAF2` | `#344D5E` | Powder blue chip background, inactive pill tracks, secondary buttons |
| `secondaryAccent` | `#C7DCEB` | `#405A6B` | Borders, subtle highlights |
| `blush` | `#F1DFE2` | `#4B3944` | Soft rose halo, emotional accent, active selection background |
| `text` | `#34495C` | `#F0F3F5` | Primary headline and body typography |
| `textSecondary` | `#758797` | `#B3C4D0` | Subtitles, secondary notes, descriptions |
| `textMuted` | `#91A0AD` | `#91A6B5` | Timestamps, footnotes, placeholder text |
| `border` | `#D9E4EC` | `#3B5060` | Gentle boundary lines and dividers |
| `success` | `#547B68` | `#91B8A3` | Confirmations, checkmarks, completed streaks |
| `warning` | `#A97842` | `#E0B477` | Legal disclaimers, draft notices |
| `error` | `#A44F5C` | `#E09AA4` | Delete dialogs, error states |
| `errorContainer` | `#FCEBEB` | `#4A252B` | Gentle background for error banners and warnings |
| `tabBackground` | `#F9FBFD` | `#243847` | Bottom navigation tab bar background |
| `overlay` | `rgba(39, 57, 72, 0.32)` | `rgba(5, 15, 23, 0.65)` | Modal backdrops and dimming sheets |

### 24.3 Geometry, Shadows & Typography
- **Corner Radii:** Card 24 (`Radii.card`), Large 28 (`Radii.lg`), Extra-Large 32 (`Radii.xl`), Full 9999 (`Radii.full`).
- **Shadows:** Soft slate elevation (`shadowColor: '#192A38'`, opacity 0.08) and rose glow accent (`shadowColor: '#A85F72'`, opacity 0.20).
- **Typography Scale:** Newsreader (500–600 editorial headings, italic reflections) and Manrope (400–500 body, 600–700 labels/buttons).
- **Dark Mode Button Contrast Rule:** Strict enforcement that rose buttons use `#283541` (dark text) in dark mode and `#FFFFFF` (white text) in light mode.

### 24.4 Verified Screen & Component Coverage
All 14 routes and shared components have been fully migrated:
1. `src/constants/theme.ts`: Core tokens, typography, radii, shadows, and backwards-compatible aliases.
2. `src/app/_layout.tsx`: Status bar style synchronization (`light` vs `dark`) and navigation theme binding.
3. `src/components/solace/*`: `ScreenContainer`, `SolaceTabBar`, `SolaceButton`, `SolaceCard`, `LoadingIndicator`, `MoodChip`.
4. `src/app/index.tsx`: Splash screen with blush emblem halo, rose pulse dot, and smooth entrance animation.
5. `src/app/onboarding.tsx`: 3-step carousel with rose active indicators and powder-blue secondary elements.
6. `src/app/login.tsx`: Powder-blue ambient glow, blush halo, cloud white cards, rose action buttons.
7. `src/app/signup.tsx`: Powder-blue intention card, rose buttons, themed checkbox and consent links.
8. `src/app/(tabs)/home.tsx`: Welcoming sanctuary header, mood buttons, rose companion card, box breathing shortcuts, timeline.
9. `src/app/(tabs)/companion.tsx`: Rose user message bubble, cloud white assistant bubble, rose send button, themed care modal.
10. `src/app/mood-check-in.tsx`: Powder-blue & blush mood palette, rose active state, intensity continuum, modal sheet.
11. `src/app/breathing.tsx`: Powder-blue & blush animated pacer orb, rose timer, phase pills, custom studio modal.
12. `src/app/(tabs)/insights.tsx`: Cloud white metric cards, blush dominant rhythm badge, breathwork history.
13. `src/app/(tabs)/profile.tsx`: Powder-blue settings gear, identity card, botanical empty state, quick navigation.
14. `src/app/chat-history.tsx`: Cloud white search pill, segmented control, group headers, delete confirmation.
15. `src/app/settings.tsx`: Morning Sky & Evening Sky theme selectors, soft error delete card, logout modal.
16. `src/app/terms.tsx` & `src/app/privacy.tsx`: Themed draft notices, warning accents, rose section titles and completion CTAs.

### 24.5 Automated Verification Results
- **TypeScript:** `npx tsc --noEmit` passed with 0 errors.
- **Expo Doctor:** `20/20 checks passed. No issues detected!`
- **Phase 7.5 Verification Suite (`solace-ai/scripts/test_phase7_5.mjs`):** 12/12 tests passed.
- **Sky & Rose Verification Suite (`solace-ai/scripts/test_sky_rose.mjs`):** 56/56 checks passed.
- **Legacy Residue Scan:** 0 occurrences of legacy purple/violet/error colors.
- **Android Production Bundling:** `npx expo export --platform android --no-bytecode` bundled 1,706 modules with 0 errors.

---

## 25. Phase 7.6–7.8: Local Notifications & Reminders System

### 25.1 Architecture & Scope
Solace AI implements a 100% local, privacy-first scheduled notification and reminder engine.
- **Zero Cloud / Push Dependency:** Operates completely offline without Supabase, remote push servers, or external APNs/FCM endpoints.
- **Zero Data Exposure:** Notification titles and bodies contain generic, serene copy ("A little moment for yourself. How are you feeling today?"). Private user reflections, moods, and companion chat logs are never placed in notification content.
- **Opt-In by Default:** Every reminder category and master notifications are strictly `false` (OFF) on fresh installs. Schedules are created only upon explicit user activation and permission grant.
- **OS Battery Optimization Honesty:** Delivery is scheduled via Expo Notifications standard schedulers (`DAILY` and `WEEKLY` triggers). Android OS battery optimization and Doze mode may cause minor delivery variance; no impossible exact-millisecond delivery guarantees are claimed.

### 25.2 Installed Dependencies & Android Configuration
- **Package:** `expo-notifications: ~58.1.8` (compatible with Expo SDK 58, React Native 0.88, React 19).
- **App Plugin:** Configured in `app.json`:
  ```json
  [
    "expo-notifications",
    {
      "icon": "./assets/images/icon.png",
      "color": "#A85F72"
    }
  ]
  ```
- **Android Notification Channels (Android 8.0+):**
  1. `mood-reminders`: "Mood Check-in Reminders" (Importance `DEFAULT`, vibration `[0, 250, 250, 250]`, light `#A85F72`)
  2. `breathing-reminders`: "Breathing Practice Reminders" (Importance `DEFAULT`, vibration `[0, 250, 250, 250]`, light `#A85F72`)
  3. `intention-reminders`: "Daily Intention Reminders" (Importance `DEFAULT`, vibration `[0, 250, 250, 250]`, light `#A85F72`)
  4. `companion-reminders`: "Companion Reminders" (Importance `DEFAULT`, vibration `[0, 250, 250, 250]`, light `#A85F72`)

### 25.3 Dedicated Notification Types & Storage Architecture
Defined in `src/types/notification.ts`:
- **Storage Key:** `@solace_notification_preferences_${userId}` (with `'guest_user'` fallback for unauthenticated demonstration sessions). Isolated from mood, chat, and auth stores.
- **Data Structure:**
  ```ts
  export interface NotificationPreferences {
    masterEnabled: boolean;
    moodReminder: ReminderPreference;         // { enabled, hour, minute, notificationId }
    breathingReminder: WeekdayReminderPreference; // { enabled, hour, minute, selectedDays, notificationIds }
    intentionReminder: ReminderPreference;    // { enabled, hour, minute, notificationId }
    companionReminder: WeekdayReminderPreference; // { enabled, hour, minute, selectedDays, notificationIds }
    quietHours: QuietHoursPreference;         // { enabled, startHour, startMinute, endHour, endMinute }
    updatedAt?: string;
  }
  ```
- **Sanitizer & Validator:** `validateNotificationPreferences(raw)` ensures corrupted, missing, or type-invalid storage safely falls back to defaults without application crashes.

### 25.4 Quiet Hours Calculation Engine
Implemented in `src/services/notificationService.ts`:
- **Same-Day Window (e.g. 13:00 to 15:00):** `time >= start && time < end`.
- **Midnight-Spanning Window (e.g. 22:00 to 07:00):** `time >= start || time < end`.
- **Shift Logic:** `computeEffectiveTime(hour, minute, quietHours)` shifts any reminder scheduled inside the quiet window to the end of the quiet period (`endHour:endMinute`), preserving cadence while respecting user quiet time.

### 25.5 Notification Tap Routing & Cold-Start Navigation
Implemented in `src/app/_layout.tsx` and `src/services/notificationService.ts`:
- **Destination Matrix:**
  | Category | Channel ID | Default Schedule | Tap Destination |
  |---|---|---|---|
  | Mood Check-in | `mood-reminders` | Daily 8:00 PM | `/mood-check-in` |
  | Breathing Practice | `breathing-reminders` | Weekdays 2:00 PM | `/breathing` |
  | Daily Intention | `intention-reminders` | Daily 8:30 AM | `/(tabs)/home` |
  | Sanctuary Companion | `companion-reminders` | Weekdays 7:00 PM | `/(tabs)/companion` |
- **Cold-Start Handling:** `Notifications.getLastNotificationResponseAsync()` checks for launch intents on cold startup and routes after the navigation tree finishes mounting.
- **Foreground / Background Listener:** `Notifications.addNotificationResponseReceivedListener` safely routes interactive taps with cleanup on unmount.

### 25.6 Settings Screen Integration (`src/app/settings.tsx`)
Styled using the permanent Sky & Rose Design System:
1. **Master Control Card:** Master toggle, explanation, and permission badge (`Granted`, `Denied`, or `Requested`).
2. **Permission Explanation Modal (`PermissionExplanationModal.tsx`):** Explains local self-care scope and opens device settings via `Linking.openSettings()` if previously denied.
3. **Category Cards:** Toggle switch, formatted time pill, cadence notes, and gentle copy.
4. **Time Picker Modal (`TimePickerModal.tsx`):** Cross-platform 12-hour AM/PM stepper modal with quick presets (Morning, Midday, Afternoon, Evening, Night).
5. **Weekday Selector (`WeekdaySelector.tsx`):** Circular day pills for Monday through Sunday with multi-select support.
6. **Quiet Hours Card:** Master quiet hours toggle, Start/End time buttons, and midnight-crossing notice.
7. **Static Notification Preview Card (`NotificationPreviewCard.tsx`):** High-fidelity card demonstrating sample on-device notification layout.
8. **Data Clearance Integration:** "Clear All Local Data" cancels all scheduled Solace notifications and removes notification preference keys.

### 25.7 Automated Verification Suite Results
- **Notification Test Suite (`solace-ai/scripts/test_notifications.mjs`):** 17 / 17 tests passed (covering all 18 requirements).
- **TypeScript:** `npx tsc --noEmit` passed with 0 errors.
- **Expo Doctor:** `20/20 checks passed. No issues detected!`
- **Phase 7.5 Verification Suite:** 12 / 12 tests passed.
- **Sky & Rose Verification Suite:** 56 / 56 checks passed.
- **Android Production Bundling:** `npx expo export --platform android --no-bytecode` bundled 1,775 modules with 0 errors.

### 25.8 Manual Android Device Testing Guide
1. **Permission Flow:**
   - Launch app on Android device via Expo Go or development build.
   - Navigate to `Settings` -> `Notifications & Reminders`.
   - Toggle "Enable Reminders". Observe system permission prompt.
   - Test "Allow": verify badge shows "✓ System Notifications Allowed".
   - Test "Don't Allow": verify friendly modal appears with "Open Settings" button.
2. **Enabling & Changing Reminders:**
   - Toggle "Daily Mood Check-in" ON. Tap time pill and pick a time 2 minutes in the future.
   - Observe notification arrives with sound and gentle vibration.
   - Tap notification while in foreground: verifies immediate navigation to `/mood-check-in`.
3. **Background & Cold-Start Tap:**
   - Put app in background or close it completely.
   - When reminder triggers in notification tray, tap it: verifies app opens and navigates directly to the target screen.
4. **Weekday Selection:**
   - On Breathing Practice or Companion, toggle weekdays on/off. Verify selection persists after app restart.
5. **Quiet Hours:**
   - Enable Quiet Hours from 22:00 to 07:00. Set a reminder at 23:00. Verify effective firing time is shifted to 07:00.
6. **Master Toggle & Clear Data:**
   - Toggle Master OFF: all scheduled notifications are immediately cancelled.
   - Tap "Clear All Local Data": all Solace schedules and preferences are cleanly wiped.

---

## 26. Phase 8: Supabase Cloud Backend & Database Schema

### 26.1 Architectural Security & Credential Rules
- **Zero Secrets In Client:** Only public environment variables (`EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`) are utilized by the client application. Service-role or secret keys are never included or referenced.
- **Git Protection:** `.env` and `.env*.local` are explicitly ignored by `.gitignore`. A clean template is provided in `.env.example`.
- **Zero Console/Report Credential Exposure:** Environment variables are validated locally (`scripts/validate_env.mjs`) without ever printing secret values or URLs to stdout or documentation.
- **Offline / Local Fallback Guarantee:** When Supabase credentials are not yet configured or the database schema has not yet been executed, Solace AI gracefully falls back to local AsyncStorage and in-memory demonstration authentication without throwing unhandled exceptions.

### 26.2 Database Schema (`supabase/schema.sql`)
A complete, production-ready SQL script is provided in `supabase/schema.sql`:
1. **Extensions:** `uuid-ossp` and `pgcrypto`.
2. **Tables & Relationships:**
   - `public.profiles`: 1-to-1 with `auth.users(id)` on delete cascade. Tracks email, full name, avatar, consent version, and acceptance timestamp.
   - `public.mood_entries`: Scoped by `user_id references auth.users(id) on delete cascade`. Stores mood type, energy level (1–5), note, nuances, and context tags.
   - `public.breathing_sessions`: Scoped by `user_id references auth.users(id) on delete cascade`. Stores pattern ID, pattern name, inhale/hold/exhale timings, duration seconds, and completed cycles.
   - `public.conversations`: Scoped by `user_id references auth.users(id) on delete cascade`. Tracks reflection conversations, titles, and last message previews.
   - `public.chat_messages`: Scoped by `conversation_id references public.conversations(id) on delete cascade` and `user_id references auth.users(id) on delete cascade`. Stores sender (`user`, `assistant`, `system`), text, crisis flag, and timestamp.
   - `public.user_preferences`: Scoped by `user_id references auth.users(id) on delete cascade unique`. Syncs master toggle, mood, breathing, intention, companion reminders, quiet hours, and theme mode.
3. **Performance Indexes:**
   - `idx_profiles_id`
   - `idx_mood_entries_user_date`
   - `idx_breathing_sessions_user_date`
   - `idx_conversations_user_updated`
   - `idx_chat_messages_conv_date`
   - `idx_chat_messages_user`
   - `idx_user_preferences_user`
4. **Automatic Profile Trigger:**
   - `handle_new_user()` function automatically creates a corresponding row in `public.profiles` and `public.user_preferences` upon `auth.users` insertion.
5. **Row-Level Security (RLS) Policies:**
   - RLS enabled across all 6 tables.
   - Granular `select`, `insert`, `update`, and `delete` policies enforcing `auth.uid() = user_id` (or `auth.uid() = id` for `profiles`), guaranteeing strict data isolation.

### 26.3 Client Services Integration
- `src/services/supabaseClient.ts`: Initializes `@supabase/supabase-js` with AsyncStorage session persistence, auto-refresh token support, and safe fallback if unconfigured.
- `src/services/authService.ts`: Hybrid authentication supporting Supabase Auth (`signUp`, `signInWithPassword`, `signOut`, `getSession`) with fallback to in-memory demonstration authentication.
- `src/services/supabaseSyncService.ts`: Data synchronization helpers for mood entries, breathing sessions, and preferences. Safe connection check `checkConnection()` reports whether the database is connected or if `supabase/schema.sql` is pending execution.
- `src/app/settings.tsx`: Displays live backend architecture status, RLS model, and schema reference under "Cloud & Database Synchronization".

### 26.4 Automated Verification Results
- **Phase 8 Verification Suite (`solace-ai/scripts/test_phase8.mjs`):** 12 / 12 tests passed.
- **Environment Format Validation (`solace-ai/scripts/validate_env.mjs`):** Passed (0 credentials exposed).
- **Notification Verification Suite (`solace-ai/scripts/test_notifications.mjs`):** 17 / 17 tests passed.
- **Phase 7.5 Verification Suite (`solace-ai/scripts/test_phase7_5.mjs`):** 12 / 12 tests passed.
- **Sky & Rose Verification Suite (`solace-ai/scripts/test_sky_rose.mjs`):** 56 / 56 checks passed.
- **TypeScript:** `npx tsc --noEmit` passed with 0 errors.
- **Automated Verification Suites:** 109 / 109 automated tests passing across 5 test suites:
  - `test_solace_chat_function.mjs` (10/10 checks)
  - `test_phase8.mjs` (12/12 checks)
  - `test_notifications.mjs` (17/17 checks)
  - `test_sky_rose.mjs` (56/56 checks)
  - `test_phase7_5.mjs` (14/14 checks)
- **Expo Doctor:** `20 / 20 checks passed. No issues detected!`
- **Android Production Bundling:** `npx expo export --platform android --no-bytecode` bundled 1,819 modules with 0 errors.

---

## 27. Phase 8 & Real AI Companion (Supabase Edge Function & Gemini Flash)

### Edge Function Architecture
- **Function Name:** `solace-ai-chat`
- **Location:** `supabase/functions/solace-ai-chat/index.ts`
- **Runtime:** Deno (Supabase Edge Functions)
- **AI Model:** Google Gemini Flash (`gemini-1.5-flash` / `gemini-2.0-flash`) via `generativelanguage.googleapis.com`
- **Secret Management:** Reads `GEMINI_API_KEY` strictly from `Deno.env.get("GEMINI_API_KEY")`. The key is never exposed to the client application or bundled in the Expo binary.
- **Caller Verification:** Verifies caller authorization using `supabaseClient.auth.getUser()`. Returns HTTP 401 if unauthorized or if session token is expired.
- **Database Persistence:**
  - Auto-resolves or creates active conversation records in `public.conversations` with UUID primary keys.
  - Automatically records both the user message (`sender: 'user'`) and the assistant's reply (`sender: 'assistant'`) in `public.chat_messages`.
  - Updates `last_message_text` and `updated_at` in `public.conversations`.
- **Crisis Safety Heuristic:** Evaluates user input against crisis patterns (e.g. self-harm, suicidal ideation) before calling the AI model. Immediately returns compassionate referral text and national crisis hotlines (988 Lifeline, Shout, international crisis directory) without sending crisis prompts to LLM.
- **Client Service Integration:** `src/services/aiCompanionService.ts` calls `supabase.functions.invoke('solace-ai-chat', { body: { message, conversationId, history } })`. Automatically passes active session token in the authorization header.
- **Graceful Fallback:** If unauthenticated, offline, or if the edge function returns an error, `aiCompanionService` seamlessly transitions to local empathetic mindfulness reflections, ensuring zero UI crashes.
- **UI Integration:** `src/app/(tabs)/companion.tsx` passes active conversation ID and recent message history to `aiCompanionService.generateReply()`.

---

## 28. Completed Milestones
- [x] Phase 1: Project setup & theme foundation.
- [x] Phase 2: Navigation & reusable UI components.
- [x] Phase 3: Splash screen & 3-step onboarding.
- [x] Phase 4: Local demonstration authentication & session persistence.
- [x] Phase 5: Home dashboard & mood check-in persistence.
- [x] Phase 6: AI companion chat interface & local chat history.
- [x] Phase 7: Guided breathing engine & session persistence.
- [x] Phase 7.5: UX polish, keyboard handling, and theme preferences.
- [x] Sky & Rose Design System: Complete visual rebranding (Light & Dark parity across all 14 screens).
- [x] Phase 7.6–7.8: Local Notifications and Reminders System.
- [x] Phase 8: Supabase Cloud Backend Integration (Schema, RLS, Client, Sync Services, Auth Hybrid).
- [x] Phase 8 Real AI Companion: Supabase Edge Function (`solace-ai-chat`) + Google Gemini Flash integration.
- [x] Phase 8.5 Real Google OAuth: Supabase Auth (`signInWithOAuth`), deep link handling (`solaceai://auth/callback`), and PKCE/session persistence.

---

## 29. Deployment Instructions for Edge Function & Database
1. **Execute Schema SQL:**
   Open Supabase Dashboard -> **SQL Editor** -> paste and run `solace-ai/supabase/schema.sql`.
2. **Deploy Edge Function:**
   In terminal:
   ```bash
   npx supabase functions deploy solace-ai-chat
   ```
3. **Verify Edge Function Secret:**
   Confirm secret `GEMINI_API_KEY` is present in Supabase Dashboard under **Project Settings -> Edge Functions -> Secrets**, or run:
   ```bash
   npx supabase secrets set GEMINI_API_KEY=your_key_here
   ```
4. **Test in Mobile App:**
   Open the Solace AI Companion tab, send a reflection prompt, and verify that Gemini Flash generates a comforting response while both user and assistant messages are stored in `conversations` and `chat_messages`.

---

## 30. Google OAuth Configuration Guide (Supabase + Google Cloud Console)

### Step 1: Google Cloud Console
1. Navigate to [Google Cloud Console](https://console.cloud.google.com/) -> **APIs & Services** -> **Credentials**.
2. Click **Create Credentials** -> **OAuth client ID**.
3. Select Application type: **Web application** *(Note: Select Web Application because Supabase backend handles the OAuth exchange on its servers).*
4. Set Name: `Solace AI Supabase Auth`.
5. Under **Authorized JavaScript origins**, add:
   `https://<your-project-ref>.supabase.co`
6. Under **Authorized redirect URIs**, add:
   `https://<your-project-ref>.supabase.co/auth/v1/callback`
7. Click **Create** and copy your **Client ID** and **Client Secret**.

### Step 2: Supabase Project Dashboard
1. Open your [Supabase Dashboard](https://supabase.com/dashboard) and navigate to **Authentication** -> **Providers** -> **Google**.
2. Toggle **Enable Sign in with Google** to **ON**.
3. Paste the **Client ID** and **Client Secret** obtained from Google Cloud Console.
4. Click **Save**.
5. Navigate to **Authentication** -> **URL Configuration**:
   - **Site URL:** `solaceai://auth/callback` (or your production/development scheme)
   - **Redirect URLs:** Add the following entries to ensure both Expo Go development and Standalone APK builds are permitted by GoTrue:
     - `solaceai://auth/callback`
     - `solaceai://**`
     - `exp://**`
     - `exp://*`
     - `exp://192.168.*:*/**` (covers local Wi-Fi development on Expo Go)
     - `exp://localhost:*/**` (covers local emulator testing)
     - `exp://10.0.2.2:*/**` (covers standard Android emulator)
     - `https://*.exp.direct/**` (required if running `npx expo start --tunnel`)
6. Click **Save**.

### Step 3: Test on Android
1. Open the Solace AI app and navigate to **Sign In** or **Create Account**.
2. Tap **Continue with Google**.
3. The secure in-app browser will open Google's account picker.
4. Upon authentication, you will be redirected to `solaceai://auth/callback`, which exchanges the session, stores it securely, and navigates into your sanctuary home.

### Step 4: Google Profile Data Extraction & Verification
- **Full Name:** Extracted from `session.user.user_metadata.full_name`, `name`, `given_name + family_name`, or `user_name` with graceful email prefix fallback.
- **Profile Picture:** Extracted from `session.user.user_metadata.avatar_url` or `picture` and rendered with rounded circular avatar in Home and Profile tabs with gentle botanical emoji (`🌿`) fallback.
- **Email:** Stored in `User`, `AuthSession`, and synchronized to `public.profiles`.
- **Database Synchronization:** Populates the `public.profiles` PostgreSQL table immediately via client-side upsert on session construction and server-side via the updated `handle_new_user()` trigger.
- **UI Personalization:**
  - Home tab: Welcomes the user with their real first name (e.g. `Morning Sanctuary, Jay`) instead of generic placeholders.
  - Profile tab: Displays user's full name, email, Google avatar image, and live `Cloud Sanctuary Traveler` status pill.
- **Email/Password Preservation:** Traditional email/password sign-up and sign-in paths remain completely preserved with identical security standards and offline fallback.

---

## 31. Important Development Rules
1. Never guess design values when `solace-design-reference/solace_sanctuary/DESIGN.md` defines them.
2. Every button, input, and timer must be functional.
3. Test every component on Android with Expo Go before concluding milestones.
4. Maintain `PROJECT_CONTEXT.md` as work progresses.
5. All primary action buttons must observe the dark mode contrast rule (`onPrimary: '#283541'` in dark mode, `#FFFFFF` in light mode).
6. Local notifications must remain 100% offline and never store or expose private user thoughts or mood logs.
7. Never request, print, or commit Supabase service-role keys, anon keys, or project URLs. All credentials must remain strictly in local `.env`.
8. Never expose the `GEMINI_API_KEY` to client-side code; it must remain exclusively in Supabase Edge Function Secrets.
9. Never bundle Google Client Secrets, service-role keys, or private certificates in client APKs. Google OAuth credentials must reside strictly on Supabase Auth servers.

