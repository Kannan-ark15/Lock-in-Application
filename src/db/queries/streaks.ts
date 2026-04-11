import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { userProfile, wallpapers } from '@/db/schema';
import type { UserProfile } from '@/types/gamification.types';
import type { Wallpaper } from '@/types/wallpaper.types';

type WallpaperRow = typeof wallpapers.$inferSelect;
type WallpaperInsert = typeof wallpapers.$inferInsert;
type UserProfileRow = typeof userProfile.$inferSelect;
type UserProfileInsert = typeof userProfile.$inferInsert;

const USER_PROFILE_SINGLETON_ID = 'singleton';

export type CreateWallpaperInput = Wallpaper;
export type UpdateWallpaperInput = Partial<Omit<Wallpaper, 'id'>>;
export type CreateUserProfileInput = UserProfile;
export type UpdateUserProfileInput = Partial<Omit<UserProfile, 'id'>>;

const serializeIds = (ids: string[]): string => JSON.stringify(ids);

const deserializeIds = (value: string): string[] => {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

const toWallpaper = (row: WallpaperRow): Wallpaper => ({
  id: row.id,
  title: row.title,
  sourceUri: row.sourceUri,
  theme: row.theme,
  revealMode: row.revealMode as Wallpaper['revealMode'],
  isUnlocked: row.isUnlocked,
  unlockCondition: row.unlockCondition ?? null,
});

const toWallpaperPatch = (patch: UpdateWallpaperInput): Partial<WallpaperInsert> => {
  const output: Partial<WallpaperInsert> = {};

  if (patch.title !== undefined) {
    output.title = patch.title;
  }
  if (patch.sourceUri !== undefined) {
    output.sourceUri = patch.sourceUri;
  }
  if (patch.theme !== undefined) {
    output.theme = patch.theme;
  }
  if (patch.revealMode !== undefined) {
    output.revealMode = patch.revealMode;
  }
  if (patch.isUnlocked !== undefined) {
    output.isUnlocked = patch.isUnlocked;
  }
  if (patch.unlockCondition !== undefined) {
    output.unlockCondition = patch.unlockCondition;
  }

  return output;
};

const toUserProfile = (row: UserProfileRow): UserProfile => ({
  id: row.id,
  streakCount: row.streakCount,
  longestStreak: row.longestStreak,
  lastFullCompletionDate: row.lastFullCompletionDate ?? null,
  unlockedWallpaperIds: deserializeIds(row.unlockedWallpaperIds),
  preferredRevealMode: row.preferredRevealMode as UserProfile['preferredRevealMode'],
  soundEnabled: row.soundEnabled,
  hapticEnabled: row.hapticEnabled,
});

const toUserProfileInsert = (profile: CreateUserProfileInput): UserProfileInsert => ({
  id: profile.id,
  streakCount: profile.streakCount,
  longestStreak: profile.longestStreak,
  lastFullCompletionDate: profile.lastFullCompletionDate,
  unlockedWallpaperIds: serializeIds(profile.unlockedWallpaperIds),
  preferredRevealMode: profile.preferredRevealMode,
  soundEnabled: profile.soundEnabled,
  hapticEnabled: profile.hapticEnabled,
});

const toUserProfilePatch = (patch: UpdateUserProfileInput): Partial<UserProfileInsert> => {
  const output: Partial<UserProfileInsert> = {};

  if (patch.streakCount !== undefined) {
    output.streakCount = patch.streakCount;
  }
  if (patch.longestStreak !== undefined) {
    output.longestStreak = patch.longestStreak;
  }
  if (patch.lastFullCompletionDate !== undefined) {
    output.lastFullCompletionDate = patch.lastFullCompletionDate;
  }
  if (patch.unlockedWallpaperIds !== undefined) {
    output.unlockedWallpaperIds = serializeIds(patch.unlockedWallpaperIds);
  }
  if (patch.preferredRevealMode !== undefined) {
    output.preferredRevealMode = patch.preferredRevealMode;
  }
  if (patch.soundEnabled !== undefined) {
    output.soundEnabled = patch.soundEnabled;
  }
  if (patch.hapticEnabled !== undefined) {
    output.hapticEnabled = patch.hapticEnabled;
  }

  return output;
};

export async function listWallpapers(): Promise<Wallpaper[]> {
  const rows = await db.select().from(wallpapers);
  return rows.map(toWallpaper);
}

export async function getWallpaperById(id: string): Promise<Wallpaper | null> {
  const row = await db.query.wallpapers.findFirst({
    where: eq(wallpapers.id, id),
  });

  return row ? toWallpaper(row) : null;
}

export async function createWallpaper(input: CreateWallpaperInput): Promise<void> {
  await db.insert(wallpapers).values(input);
}

export async function updateWallpaper(id: string, patch: UpdateWallpaperInput): Promise<void> {
  const values = toWallpaperPatch(patch);
  if (Object.keys(values).length === 0) {
    return;
  }

  await db.update(wallpapers).set(values).where(eq(wallpapers.id, id));
}

export async function unlockWallpaper(id: string): Promise<void> {
  await db.update(wallpapers).set({ isUnlocked: true }).where(eq(wallpapers.id, id));
}

export async function deleteWallpaper(id: string): Promise<void> {
  await db.delete(wallpapers).where(eq(wallpapers.id, id));
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const row = await db.query.userProfile.findFirst({
    where: eq(userProfile.id, USER_PROFILE_SINGLETON_ID),
  });

  return row ? toUserProfile(row) : null;
}

export async function createUserProfile(input: CreateUserProfileInput): Promise<void> {
  await db.insert(userProfile).values(toUserProfileInsert(input));
}

export async function upsertUserProfile(input: CreateUserProfileInput): Promise<void> {
  const values = toUserProfileInsert(input);

  await db
    .insert(userProfile)
    .values(values)
    .onConflictDoUpdate({
      target: userProfile.id,
      set: {
        streakCount: values.streakCount,
        longestStreak: values.longestStreak,
        lastFullCompletionDate: values.lastFullCompletionDate,
        unlockedWallpaperIds: values.unlockedWallpaperIds,
        preferredRevealMode: values.preferredRevealMode,
        soundEnabled: values.soundEnabled,
        hapticEnabled: values.hapticEnabled,
      },
    });
}

export async function updateUserProfile(patch: UpdateUserProfileInput): Promise<void> {
  const values = toUserProfilePatch(patch);
  if (Object.keys(values).length === 0) {
    return;
  }

  await db.update(userProfile).set(values).where(eq(userProfile.id, USER_PROFILE_SINGLETON_ID));
}
