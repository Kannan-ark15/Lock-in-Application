import { requireNativeModule } from 'expo-modules-core';

export interface WallpaperSetResult {
  supported: boolean;
}

export interface WallpaperManagerModule {
  setLockScreenWallpaper(uri: string): Promise<WallpaperSetResult>;
  setHomeScreenWallpaper(uri: string): Promise<WallpaperSetResult>;
  isPermissionGranted(): Promise<boolean>;
  requestPermission(): Promise<boolean>;
}

export default requireNativeModule<WallpaperManagerModule>('WallpaperManager');
