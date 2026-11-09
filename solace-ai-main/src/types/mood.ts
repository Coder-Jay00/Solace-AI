/**
 * Solace AI - Mood Check-In Type Definitions
 * Phase 5: Home Dashboard & Mood Check-in
 */

export type MoodType = 'happy' | 'calm' | 'neutral' | 'sad' | 'anxious';

export interface MoodOption {
  type: MoodType;
  label: string;
  descriptor: string;
  emoji: string;
  defaultNuances: string[];
}

export const MOOD_OPTIONS: MoodOption[] = [
  {
    type: 'happy',
    label: 'Radiant',
    descriptor: 'Happy',
    emoji: '☀️',
    defaultNuances: ['Joyful', 'Grateful', 'Energized', 'Inspired', 'Open-hearted'],
  },
  {
    type: 'calm',
    label: 'Calm',
    descriptor: 'Calm',
    emoji: '🌿',
    defaultNuances: ['Grounded', 'Content', 'Serene', 'Reflective', 'Peaceful'],
  },
  {
    type: 'neutral',
    label: 'Neutral',
    descriptor: 'Neutral',
    emoji: '🌾',
    defaultNuances: ['Observant', 'Balanced', 'Steady', 'Quiet', 'Present'],
  },
  {
    type: 'sad',
    label: 'Heavy',
    descriptor: 'Sad',
    emoji: '💧',
    defaultNuances: ['Tender', 'Vulnerable', 'Exhausted', 'Sorrowful', 'Needing Rest'],
  },
  {
    type: 'anxious',
    label: 'Flutter',
    descriptor: 'Anxious',
    emoji: '🌬️',
    defaultNuances: ['Restless', 'Overwhelmed', 'Unsettled', 'Racing Mind', 'Tense'],
  },
];

export interface IntensityLevel {
  level: number;
  label: string;
  shortDesc: string;
}

export const INTENSITY_LEVELS: IntensityLevel[] = [
  { level: 1, label: '1 • Gentle whisper', shortDesc: 'Gentle whisper' },
  { level: 2, label: '2 • Subtle presence', shortDesc: 'Subtle presence' },
  { level: 3, label: '3 • Noticeable wave', shortDesc: 'Noticeable wave' },
  { level: 4, label: '4 • Distinct & Clear', shortDesc: 'Distinct & Clear' },
  { level: 5, label: '5 • Deep & Profound', shortDesc: 'Deep & Profound' },
];

export const CONTEXT_TAG_SUGGESTIONS: string[] = [
  '#Morning',
  '#Rest',
  '#Work',
  '#Gratitude',
  '#Relationships',
  '#Nature',
  '#Health',
  '#Creativity',
];

export interface MoodEntry {
  id: string;
  userId: string;
  mood: MoodType;
  moodLabel: string;
  emoji: string;
  energyLevel: number; // 1 to 5
  energyLabel?: string;
  nuanceTags: string[];
  contextTags: string[];
  note?: string;
  createdAt: string; // ISO 8601 string
}

export interface DayActivity {
  dayLetter: string; // 'M', 'T', 'W', 'T', 'F', 'S', 'S'
  dayName: string;
  dateString: string; // 'YYYY-MM-DD'
  isToday: boolean;
  hasEntry: boolean;
  entryCount: number;
  primaryMood?: MoodType;
  primaryEmoji?: string;
}

export interface WellnessJourneySummary {
  streakDays: number;
  currentStreak?: number;
  totalEntries: number;
  predominantMood?: string;
  dominantMood?: string;
  predominantEmoji?: string;
  weekTimeline: DayActivity[];
}

