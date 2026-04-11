import { create } from 'zustand';

import { listWallpapers, unlockWallpaper as unlockWallpaperQuery } from '@/db/queries/streaks';
import type { Wallpaper } from '@/types/wallpaper.types';

export interface WallpaperStore {
  wallpapers: Wallpaper[];
  activeWallpaper: Wallpaper | null;
  unlock: (id: string) => void;
}

const resolveActiveWallpaper = (wallpaperList: Wallpaper[], currentId?: string): Wallpaper | null => {
  if (currentId) {
    const current = wallpaperList.find((wallpaper) => wallpaper.id === currentId);
    if (current) {
      return current;
    }
  }

  return (
    wallpaperList.find((wallpaper) => wallpaper.isUnlocked) ??
    wallpaperList[0] ??
    null
  );
};

export const useWallpaperStore = create<WallpaperStore>((set, get) => ({
  wallpapers: [],
  activeWallpaper: null,
  unlock: (id) => {
    const previousWallpapers = get().wallpapers;
    const previousActiveWallpaper = get().activeWallpaper;

    const nextWallpapers = previousWallpapers.map((wallpaper) =>
      wallpaper.id === id ? { ...wallpaper, isUnlocked: true } : wallpaper,
    );
    const nextActiveWallpaper = resolveActiveWallpaper(nextWallpapers, previousActiveWallpaper?.id ?? id);

    set({
      wallpapers: nextWallpapers,
      activeWallpaper: nextActiveWallpaper,
    });

    void unlockWallpaperQuery(id).catch(() => {
      set({
        wallpapers: previousWallpapers,
        activeWallpaper: previousActiveWallpaper,
      });
    });
  },
}));

const hydrateWallpaperStore = async (): Promise<void> => {
  try {
    const persistedWallpapers = await listWallpapers();

    useWallpaperStore.setState((state) => ({
      wallpapers: persistedWallpapers,
      activeWallpaper: resolveActiveWallpaper(persistedWallpapers, state.activeWallpaper?.id),
    }));
  } catch {
    // Store stays with default in-memory state if hydration fails.
  }
};

void hydrateWallpaperStore();
