import type { UserProfile } from '@/types/gamification.types';

export const UNLOCK_CONDITIONS: Record<string, (profile: UserProfile) => boolean> = {
  '3-day-streak': (profile) => profile.streakCount >= 3,
  '7-day-streak': (profile) => profile.streakCount >= 7,
  '30-day-streak': (profile) => profile.streakCount >= 30,
  'first-complete': (profile) => profile.longestStreak >= 1,
};
