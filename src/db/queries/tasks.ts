import { eq, isNull } from 'drizzle-orm';

import { db } from '@/db/client';
import { tasks } from '@/db/schema';
import type { Task } from '@/types/task.types';

type TaskRow = typeof tasks.$inferSelect;
type TaskInsert = typeof tasks.$inferInsert;

export type CreateTaskInput = Task;
export type UpdateTaskInput = Partial<Omit<Task, 'id' | 'createdAt'>>;

const toTask = (row: TaskRow): Task => ({
  id: row.id,
  title: row.title,
  icon: row.icon,
  priority: row.priority as Task['priority'],
  isRecurring: row.isRecurring,
  createdAt: row.createdAt,
  archivedAt: row.archivedAt ?? null,
});

const toTaskPatch = (patch: UpdateTaskInput): Partial<TaskInsert> => {
  const output: Partial<TaskInsert> = {};

  if (patch.title !== undefined) {
    output.title = patch.title;
  }
  if (patch.icon !== undefined) {
    output.icon = patch.icon;
  }
  if (patch.priority !== undefined) {
    output.priority = patch.priority;
  }
  if (patch.isRecurring !== undefined) {
    output.isRecurring = patch.isRecurring;
  }
  if (patch.archivedAt !== undefined) {
    output.archivedAt = patch.archivedAt;
  }

  return output;
};

export async function listTasks(): Promise<Task[]> {
  const rows = await db.select().from(tasks);
  return rows.map(toTask);
}

export async function listActiveTasks(): Promise<Task[]> {
  const rows = await db.select().from(tasks).where(isNull(tasks.archivedAt));
  return rows.map(toTask);
}

export async function getTaskById(id: string): Promise<Task | null> {
  const row = await db.query.tasks.findFirst({
    where: eq(tasks.id, id),
  });

  return row ? toTask(row) : null;
}

export async function createTask(input: CreateTaskInput): Promise<void> {
  await db.insert(tasks).values(input);
}

export async function updateTask(id: string, patch: UpdateTaskInput): Promise<void> {
  const values = toTaskPatch(patch);
  if (Object.keys(values).length === 0) {
    return;
  }

  await db.update(tasks).set(values).where(eq(tasks.id, id));
}

export async function archiveTask(id: string, archivedAt: string): Promise<void> {
  await db.update(tasks).set({ archivedAt }).where(eq(tasks.id, id));
}

export async function deleteTask(id: string): Promise<void> {
  await db.delete(tasks).where(eq(tasks.id, id));
}
