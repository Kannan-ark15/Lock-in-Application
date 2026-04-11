export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  icon: string;
  priority: TaskPriority;
  isRecurring: boolean;
  createdAt: string;
  archivedAt: string | null;
}
