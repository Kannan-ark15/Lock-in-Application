import { create } from 'zustand';
import * as Haptics from 'expo-haptics';

import {
  createDailyLog,
  getDailyLogByDate,
  updateDailyLog,
} from '@/db/queries/dailyLogs';
import { sharedStorage, STORAGE_KEYS } from '@/native/SharedStorage';
import { WallpaperSyncService } from '@/services/WallpaperSyncService';
import { useTaskStore } from '@/stores/taskStore';
import { useUserStore } from '@/stores/userStore';
import { useWallpaperStore } from '@/stores/wallpaperStore';
import type { DailyLog } from '@/types/gamification.types';

export interface DailyLogStore {
  todayLog: DailyLog | null;
  completionPct: number;
  completeTask: (taskId: string) => Promise<void>;
  uncompleteTask: (taskId: string) => Promise<void>;
  initTodayLog: () => Promise<void>;
}

const generateId = (): string => {
  const randomUUID = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto?.randomUUID;
  if (randomUUID) {
    return randomUUID();
  }

  const rand = Math.random().toString(16).slice(2, 10);
  return `${Date.now()}-${rand}`;
};

const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const calculateCompletionPct = (completedCount: number, totalCount: number): number => {
  if (totalCount === 0) {
    return 0;
  }

  return Math.round((completedCount / totalCount) * 100);
};

const writeTodayStateToMMKV = (todayLog: DailyLog): void => {
  const payload = {
    date: todayLog.date,
    taskIds: todayLog.taskIds,
    completedTaskIds: todayLog.completedTaskIds,
    completionPct: todayLog.completionPct,
    wallpaperId: todayLog.wallpaperId,
    renderedWallpaperUri: todayLog.renderedWallpaperUri,
  };

  sharedStorage.set(STORAGE_KEYS.TODAY_STATE, JSON.stringify(payload));
};

const triggerWallpaperRender = async (completionPct: number): Promise<void> => {
  await WallpaperSyncService.scheduleRender(completionPct);
};

const checkStreakIncrement = async (): Promise<void> => {};

const fireCompletionFeedback = async (): Promise<void> => {
  const userProfile = useUserStore.getState().userProfile;
  if (!userProfile) {
    return;
  }

  if (userProfile.hapticEnabled) {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Ignore haptic failures to keep the completion flow uninterrupted.
    }
  }

  if (userProfile.soundEnabled) {
    // Sound hook point: intentionally empty until completion SFX asset is wired.
  }
};

export const useDailyLogStore = create<DailyLogStore>((set, get) => ({
  todayLog: null,
  completionPct: 0,
  completeTask: async (taskId) => {
    const previousTodayLog = get().todayLog;
    const previousCompletionPct = get().completionPct;

    if (!previousTodayLog || previousTodayLog.completedTaskIds.includes(taskId)) {
      return;
    }

    if (!previousTodayLog.taskIds.includes(taskId)) {
      return;
    }

    try {
      // 1. Optimistically update Zustand state.
      const optimisticCompletedTaskIds = [...previousTodayLog.completedTaskIds, taskId];
      const optimisticPct = calculateCompletionPct(
        optimisticCompletedTaskIds.length,
        previousTodayLog.taskIds.length,
      );
      const optimisticLog: DailyLog = {
        ...previousTodayLog,
        completedTaskIds: optimisticCompletedTaskIds,
        completionPct: optimisticPct,
      };
      set({ todayLog: optimisticLog, completionPct: optimisticPct });

      // 2. Persist to SQLite.
      await updateDailyLog(previousTodayLog.id, {
        completedTaskIds: optimisticCompletedTaskIds,
        completionPct: optimisticPct,
      });

      // 3. Write to MMKV (widget reads from here).
      writeTodayStateToMMKV(optimisticLog);

      // 4. Recalculate completionPct.
      const recalculatedPct = calculateCompletionPct(
        optimisticLog.completedTaskIds.length,
        optimisticLog.taskIds.length,
      );
      const recalculatedLog: DailyLog = {
        ...optimisticLog,
        completionPct: recalculatedPct,
      };
      set({ todayLog: recalculatedLog, completionPct: recalculatedPct });

      if (recalculatedPct !== optimisticPct) {
        await updateDailyLog(previousTodayLog.id, { completionPct: recalculatedPct });
        writeTodayStateToMMKV(recalculatedLog);
      }

      // 5. Trigger WallpaperSyncService.scheduleRender().
      await triggerWallpaperRender(recalculatedPct);

      // 6. Fire haptic + sound if enabled.
      await fireCompletionFeedback();

      // 7. Check if streak should increment.
      await checkStreakIncrement();
    } catch {
      set({ todayLog: previousTodayLog, completionPct: previousCompletionPct });
      writeTodayStateToMMKV(previousTodayLog);
    }
  },
  uncompleteTask: async (taskId) => {
    const previousTodayLog = get().todayLog;
    const previousCompletionPct = get().completionPct;

    if (!previousTodayLog || !previousTodayLog.completedTaskIds.includes(taskId)) {
      return;
    }

    const nextCompletedTaskIds = previousTodayLog.completedTaskIds.filter(
      (completedTaskId) => completedTaskId !== taskId,
    );
    const nextCompletionPct = calculateCompletionPct(nextCompletedTaskIds.length, previousTodayLog.taskIds.length);
    const nextLog: DailyLog = {
      ...previousTodayLog,
      completedTaskIds: nextCompletedTaskIds,
      completionPct: nextCompletionPct,
    };

    set({ todayLog: nextLog, completionPct: nextCompletionPct });

    try {
      await updateDailyLog(previousTodayLog.id, {
        completedTaskIds: nextCompletedTaskIds,
        completionPct: nextCompletionPct,
      });
      writeTodayStateToMMKV(nextLog);
      await triggerWallpaperRender(nextCompletionPct);
    } catch {
      set({ todayLog: previousTodayLog, completionPct: previousCompletionPct });
      writeTodayStateToMMKV(previousTodayLog);
    }
  },
  initTodayLog: async () => {
    const todayDate = getTodayDateString();
    const existingLog = await getDailyLogByDate(todayDate);

    if (existingLog) {
      set({
        todayLog: existingLog,
        completionPct: existingLog.completionPct,
      });
      writeTodayStateToMMKV(existingLog);
      return;
    }

    const activeTasks = useTaskStore.getState().getActiveTasks();
    const activeWallpaper = useWallpaperStore.getState().activeWallpaper;
    const newTodayLog: DailyLog = {
      id: generateId(),
      date: todayDate,
      taskIds: activeTasks.map((task) => task.id),
      completedTaskIds: [],
      completionPct: 0,
      wallpaperId: activeWallpaper?.id ?? 'default',
      renderedWallpaperUri: null,
      createdAt: new Date().toISOString(),
    };

    await createDailyLog(newTodayLog);

    set({
      todayLog: newTodayLog,
      completionPct: 0,
    });
    writeTodayStateToMMKV(newTodayLog);
  },
}));
