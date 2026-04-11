// src/constants/features.ts
// Runtime feature flags — controls platform-specific and optional features.

import { Platform } from 'react-native';

export const FEATURES = {
  CLOUD_SYNC: process.env.EXPO_PUBLIC_ENABLE_CLOUD_SYNC === 'true',
  LIVE_ACTIVITIES: Platform.OS === 'ios',
  SILENT_WALLPAPER: Platform.OS === 'android',
} as const;
