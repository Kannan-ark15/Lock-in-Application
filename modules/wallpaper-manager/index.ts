// modules/wallpaper-manager/index.ts
// Native module bridge for setting device wallpaper.
// Android: wraps WallpaperManager.getInstance().setBitmap()
// iOS: returns { supported: false } — triggers Shortcuts fallback UX.

export interface WallpaperManagerModule {
  setLockScreenWallpaper(uri: string): Promise<void>;
  setHomeScreenWallpaper(uri: string): Promise<void>;
  isPermissionGranted(): Promise<boolean>;
  requestPermission(): Promise<boolean>;
}
