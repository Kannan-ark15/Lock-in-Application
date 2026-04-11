import { AppState, type AppStateStatus } from 'react-native';

import { WallpaperRenderer, type RenderJob } from '@/engine/WallpaperRenderer';
import { useWallpaperStore } from '@/stores/wallpaperStore';
import type { Result } from '@/types/result.types';
import { err, ok } from '@/types/result.types';

export interface WallpaperSyncServiceError {
  code: 'NO_WALLPAPER' | 'RENDER_ERROR' | 'UNKNOWN_ERROR';
  message: string;
  cause?: unknown;
}

const RENDER_DEBOUNCE_MS = 500;

let appState: AppStateStatus = AppState.currentState;
let appStateSubscription: { remove: () => void } | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let isRendering = false;
let queuedCompletionPct: number | null = null;
let latestRequestedCompletionPct = 0;

const ensureAppStateListener = (): void => {
  if (appStateSubscription) {
    return;
  }

  appStateSubscription = AppState.addEventListener('change', (nextState) => {
    appState = nextState;

    // If the app is backgrounded while rendering, queue a replay for foreground.
    if (nextState !== 'active' && isRendering) {
      queuedCompletionPct = latestRequestedCompletionPct;
      return;
    }

    if (nextState === 'active') {
      void flushQueue();
    }
  });
};

const buildRenderJob = (completionPct: number): Result<RenderJob, WallpaperSyncServiceError> => {
  const wallpaper = useWallpaperStore.getState().activeWallpaper;
  if (!wallpaper) {
    return err({
      code: 'NO_WALLPAPER',
      message: 'No active wallpaper available for rendering.',
    });
  }

  return ok({
    wallpaper,
    completionPct,
    outputSize: { width: 1080, height: 2400 },
  });
};

const runRender = async (completionPct: number): Promise<Result<void, WallpaperSyncServiceError>> => {
  const renderJob = buildRenderJob(completionPct);
  if (!renderJob.ok) {
    return renderJob;
  }

  const renderResult = await WallpaperRenderer.render(renderJob.data);
  if (!renderResult.ok) {
    return err({
      code: 'RENDER_ERROR',
      message: 'Wallpaper rendering failed.',
      cause: renderResult.error,
    });
  }

  return ok(undefined);
};

const flushQueue = async (): Promise<void> => {
  if (appState !== 'active' || isRendering || queuedCompletionPct === null) {
    return;
  }

  const pct = queuedCompletionPct;
  queuedCompletionPct = null;
  isRendering = true;

  try {
    await runRender(pct);
  } finally {
    isRendering = false;
  }

  if (appState !== 'active') {
    queuedCompletionPct = latestRequestedCompletionPct;
    return;
  }

  if (queuedCompletionPct !== null) {
    void flushQueue();
  }
};

export const WallpaperSyncService = {
  async scheduleRender(completionPct: number): Promise<Result<void, WallpaperSyncServiceError>> {
    try {
      ensureAppStateListener();
      latestRequestedCompletionPct = completionPct;
      queuedCompletionPct = completionPct;

      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      debounceTimer = setTimeout(() => {
        void flushQueue();
      }, RENDER_DEBOUNCE_MS);

      return ok(undefined);
    } catch (cause) {
      return err({
        code: 'UNKNOWN_ERROR',
        message: 'Failed to schedule wallpaper render.',
        cause,
      });
    }
  },

  async flushQueuedRender(): Promise<Result<void, WallpaperSyncServiceError>> {
    try {
      ensureAppStateListener();
      await flushQueue();
      return ok(undefined);
    } catch (cause) {
      return err({
        code: 'UNKNOWN_ERROR',
        message: 'Failed to flush queued wallpaper render.',
        cause,
      });
    }
  },
};
