# AGENTS.md — AI Coding Assistant Guidelines for Solace AI

This document establishes persistent instructions and non-negotiable standards for all AI coding assistants operating within the `solace-ai` repository.

---

## 1. Context & Architecture Awareness
- **Always read `PROJECT_CONTEXT.md` before making any changes.** It serves as the single source of truth for architectural decisions, completed stages, and pending tasks.
- **Follow the approved Google Stitch designs.** Refer directly to the design tokens and structure documented in `PROJECT_CONTEXT.md` and the reference export at `../solace-design-reference/`.
- **Preserve visual identity and navigation.** Do not alter the established color palette, typography hierarchy, or bottom navigation system without explicit user instruction.
- **Update `PROJECT_CONTEXT.md`:** Document significant architectural decisions, completed stages, and any shift in status (e.g. from *Proposed* to *Confirmed*) immediately after completing tasks.

---

## 2. Technology & Code Conventions
- **React Native & Expo conventions:** Never use web HTML tags (`<div>`, `<span>`, `<p>`) or browser CSS. Use core React Native primitives (`View`, `Text`, `Pressable`, `ScrollView`, `TextInput`) and Expo ecosystem modules.
- **Expo Router:** Routes reside in `src/app/`. Keep business logic, hooks, state, types, and UI components in `src/components/`, `src/hooks/`, `src/constants/`, and `src/services/`.
- **TypeScript:** Strict typing is mandatory. Avoid `any`. Define clear interfaces for state, props, data entities, and service responses.
- **Expo Version Integrity:**
  - Always install packages with `npx expo install <package>` to resolve SDK-compatible versions.
  - Run type checking (`npx tsc --noEmit`) and linting before marking any coding task complete.
  - Test and verify on Android via Expo Go whenever possible.

---

## 3. Safe Development & Code Integrity
- **Do not replace existing working code without inspecting it first.**
- **Do not blindly delete files or refactor working modules.**
- **Do not install packages or dependencies without explaining why they are needed.**
- **Beginner-friendly & Maintainable:** Keep code clean, well-commented, modular, and readable with sensible naming conventions.

---

## 4. Functional Realism & Data Honesty
- **Implement real functionality rather than decorative or fake interactions.**
  - Breathing exercises must have real, working timers with pause/resume logic.
  - Mood check-ins must persist actual data that feeds into the insights engine.
  - Forms, toggles, filters, and chat search must execute actual functional operations.
- **Zero Hallucinated Capabilities:**
  - Never invent or claim "military-grade encryption", "cloud sync", or "backend authentication" unless real code and infrastructure have been implemented and verified.
  - Clearly distinguish between local device mock storage, local SQLite/AsyncStorage, and cloud backends.
  - Never expose API keys or secrets in client-side code. Use environment variables and secure storage.
