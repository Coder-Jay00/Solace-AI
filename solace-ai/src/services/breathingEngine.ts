/**
 * Solace AI - Breathing Engine & Pattern Logic
 * Phase 7: Guided Breathing Exercise & Custom Studio
 *
 * Encapsulates timing calculations, phase sequencing, validation,
 * and zero-duration phase skipping.
 */

import {
  BreathingPattern,
  ActivePhaseInfo,
  BreathingPresetId,
  BREATHING_PRESETS,
} from '@/types/breathing';

export const breathingEngine = {
  /**
   * Return the list of active phases for a pattern.
   * If a hold duration is 0, that phase is cleanly skipped.
   */
  getPhasesForPattern(pattern: BreathingPattern): ActivePhaseInfo[] {
    const phases: ActivePhaseInfo[] = [];

    // 1. Inhale (Mandatory, 1-15s)
    if (pattern.inhale > 0) {
      phases.push({
        type: 'inhale',
        label: 'Inhale slowly',
        shortLabel: 'Inhale',
        durationSeconds: pattern.inhale,
        scaleTarget: 1.15,
      });
    }

    // 2. Hold after Inhale (Optional, 0-15s)
    if (pattern.holdIn > 0) {
      phases.push({
        type: 'holdIn',
        label: 'Hold gently',
        shortLabel: 'Hold',
        durationSeconds: pattern.holdIn,
        scaleTarget: 1.15,
      });
    }

    // 3. Exhale (Mandatory, 1-20s)
    if (pattern.exhale > 0) {
      phases.push({
        type: 'exhale',
        label: 'Exhale release',
        shortLabel: 'Exhale',
        durationSeconds: pattern.exhale,
        scaleTarget: 0.88,
      });
    }

    // 4. Hold after Exhale (Optional, 0-15s)
    if (pattern.holdOut > 0) {
      phases.push({
        type: 'holdOut',
        label: 'Hold stillness',
        shortLabel: 'Hold',
        durationSeconds: pattern.holdOut,
        scaleTarget: 0.88,
      });
    }

    return phases;
  },

  /**
   * Calculate total duration in seconds for one complete cycle.
   */
  getCycleDuration(pattern: BreathingPattern): number {
    return pattern.inhale + pattern.holdIn + pattern.exhale + pattern.holdOut;
  },

  /**
   * Validate a custom pattern configuration to ensure physiological safety:
   * - No hyperventilation / zero-duration cycles
   * - Inhale: 1-15s
   * - Hold In: 0-15s
   * - Exhale: 1-20s
   * - Hold Out: 0-15s
   */
  validatePattern(pattern: Partial<BreathingPattern>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    const inhale = pattern.inhale ?? 0;
    const holdIn = pattern.holdIn ?? 0;
    const exhale = pattern.exhale ?? 0;
    const holdOut = pattern.holdOut ?? 0;

    if (inhale < 1 || inhale > 15) {
      errors.push('Inhale duration must be between 1 and 15 seconds.');
    }
    if (holdIn < 0 || holdIn > 15) {
      errors.push('Hold after inhale must be between 0 and 15 seconds.');
    }
    if (exhale < 1 || exhale > 20) {
      errors.push('Exhale duration must be between 1 and 20 seconds.');
    }
    if (holdOut < 0 || holdOut > 15) {
      errors.push('Hold after exhale must be between 0 and 15 seconds.');
    }

    const total = inhale + holdIn + exhale + holdOut;
    if (total < 2) {
      errors.push('Total cycle duration must be at least 2 seconds.');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * Retrieve a preset by ID.
   */
  getPresetById(id: BreathingPresetId): BreathingPattern {
    const found = BREATHING_PRESETS.find((p) => p.id === id);
    return found ? { ...found } : { ...BREATHING_PRESETS[0] };
  },

  /**
   * Compute expected cycle count for a given session minutes and pattern.
   */
  getEstimatedCycles(pattern: BreathingPattern, sessionMinutes: number): number {
    const cycleSecs = this.getCycleDuration(pattern);
    if (cycleSecs <= 0) return 0;
    return Math.floor((sessionMinutes * 60) / cycleSecs);
  },

  /**
   * Format seconds to mm:ss display string.
   */
  formatTime(seconds: number): string {
    const m = Math.floor(Math.max(0, seconds) / 60);
    const s = Math.floor(Math.max(0, seconds) % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  },
};

