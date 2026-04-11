import { UNLOCK_CONDITIONS } from '@/constants/revealModes';
import { getDailyLogByDate } from '@/db/queries/dailyLogs';
import {
  getUserProfile,
  listWallpapers,
  upsertUserProfile,
} from '@/db/queries/streaks';
import { sharedStorage, STORAGE_KEYS } from '@/native/SharedStorage';
import { useUserStore } from '@/stores/userStore';
import { useWallpaperStore } from '@/stores/wallpaperStore';
import type { UserProfile } from '@/types/gamification.types';
import type { Result } from '@/types/result.types';
import { err, ok } from '@/types/result.types';

export interface StreakServiceError {
  code: 'DB_ERROR' | 'STATE_ERROR' | 'UNKNOWN_ERROR';
  message: string;
  cause?: unknown;
}

const USER_PROFILE_SINGLETON_ID = 'singleton';

const DEFAULT_PROFILE: UserProfile = {
  id: USER_PROFILE_SINGLETON_ID,
  streakCount: 0,
  longestStreak: 0,
  lastFullCompletionDate: null,
  unlockedWallpaperIds: [],
  preferredRevealMode: 'radial',
  soundEnabled: true,
  hapticEnabled: true,
};

const toLocalDateKey = (date: Date): string => date.toLocaleDateString();

const parseLocalDate = (value: string): Date => {
  const [year, month, day] = value.split('-').map((part) => Number(part));
  return new Date(year, month - 1, day, 12, 0, 0, 0);
};

const formatLocalIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDaysLocal = (date: Date, amount: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const isConsecutiveLocalDay = (previousDateIso: string | null, currentDateIso: string): boolean => {
  if (!previousDateIso) {
    return true;
  }

  const previousDate = parseLocalDate(previousDateIso);
  const expectedPreviousDate = addDaysLocal(parseLocalDate(currentDateIso), -1);
  return toLocalDateKey(previousDate) === toLocalDateKey(expectedPreviousDate);
};

const persistProfile = async (profile: UserProfile): Promise<void> => {
  await upsertUserProfile(profile);
  useUserStore.setState({ userProfile: profile });
  sharedStorage.set(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  sharedStorage.set(STORAGE_KEYS.STREAK_COUNT, String(profile.streakCount));
};

const loadProfile = async (): Promise<UserProfile> => {
  const profileFromStore = useUserStore.getState().userProfile;
  if (profileFromStore) {
    return profileFromStore;
  }

  const profileFromDb = await getUserProfile();
  if (profileFromDb) {
    return profileFromDb;
  }

  await persistProfile(DEFAULT_PROFILE);
  return DEFAULT_PROFILE;
};

export const StreakService = {
  async evaluate(referenceDate: Date = new Date()): Promise<Result<UserProfile, StreakServiceError>> {
    try {
      const profile = await loadProfile();
      const yesterdayDate = addDaysLocal(referenceDate, -1);
      const yesterdayIso = formatLocalIsoDate(yesterdayDate);
      const yesterdayLog = await getDailyLogByDate(yesterdayIso);

      if (!yesterdayLog) {
        return ok(profile);
      }

      const nextProfile: UserProfile = { ...profile };

      if (yesterdayLog.completionPct < 100) {
        nextProfile.streakCount = 0;
      } else {
        if (profile.lastFullCompletionDate === yesterdayIso) {
          return ok(profile);
        }

        const shouldIncrement = isConsecutiveLocalDay(profile.lastFullCompletionDate, yesterdayIso);
        nextProfile.streakCount = shouldIncrement ? profile.streakCount + 1 : 1;
        nextProfile.lastFullCompletionDate = yesterdayIso;
      }

      nextProfile.longestStreak = Math.max(nextProfile.longestStreak, nextProfile.streakCount);

      await persistProfile(nextProfile);
      return ok(nextProfile);
    } catch (cause) {
      return err({
        code: 'UNKNOWN_ERROR',
        message: 'Failed to evaluate streak state.',
        cause,
      });
    }
  },

  async checkUnlocks(): Promise<Result<string[], StreakServiceError>> {
    try {
      const profile = await loadProfile();
      const allWallpapers = await listWallpapers();
      const newlyUnlockedIds: string[] = [];

      for (const wallpaper of allWallpapers) {
        if (wallpaper.isUnlocked || !wallpaper.unlockCondition) {
          continue;
        }

        const condition = UNLOCK_CONDITIONS[wallpaper.unlockCondition];
        if (!condition || !condition(profile)) {
          continue;
        }

        useWallpaperStore.getState().unlock(wallpaper.id);
        newlyUnlockedIds.push(wallpaper.id);
      }

      if (newlyUnlockedIds.length > 0) {
        useWallpaperStore.setState((state) => {
          const updatedWallpapers = state.wallpapers.map((wallpaper) =>
            newlyUnlockedIds.includes(wallpaper.id) ? { ...wallpaper, isUnlocked: true } : wallpaper,
          );

          return {
            wallpapers: updatedWallpapers,
            activeWallpaper: state.activeWallpaper
              ? updatedWallpapers.find((wallpaper) => wallpaper.id === state.activeWallpaper?.id) ?? state.activeWallpaper
              : updatedWallpapers.find((wallpaper) => wallpaper.isUnlocked) ?? updatedWallpapers[0] ?? null,
          };
        });

        const mergedUnlockedIds = Array.from(new Set([...profile.unlockedWallpaperIds, ...newlyUnlockedIds]));
        const nextProfile: UserProfile = {
          ...profile,
          unlockedWallpaperIds: mergedUnlockedIds,
        };
        await persistProfile(nextProfile);
      }

      return ok(newlyUnlockedIds);
    } catch (cause) {
      return err({
        code: 'UNKNOWN_ERROR',
        message: 'Failed to evaluate wallpaper unlock conditions.',
        cause,
      });
    }
  },
};

export const __streakInternals = {
  addDaysLocal,
  formatLocalIsoDate,
  isConsecutiveLocalDay,
  parseLocalDate,
  toLocalDateKey,
};
