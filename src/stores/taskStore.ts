import { create } from 'zustand';

import {
  archiveTask as archiveTaskQuery,
  createTask as createTaskQuery,
  listTasks,
  updateTask as updateTaskQuery,
} from '@/db/queries/tasks';
import type { Task } from '@/types/task.types';

export interface TaskStore {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  archiveTask: (id: string) => void;
  getActiveTasks: () => Task[];
}

const generateId = (): string => {
  const randomUUID = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto?.randomUUID;
  if (randomUUID) {
    return randomUUID();
  }

  const rand = Math.random().toString(16).slice(2, 10);
  return `${Date.now()}-${rand}`;
};

const nowIso = (): string => new Date().toISOString();

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  addTask: (taskInput) => {
    const task: Task = {
      ...taskInput,
      id: generateId(),
      createdAt: nowIso(),
      archivedAt: taskInput.archivedAt ?? null,
    };

    set((state) => ({ tasks: [...state.tasks, task] }));

    void createTaskQuery(task).catch(() => {
      set((state) => ({ tasks: state.tasks.filter((item) => item.id !== task.id) }));
    });
  },
  updateTask: (id, patch) => {
    const previousTasks = get().tasks;
    const { id: _ignoredId, createdAt: _ignoredCreatedAt, ...safePatch } = patch;

    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === id ? { ...task, ...safePatch } : task)),
    }));

    void updateTaskQuery(id, safePatch).catch(() => {
      set({ tasks: previousTasks });
    });
  },
  archiveTask: (id) => {
    const previousTasks = get().tasks;
    const archivedAt = nowIso();

    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === id ? { ...task, archivedAt } : task)),
    }));

    void archiveTaskQuery(id, archivedAt).catch(() => {
      set({ tasks: previousTasks });
    });
  },
  getActiveTasks: () => get().tasks.filter((task) => task.archivedAt === null),
}));

const hydrateTaskStore = async (): Promise<void> => {
  try {
    const persistedTasks = await listTasks();
    useTaskStore.setState({ tasks: persistedTasks });
  } catch {
    // Store stays with default in-memory state if hydration fails.
  }
};

void hydrateTaskStore();
