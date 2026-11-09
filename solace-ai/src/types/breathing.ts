/**
 * Solace AI - Breathing Studio Type Definitions
 * Phase 7: Guided Breathing Exercise & Custom Studio
 */

export type BreathingPhaseType = 'inhale' | 'holdIn' | 'exhale' | 'holdOut';

export interface ActivePhaseInfo {
  type: BreathingPhaseType;
  label: string;
  shortLabel: string;
  durationSeconds: number;
  scaleTarget: number; // 1.15 for inhale/holdIn, 0.88 for exhale/holdOut
}

export type BreathingPresetId =
  | 'box-breathing'
  | 'gentle-exhale'
  | 'extended-exhale'
  | '4-7-8'
  | 'short-rhythm'
  | 'custom';

export interface BreathingPattern {
  id: BreathingPresetId;
  name: string;
  tagline: string;
  description: string;
  inhale: number; // 1 to 15s
  holdIn: number; // 0 to 15s (0 skips phase)
  exhale: number; // 1 to 20s
  holdOut: number; // 0 to 15s (0 skips phase)
}

export const BREATHING_PRESETS: BreathingPattern[] = [
  {
    id: 'box-breathing',
    name: 'Box Breathing',
    tagline: '4-4-4-4 Grounding Cadence',
    description: 'Equal intervals of inhale, hold, exhale, and hold to steady nervous system tone and quiet racing thoughts.',
    inhale: 4,
    holdIn: 4,
    exhale: 4,
    holdOut: 4,
  },
  {
    id: 'gentle-exhale',
    name: 'Gentle Long Exhale',
    tagline: '4-6 Soothing Release',
    description: 'Lengthening the out-breath activates the vagus nerve and encourages effortless muscle relaxation.',
    inhale: 4,
    holdIn: 0,
    exhale: 6,
    holdOut: 0,
  },
  {
    id: 'extended-exhale',
    name: 'Extended Exhale',
    tagline: '4-8 Deep Relaxation',
    description: 'A 1:2 ratio that gently slows the pulse and releases accumulated physical tension.',
    inhale: 4,
    holdIn: 0,
    exhale: 8,
    holdOut: 0,
  },
  {
    id: '4-7-8',
    name: '4-7-8 Breathing',
    tagline: '4-7-8 Restorative Rest',
    description: 'Time-tested relaxation practice to quiet the mind before evening rest.',
    inhale: 4,
    holdIn: 7,
    exhale: 8,
    holdOut: 0,
  },
  {
    id: 'short-rhythm',
    name: 'Short Rhythm',
    tagline: '2-2 Light Pacing',
    description: 'Light, unforced rhythm for moments when deeper breath cycles feel strenuous or heavy.',
    inhale: 2,
    holdIn: 0,
    exhale: 2,
    holdOut: 0,
  },
  {
    id: 'custom',
    name: 'Custom Studio',
    tagline: 'Personalized Cadence',
    description: 'Configure your own comfortable rhythm for inhale, holds, and exhale.',
    inhale: 4,
    holdIn: 2,
    exhale: 6,
    holdOut: 2,
  },
];

export interface BreathingSessionConfig {
  pattern: BreathingPattern;
  sessionMinutes: number; // 1, 2, 3, 5, 10, 15, 20
  targetCycles?: number;
  soundCueEnabled: boolean;
  hapticCueEnabled: boolean;
}

export interface BreathingSessionStats {
  patternName: string;
  totalDurationSeconds: number;
  completedCycles: number;
  completedAt: string;
}

