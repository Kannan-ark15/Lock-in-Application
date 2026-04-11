import { create } from 'zustand';

import {
  getUserProfile as getUserProfileQuery,
  upsertUserProfile,
  updateUserProfile as updateUserProfileQuery,
} from '@/db/queries/streaks';
import { sharedStorage, STORAGE_KEYS } from '@/native/SharedStorage';
import type { UserProfile } from '@/types/gamification.types';

export interface UserStore {
  userProfile: UserProfile | null;
  updateProfile: (patch: Partial<UserProfile>) => void;
  updateRevealMode: (mode: UserProfile['preferredRevealMode']) => void;
  updateSoundEnabled: (enabled: boolean) => void;
  updateHapticEnabled: (enabled: boolean) => void;
}

const DEFAULT_PROFILE: UserProfile = {
  id: 'singleton',
  streakCount: 0,
  longestStreak: 0,
  lastFullCompletionDate: null,
  unlockedWallpaperIds: [],
  preferredRevealMode: 'radial',
  soundEnabled: true,
  hapticEnabled: true,
};

const persistProfileToMMKV = (profile: UserProfile): void => {
  sharedStorage.set(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  sharedStorage.set(STORAGE_KEYS.STREAK_COUNT, String(profile.streakCount));
};

export const useUserStore = create<UserStore>((set, get) => ({
  userProfile: null,
  updateProfile: (patch) => {
    const previousProfile = get().userProfile;
    const baseProfile = previousProfile ?? DEFAULT_PROFILE;
    const { id: _ignoredId, ...safePatch } = patch;
    const nextProfile: UserProfile = { ...baseProfile, ...safePatch };

    set({ userProfile: nextProfile });
    persistProfileToMMKV(nextProfile);

    void updateUserProfileQuery(safePatch).catch(() => {
      set({ userProfile: previousProfile });
      if (previousProfile) {
        persistProfileToMMKV(previousProfile);
      }
    });
  },
  updateRevealMode: (mode) => {
    get().updateProfile({ preferredRevealMode: mode });
  },
  updateSoundEnabled: (enabled) => {
    get().updateProfile({ soundEnabled: enabled });
  },
  updateHapticEnabled: (enabled) => {
    get().updateProfile({ hapticEnabled: enabled });
  },
}));

const hydrateUserStore = async (): Promise<void> => {
  try {
    const persistedProfile = await getUserProfileQuery();
    const profile = persistedProfile ?? DEFAULT_PROFILE;

    if (!persistedProfile) {
      await upsertUserProfile(profile);
    }

    useUserStore.setState({ userProfile: profile });
    persistProfileToMMKV(profile);
  } catch {
    // Store stays with default in-memory state if hydration fails.
  }
};

void hydrateUserStore();
