import AsyncStorage from '@react-native-async-storage/async-storage';

const storage = (AsyncStorage as any)?.default ?? AsyncStorage;

const ONBOARDING_STORAGE_KEY = '@solace_has_completed_onboarding';

export interface OnboardingState {
  isCompleted: boolean;
  completedAt?: string;
}

export const onboardingStorage = {
  /**
   * Check whether the user has completed the onboarding flow.
   * Returns false if key is not found or reading fails.
   */
  async hasCompletedOnboarding(): Promise<boolean> {
    try {
      const value = await storage.getItem(ONBOARDING_STORAGE_KEY);
      return value === 'true';
    } catch (error) {
      console.warn('[onboardingStorage] Failed to read onboarding status:', error);
      return false;
    }
  },

  /**
   * Mark onboarding as completed.
   */
  async setOnboardingCompleted(): Promise<void> {
    try {
      await storage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    } catch (error) {
      console.warn('[onboardingStorage] Failed to save onboarding status:', error);
    }
  },

  /**
   * Reset onboarding status (for testing, reset data in settings, etc.).
   */
  async resetOnboardingStatus(): Promise<void> {
    try {
      await storage.removeItem(ONBOARDING_STORAGE_KEY);
    } catch (error) {
      console.warn('[onboardingStorage] Failed to reset onboarding status:', error);
    }
  },
};

