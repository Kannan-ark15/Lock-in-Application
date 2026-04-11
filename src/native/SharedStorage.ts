import { MMKV } from 'react-native-mmkv';

export const STORAGE_KEYS = {
  TODAY_STATE: 'today_state',
  STREAK_COUNT: 'streak_count',
  USER_PROFILE: 'user_profile',
  ACTIVE_TASKS: 'active_tasks',
} as const;

export const sharedStorage = new MMKV({ id: 'lockin-shared' });
