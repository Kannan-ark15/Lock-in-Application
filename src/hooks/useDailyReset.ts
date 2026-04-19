// src/hooks/useDailyReset.ts
// Daily reset hook — runs on app foreground + background fetch.
// Checks local date rollover, archives yesterday's log, evaluates streak,
// creates today's log from recurring tasks, and updates MMKV shared state.

import { useEffect } from 'react';
import { AppState } from 'react-native';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

import { getDailyLogByDate, updateDailyLog, upsertDailyLog } from '@/db/queries/dailyLogs';
import { listWallpapers } from '@/db/queries/streaks';
import { listActiveTasks } from '@/db/queries/tasks';
import { sharedStorage, STORAGE_KEYS } from '@/native/SharedStorage';
import { StreakService } from '@/services/StreakService';
import { WallpaperSyncService } from '@/services/WallpaperSyncService';
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
  if (randomUUID) return randomUUID();
  const rand = Math.random().toString(16).slice(2, 10);
  return `${Date.now()}-${rand}`;
};

const formatLocalIsoDate = (date: Date): string => {
  const year  = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day   = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDaysLocal = (date: Date, amount: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const readStoredCurrentDate = (): string | null => {
  const raw = sharedStorage.getString(STORAGE_KEYS.TODAY_STATE);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { date?: unknown };
    return typeof parsed.date === 'string' ? parsed.date : null;
  } catch {
    return null;
  }
};

const archiveYesterdayLog = async (yesterdayDate: string): Promise<void> => {
  const log = await getDailyLogByDate(yesterdayDate);
  if (!log) return;
  const pct = log.completionPct >= 100 ? 100 : log.completionPct;
  await updateDailyLog(log.id, { completionPct: pct });
};

const createTodayLog = async (todayDate: string): Promise<DailyLog> => {
  const existing = await getDailyLogByDate(todayDate);
  if (existing) return existing;

  const activeTasks   = await listActiveTasks();
  const recurring     = activeTasks.filter((t) => t.isRecurring).map((t) => t.id);
  const allWallpapers = await listWallpapers();
  const wallpaperId   =
    allWallpapers.find((w) => w.isUnlocked)?.id ?? allWallpapers[0]?.id ?? 'default';

  const log: DailyLog = {
    id: generateId(),
    date: todayDate,
    taskIds: recurring,
    completedTaskIds: [],
    completionPct: 0,
    wallpaperId,
    renderedWallpaperUri: null,
    createdAt: new Date().toISOString(),
  };

  await upsertDailyLog(log);
  return log;
};

const updateSharedState = (log: DailyLog): void => {
  sharedStorage.set(
    STORAGE_KEYS.TODAY_STATE,
    JSON.stringify({
      date: log.date,
      taskIds: log.taskIds,
      completedTaskIds: log.completedTaskIds,
      completionPct: log.completionPct,
      wallpaperId: log.wallpaperId,
      renderedWallpaperUri: log.renderedWallpaperUri,
    }),
  );
  sharedStorage.set(STORAGE_KEYS.ACTIVE_TASKS, JSON.stringify(log.taskIds));
};

export const runDailyReset = async (): Promise<Result<DailyResetRunResult, DailyResetError>> => {
  try {
    const now       = new Date();
    const todayDate = formatLocalIsoDate(now);
    const stored    = readStoredCurrentDate();

    if (stored === todayDate) {
      const todayLog = await getDailyLogByDate(todayDate);
      return ok({ didReset: false, todayLog });
    }

    await archiveYesterdayLog(formatLocalIsoDate(addDaysLocal(now, -1)));

    const streakResult = await StreakService.evaluate(now);
    if (!streakResult.ok) {
      return err({ code: 'RESET_FAILED', message: 'Streak evaluation failed.', cause: streakResult.error });
    }

    const unlockResult = await StreakService.checkUnlocks();
    if (!unlockResult.ok) {
      return err({ code: 'RESET_FAILED', message: 'Unlock check failed.', cause: unlockResult.error });
    }

    const todayLog = await createTodayLog(todayDate);
    updateSharedState(todayLog);

    // Render 0% wallpaper so the lock screen updates immediately on day reset
    void WallpaperSyncService.scheduleRender(0);

    return ok({ didReset: true, todayLog });
  } catch (cause) {
    return err({ code: 'UNKNOWN_ERROR', message: 'Daily reset failed.', cause });
  }
};

if (!TaskManager.isTaskDefined(LOCKIN_DAILY_RESET_TASK)) {
  TaskManager.defineTask(LOCKIN_DAILY_RESET_TASK, async () => {
    const result = await runDailyReset();
    if (!result.ok) return BackgroundFetch.BackgroundFetchResult.Failed;
    return result.data.didReset
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  });
}

const registerTask = async (): Promise<void> => {
  try {
    const registered = await TaskManager.isTaskRegisteredAsync(LOCKIN_DAILY_RESET_TASK);
    if (registered) return;
    await BackgroundFetch.registerTaskAsync(LOCKIN_DAILY_RESET_TASK, {
      minimumInterval: 60 * 15,
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch {
    // Non-fatal
  }
};

export const useDailyReset = (): void => {
  useEffect(() => {
    void registerTask();
    void runDailyReset();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void runDailyReset();
    });

    return () => sub.remove();
  }, []);
};
