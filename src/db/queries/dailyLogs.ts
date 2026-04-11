import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { dailyLogs } from '@/db/schema';
import type { DailyLog } from '@/types/gamification.types';

type DailyLogRow = typeof dailyLogs.$inferSelect;
type DailyLogInsert = typeof dailyLogs.$inferInsert;

export type CreateDailyLogInput = DailyLog;
export type UpdateDailyLogInput = Partial<Omit<DailyLog, 'id' | 'date' | 'createdAt'>>;

const serializeIds = (ids: string[]): string => JSON.stringify(ids);

const deserializeIds = (value: string): string[] => {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

const toDailyLog = (row: DailyLogRow): DailyLog => ({
  id: row.id,
  date: row.date,
  taskIds: deserializeIds(row.taskIds),
  completedTaskIds: deserializeIds(row.completedTaskIds),
  completionPct: row.completionPct,
  wallpaperId: row.wallpaperId,
  renderedWallpaperUri: row.renderedWallpaperUri ?? null,
  createdAt: row.createdAt,
});

const toInsert = (input: CreateDailyLogInput): DailyLogInsert => ({
  id: input.id,
  date: input.date,
  taskIds: serializeIds(input.taskIds),
  completedTaskIds: serializeIds(input.completedTaskIds),
  completionPct: input.completionPct,
  wallpaperId: input.wallpaperId,
  renderedWallpaperUri: input.renderedWallpaperUri,
  createdAt: input.createdAt,
});

const toPatch = (patch: UpdateDailyLogInput): Partial<DailyLogInsert> => {
  const output: Partial<DailyLogInsert> = {};

  if (patch.taskIds !== undefined) {
    output.taskIds = serializeIds(patch.taskIds);
  }
  if (patch.completedTaskIds !== undefined) {
    output.completedTaskIds = serializeIds(patch.completedTaskIds);
  }
  if (patch.completionPct !== undefined) {
    output.completionPct = patch.completionPct;
  }
  if (patch.wallpaperId !== undefined) {
    output.wallpaperId = patch.wallpaperId;
  }
  if (patch.renderedWallpaperUri !== undefined) {
    output.renderedWallpaperUri = patch.renderedWallpaperUri;
  }

  return output;
};

export async function listDailyLogs(): Promise<DailyLog[]> {
  const rows = await db.select().from(dailyLogs);
  return rows.map(toDailyLog);
}

export async function getDailyLogById(id: string): Promise<DailyLog | null> {
  const row = await db.query.dailyLogs.findFirst({
    where: eq(dailyLogs.id, id),
  });

  return row ? toDailyLog(row) : null;
}

export async function getDailyLogByDate(date: string): Promise<DailyLog | null> {
  const row = await db.query.dailyLogs.findFirst({
    where: eq(dailyLogs.date, date),
  });

  return row ? toDailyLog(row) : null;
}

export async function createDailyLog(input: CreateDailyLogInput): Promise<void> {
  await db.insert(dailyLogs).values(toInsert(input));
}

export async function upsertDailyLog(input: CreateDailyLogInput): Promise<void> {
  const insert = toInsert(input);

  await db
    .insert(dailyLogs)
    .values(insert)
    .onConflictDoUpdate({
      target: dailyLogs.date,
      set: {
        taskIds: insert.taskIds,
        completedTaskIds: insert.completedTaskIds,
        completionPct: insert.completionPct,
        wallpaperId: insert.wallpaperId,
        renderedWallpaperUri: insert.renderedWallpaperUri,
        createdAt: insert.createdAt,
      },
    });
}

export async function updateDailyLog(id: string, patch: UpdateDailyLogInput): Promise<void> {
  const values = toPatch(patch);
  if (Object.keys(values).length === 0) {
    return;
  }

  await db.update(dailyLogs).set(values).where(eq(dailyLogs.id, id));
}

export async function deleteDailyLog(id: string): Promise<void> {
  await db.delete(dailyLogs).where(eq(dailyLogs.id, id));
}
