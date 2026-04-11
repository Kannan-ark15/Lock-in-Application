import { StreakService } from '@/services/StreakService';
import { useUserStore } from '@/stores/userStore';
import { useWallpaperStore } from '@/stores/wallpaperStore';

import { getDailyLogByDate } from '@/db/queries/dailyLogs';
import { getUserProfile, listWallpapers, upsertUserProfile } from '@/db/queries/streaks';
import { sharedStorage } from '@/native/SharedStorage';
import type { DailyLog, UserProfile } from '@/types/gamification.types';

jest.mock('@/db/queries/dailyLogs', () => ({
  getDailyLogByDate: jest.fn(),
}));

jest.mock('@/db/queries/streaks', () => ({
  getUserProfile: jest.fn(),
  listWallpapers: jest.fn(),
  upsertUserProfile: jest.fn(),
}));

jest.mock('@/native/SharedStorage', () => ({
  STORAGE_KEYS: {
    TODAY_STATE: 'today_state',
    STREAK_COUNT: 'streak_count',
    USER_PROFILE: 'user_profile',
    ACTIVE_TASKS: 'active_tasks',
  },
  sharedStorage: {
    set: jest.fn(),
  },
}));

const mockedGetDailyLogByDate = getDailyLogByDate as jest.MockedFunction<typeof getDailyLogByDate>;
const mockedGetUserProfile = getUserProfile as jest.MockedFunction<typeof getUserProfile>;
const mockedListWallpapers = listWallpapers as jest.MockedFunction<typeof listWallpapers>;
const mockedUpsertUserProfile = upsertUserProfile as jest.MockedFunction<typeof upsertUserProfile>;
const mockedSharedStorageSet = sharedStorage.set as jest.MockedFunction<typeof sharedStorage.set>;

const createLog = (date: string, completionPct: number): DailyLog => ({
  id: `${date}-id`,
  date,
  taskIds: ['task-1'],
  completedTaskIds: completionPct === 100 ? ['task-1'] : [],
  completionPct,
  wallpaperId: 'wallpaper-1',
  renderedWallpaperUri: null,
  createdAt: '2026-01-01T00:00:00.000Z',
});

const createProfile = (patch: Partial<UserProfile> = {}): UserProfile => ({
  id: 'singleton',
  streakCount: 0,
  longestStreak: 0,
  lastFullCompletionDate: null,
  unlockedWallpaperIds: [],
  preferredRevealMode: 'radial',
  soundEnabled: true,
  hapticEnabled: true,
  ...patch,
});

describe('StreakService.evaluate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useUserStore.setState({ userProfile: null });
    useWallpaperStore.setState({
      wallpapers: [],
      activeWallpaper: null,
      unlock: jest.fn(),
    });
    mockedListWallpapers.mockResolvedValue([]);
  });

  it('handles first day full completion', async () => {
    const referenceDate = new Date(2026, 0, 2, 8, 0, 0);
    mockedGetUserProfile.mockResolvedValue(createProfile());
    mockedGetDailyLogByDate.mockResolvedValue(createLog('2026-01-01', 100));

    const result = await StreakService.evaluate(referenceDate);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.data.streakCount).toBe(1);
    expect(result.data.longestStreak).toBe(1);
    expect(result.data.lastFullCompletionDate).toBe('2026-01-01');
    expect(mockedUpsertUserProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        streakCount: 1,
        longestStreak: 1,
        lastFullCompletionDate: '2026-01-01',
      }),
    );
  });

  it('increments streak on consecutive full-completion days', async () => {
    const referenceDate = new Date(2026, 0, 3, 9, 0, 0);
    mockedGetUserProfile.mockResolvedValue(
      createProfile({
        streakCount: 2,
        longestStreak: 2,
        lastFullCompletionDate: '2026-01-01',
      }),
    );
    mockedGetDailyLogByDate.mockResolvedValue(createLog('2026-01-02', 100));

    const result = await StreakService.evaluate(referenceDate);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.data.streakCount).toBe(3);
    expect(result.data.longestStreak).toBe(3);
    expect(result.data.lastFullCompletionDate).toBe('2026-01-02');
    expect(mockedSharedStorageSet).toHaveBeenCalledWith('streak_count', '3');
  });

  it('resets streak to zero when yesterday was incomplete', async () => {
    const referenceDate = new Date(2026, 0, 4, 8, 0, 0);
    mockedGetUserProfile.mockResolvedValue(
      createProfile({
        streakCount: 5,
        longestStreak: 7,
        lastFullCompletionDate: '2026-01-02',
      }),
    );
    mockedGetDailyLogByDate.mockResolvedValue(createLog('2026-01-03', 75));

    const result = await StreakService.evaluate(referenceDate);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.data.streakCount).toBe(0);
    expect(result.data.longestStreak).toBe(7);
  });

  it('uses local calendar rollover correctly at year boundary', async () => {
    const referenceDate = new Date(2026, 0, 1, 0, 5, 0);
    mockedGetUserProfile.mockResolvedValue(
      createProfile({
        streakCount: 2,
        longestStreak: 2,
        lastFullCompletionDate: '2025-12-30',
      }),
    );
    mockedGetDailyLogByDate.mockResolvedValue(createLog('2025-12-31', 100));

    const result = await StreakService.evaluate(referenceDate);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(mockedGetDailyLogByDate).toHaveBeenCalledWith('2025-12-31');
    expect(result.data.streakCount).toBe(3);
    expect(result.data.lastFullCompletionDate).toBe('2025-12-31');
  });
});
