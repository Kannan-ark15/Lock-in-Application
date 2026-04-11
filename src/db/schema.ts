import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  icon: text('icon').notNull(),
  priority: text('priority').notNull(),
  isRecurring: integer('is_recurring', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
  archivedAt: text('archived_at'),
});

export const dailyLogs = sqliteTable('daily_logs', {
  id: text('id').primaryKey(),
  date: text('date').notNull().unique(),
  taskIds: text('task_ids').notNull(),
  completedTaskIds: text('completed_task_ids').notNull().default('[]'),
  completionPct: real('completion_pct').notNull().default(0),
  wallpaperId: text('wallpaper_id').notNull(),
  renderedWallpaperUri: text('rendered_wallpaper_uri'),
  createdAt: text('created_at').notNull(),
});

export const wallpapers = sqliteTable('wallpapers', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  sourceUri: text('source_uri').notNull(),
  theme: text('theme').notNull(),
  revealMode: text('reveal_mode').notNull().default('radial'),
  isUnlocked: integer('is_unlocked', { mode: 'boolean' }).notNull().default(false),
  unlockCondition: text('unlock_condition'),
});

export const userProfile = sqliteTable('user_profile', {
  id: text('id').primaryKey().default('singleton'),
  streakCount: integer('streak_count').notNull().default(0),
  longestStreak: integer('longest_streak').notNull().default(0),
  lastFullCompletionDate: text('last_full_completion_date'),
  unlockedWallpaperIds: text('unlocked_wallpaper_ids').notNull().default('[]'),
  preferredRevealMode: text('preferred_reveal_mode').notNull().default('radial'),
  soundEnabled: integer('sound_enabled', { mode: 'boolean' }).notNull().default(true),
  hapticEnabled: integer('haptic_enabled', { mode: 'boolean' }).notNull().default(true),
});
