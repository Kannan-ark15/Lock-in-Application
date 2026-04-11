// modules/widget-bridge/index.ts
// Native module bridge for widget shared state.
// iOS: writes to App Group container, calls WidgetCenter.reloadTimelines.
// Android: writes to ContentProvider, broadcasts AppWidgetManager update.

export interface TodayWidgetState {
  tasks: WidgetTask[];
  completedIds: string[];
  completionPct: number;
  wallpaperSnapshotUri: string;
  date: string;
}

export interface WidgetTask {
  id: string;
  title: string;
  icon: string;
  isCompleted: boolean;
}

export interface WidgetBridgeModule {
  writeSharedState(state: TodayWidgetState): Promise<void>;
  reloadWidget(): void;
}
