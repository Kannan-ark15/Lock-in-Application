import { Platform } from 'react-native';

import WallpaperManagerModule from '../../modules/wallpaper-manager';
import type { WallpaperSetResult } from '../../modules/wallpaper-manager';

const UNSUPPORTED_RESULT: WallpaperSetResult = { supported: false };

const normalizeResult = (result: unknown): WallpaperSetResult => {
  if (
    typeof result === 'object' &&
    result !== null &&
    'supported' in result &&
    typeof (result as { supported?: unknown }).supported === 'boolean'
  ) {
    return { supported: (result as { supported: boolean }).supported };
  }

  return { supported: Platform.OS === 'android' };
};

export const WallpaperManager = {
  async setLockScreenWallpaper(uri: string): Promise<WallpaperSetResult> {
    try {
      const result = await WallpaperManagerModule.setLockScreenWallpaper(uri);
      return normalizeResult(result);
    } catch {
      return UNSUPPORTED_RESULT;
    }
  },

  async setHomeScreenWallpaper(uri: string): Promise<WallpaperSetResult> {
    try {
      const result = await WallpaperManagerModule.setHomeScreenWallpaper(uri);
      return normalizeResult(result);
    } catch {
      return UNSUPPORTED_RESULT;
    }
  },

  async isPermissionGranted(): Promise<boolean> {
    try {
      return await WallpaperManagerModule.isPermissionGranted();
    } catch {
      return Platform.OS !== 'android';
    }
  },

  async requestPermission(): Promise<boolean> {
    try {
      return await WallpaperManagerModule.requestPermission();
    } catch {
      return Platform.OS !== 'android';
    }
  },
};
