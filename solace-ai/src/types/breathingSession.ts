/**
 * Solace AI - Breathing Session Persistence Types
 * Phase 7.5: Breathing Exercise Integration Across Solace
 */

export interface BreathingSession {
  id: string;
  userId: string;
  patternId: string;
  patternName: string;
  inhale?: number;
  holdIn?: number;
  exhale?: number;
  holdOut?: number;
  targetDurationMinutes?: number;
  sessionDurationMinutes?: number;
  completedDurationSeconds: number;
  completedCycles: number;
  completedAt: string; // ISO 8601 string
  isCompleted: boolean;
}

export interface BreathingStats {
  totalSessions: number;
  totalSessionsCompleted: number;
  totalDurationSeconds: number;
  totalDurationMinutes: number;
  totalMinutesBreathed: number;
  totalCycles: number;
  lastSession: BreathingSession | null;
  recentSessions: BreathingSession[];
}
