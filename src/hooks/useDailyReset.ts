import { useEffect } from 'react';
import { AppState } from 'react-native';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

import { getDailyLogByDate, updateDailyLog, upsertDailyLog } from '@/db/queries/dailyLogs';
import { listWallpapers } from '@/db/queries/streaks';
import { listActiveTasks } from '@/db/queries/tasks';
import { sharedStorage, STORAGE_KEYS } from '@/native/SharedStorage';
import { StreakService } from '@/services/StreakService';
import type { Result } from '@/types/result.types';
import { err, ok } from '@/types/result.types';
import type { DailyLog } from '@/types/gamification.types';

export const LOCKIN_DAILY_RESET_TASK = 'LOCKIN_DAILY_RESET';

interface DailyResetError {
  code: 'RESET_FAILED' | 'TASK_REGISTRATION_FAILED' | 'UNKNOWN_ERROR';
  message: string;
  cause?: unknown;
}

interface DailyResetRunResult {
  didReset: boolean;
  todayLog: DailyLog | null;
}

const generateId = (): string => {
  const randomUUID = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto?.randomUUID;
  if (randomUUID) {
    return randomUUID();
  }

  const rand = Math.random().toString(16).slice(2, 10);
  return `${Date.now()}-${rand}`;
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

const readStoredCurrentDate = (): string | null => {
  const todayStateRaw = sharedStorage.getString(STORAGE_KEYS.TODAY_STATE);
  if (!todayStateRaw) {
    return null;
  }

  try {
    const todayState = JSON.parse(todayStateRaw) as { date?: unknown };
    return typeof todayState.date === 'string' ? todayState.date : null;
  } catch {
    return null;
  }
};

const archiveYesterdayLog = async (yesterdayDate: string): Promise<void> => {
  const yesterdayLog = await getDailyLogByDate(yesterdayDate);
  if (!yesterdayLog) {
    return;
  }

  const archivedCompletionPct = yesterdayLog.completionPct >= 100 ? 100 : yesterdayLog.completionPct;
  await updateDailyLog(yesterdayLog.id, { completionPct: archivedCompletionPct });
};

const createTodayLogFromRecurringTasks = async (todayDate: string): Promise<DailyLog> => {
  const existingLog = await getDailyLogByDate(todayDate);
  if (existingLog) {
    return existingLog;
  }

  const activeTasks = await listActiveTasks();
  const recurringTaskIds = activeTasks.filter((task) => task.isRecurring).map((task) => task.id);
  const allWallpapers = await listWallpapers();
  const activeWallpaperId =
    allWallpapers.find((wallpaper) => wallpaper.isUnlocked)?.id ??
    allWallpapers[0]?.id ??
    'default';

  const todayLog: DailyLog = {
    id: generateId(),
    date: todayDate,
    taskIds: recurringTaskIds,
    completedTaskIds: [],
    completionPct: 0,
    wallpaperId: activeWallpaperId,
    renderedWallpaperUri: null,
    createdAt: new Date().toISOString(),
  };

  await upsertDailyLog(todayLog);
  return todayLog;
};

const renderZeroPctWallpaper = async (): Promise<void> => {
  // Stub for Stage 4: this will call WallpaperRenderer with a 0% render job.
};

const updateSharedState = (todayLog: DailyLog): void => {
  sharedStorage.set(
    STORAGE_KEYS.TODAY_STATE,
    JSON.stringify({
      date: todayLog.date,
      taskIds: todayLog.taskIds,
      completedTaskIds: todayLog.completedTaskIds,
      completionPct: todayLog.completionPct,
      wallpaperId: todayLog.wallpaperId,
      renderedWallpaperUri: todayLog.renderedWallpaperUri,
    }),
  );
  sharedStorage.set(STORAGE_KEYS.ACTIVE_TASKS, JSON.stringify(todayLog.taskIds));
};

export const runDailyReset = async (): Promise<Result<DailyResetRunResult, DailyResetError>> => {
  try {
    const now = new Date();
    const todayDate = formatLocalIsoDate(now);
    const storedCurrentDate = readStoredCurrentDate();

    // 1. Check if todayDate !== storedCurrentDate
    if (storedCurrentDate === todayDate) {
      const todayLog = await getDailyLogByDate(todayDate);
      return ok({ didReset: false, todayLog });
    }

    const yesterdayDate = formatLocalIsoDate(addDaysLocal(now, -1));

    // 2. Archive yesterday's DailyLog (mark complete/incomplete)
    await archiveYesterdayLog(yesterdayDate);

    // 3. Run StreakService.evaluate()
    const streakResult = await StreakService.evaluate(now);
    if (!streakResult.ok) {
      return err({
        code: 'RESET_FAILED',
        message: 'Daily reset failed while evaluating streak.',
        cause: streakResult.error,
      });
    }

    // 4. Run StreakService.checkUnlocks()
    const unlockResult = await StreakService.checkUnlocks();
    if (!unlockResult.ok) {
      return err({
        code: 'RESET_FAILED',
        message: 'Daily reset failed while checking unlocks.',
        cause: unlockResult.error,
      });
    }

    // 5. Create new DailyLog for today with recurring tasks
    const todayLog = await createTodayLogFromRecurringTasks(todayDate);

    // 6. Render 0% wallpaper for today (stub)
    await renderZeroPctWallpaper();

    // 7. Update MMKV shared state
    updateSharedState(todayLog);

    return ok({ didReset: true, todayLog });
  } catch (cause) {
    return err({
      code: 'UNKNOWN_ERROR',
      message: 'Daily reset failed unexpectedly.',
      cause,
    });
  }
};

if (!TaskManager.isTaskDefined(LOCKIN_DAILY_RESET_TASK)) {
  TaskManager.defineTask(LOCKIN_DAILY_RESET_TASK, async () => {
    const resetResult = await runDailyReset();
    if (!resetResult.ok) {
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }

    return resetResult.data.didReset
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  });
}

const registerBackgroundResetTask = async (): Promise<Result<void, DailyResetError>> => {
  try {
    const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(LOCKIN_DAILY_RESET_TASK);
    if (isTaskRegistered) {
      return ok(undefined);
    }

    await BackgroundFetch.registerTaskAsync(LOCKIN_DAILY_RESET_TASK, {
      minimumInterval: 60 * 15,
      stopOnTerminate: false,
      startOnBoot: true,
    });

    return ok(undefined);
  } catch (cause) {
    return err({
      code: 'TASK_REGISTRATION_FAILED',
      message: 'Failed to register background daily reset task.',
      cause,
    });
  }
};

export const useDailyReset = (): void => {
  useEffect(() => {
    void registerBackgroundResetTask();
    void runDailyReset();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        void runDailyReset();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);
};
