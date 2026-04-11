import type { RevealMode } from '@/types/wallpaper.types';

export interface DailyLog {
  id: string;
  date: string;
  taskIds: string[];
  completedTaskIds: string[];
  completionPct: number;
  wallpaperId: string;
  renderedWallpaperUri: string | null;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  streakCount: number;
  longestStreak: number;
  lastFullCompletionDate: string | null;
  unlockedWallpaperIds: string[];
  preferredRevealMode: RevealMode;
  soundEnabled: boolean;
  hapticEnabled: boolean;
}
