// app/(tabs)/index.tsx
// Today screen — daily task list + wallpaper reveal progress visualization.

import { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { useDailyLogStore } from '@/stores/dailyLogStore';
import { useTaskStore } from '@/stores/taskStore';
import { useUserStore } from '@/stores/userStore';
import { useWallpaperStore } from '@/stores/wallpaperStore';
import { colors, spacing, typography, radius } from '@/constants/theme';
import { TaskRow } from '@/components/today/TaskRow';
import { ProgressRing } from '@/components/today/ProgressRing';
import { StreakBadge } from '@/components/today/StreakBadge';
import { WallpaperPreview } from '@/components/today/WallpaperPreview';
import { EmptyTasksPrompt } from '@/components/today/EmptyTasksPrompt';

// ─── Greeting ────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5)  return 'Still awake?';
  if (hour < 12) return 'Good morning.';
  if (hour < 17) return 'Good afternoon.';
  if (hour < 21) return 'Good evening.';
  return 'Good night.';
}

function formatDateLong(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

// ─── Header ──────────────────────────────────────────────────────────────────

function TodayHeader({ completionPct }: { completionPct: number }) {
  const insets = useSafeAreaInsets();
  const profile = useUserStore((s) => s.userProfile);

  return (
    <Animated.View
      entering={FadeInDown.delay(0).duration(500).springify()}
      style={[styles.header, { paddingTop: insets.top + spacing.md }]}
    >
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.dateText}>{formatDateLong()}</Text>
        </View>
        <StreakBadge count={profile?.streakCount ?? 0} />
      </View>
      <ProgressRing pct={completionPct} />
    </Animated.View>
  );
}

// ─── Today Screen ────────────────────────────────────────────────────────────

export default function TodayScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const todayLog     = useDailyLogStore((s) => s.todayLog);
  const completionPct = useDailyLogStore((s) => s.completionPct);
  const initTodayLog = useDailyLogStore((s) => s.initTodayLog);
  const completeTask = useDailyLogStore((s) => s.completeTask);
  const uncompleteTask = useDailyLogStore((s) => s.uncompleteTask);
  const tasks        = useTaskStore((s) => s.tasks);
  const activeWallpaper = useWallpaperStore((s) => s.activeWallpaper);

  useEffect(() => {
    void initTodayLog();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await initTodayLog();
    setRefreshing(false);
  }, [initTodayLog]);

  const todayTaskIds    = todayLog?.taskIds ?? [];
  const completedIds    = todayLog?.completedTaskIds ?? [];
  const todayTasks      = tasks.filter((t) => todayTaskIds.includes(t.id) && !t.archivedAt);

  const allDone = todayTasks.length > 0 && completedIds.length === todayTasks.length;

  return (
    <View style={styles.screen}>
      <TodayHeader completionPct={completionPct} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent.primary}
            colors={[colors.accent.primary]}
          />
        }
      >
        {/* Wallpaper preview card */}
        {activeWallpaper && (
          <Animated.View entering={FadeInDown.delay(150).duration(500).springify()}>
            <WallpaperPreview
              wallpaper={activeWallpaper}
              completionPct={completionPct}
              renderedUri={todayLog?.renderedWallpaperUri ?? null}
            />
          </Animated.View>
        )}

        {/* Section header */}
        <Animated.View
          entering={FadeInDown.delay(220).duration(400).springify()}
          style={styles.sectionHeader}
        >
          <Text style={styles.sectionTitle}>
            {allDone ? '✓ All done' : "Today's tasks"}
          </Text>
          {todayTasks.length > 0 && (
            <Text style={styles.sectionCount}>
              {completedIds.length}/{todayTasks.length}
            </Text>
          )}
        </Animated.View>

        {/* Task list */}
        {todayTasks.length === 0 ? (
          <EmptyTasksPrompt onPress={() => router.push('/tasks')} />
        ) : (
          todayTasks.map((task, index) => (
            <Animated.View
              key={task.id}
              entering={FadeInDown.delay(280 + index * 60).duration(400).springify()}
            >
              <TaskRow
                task={task}
                isCompleted={completedIds.includes(task.id)}
                onComplete={() => completeTask(task.id)}
                onUncomplete={() => uncompleteTask(task.id)}
              />
            </Animated.View>
          ))
        )}

        {/* All done celebration */}
        {allDone && (
          <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.celebration}>
            <Text style={styles.celebrationIcon}>◈</Text>
            <Text style={styles.celebrationText}>Wallpaper fully revealed!</Text>
            <Text style={styles.celebrationSub}>Your lock screen has been updated.</Text>
          </Animated.View>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    backgroundColor: colors.bg.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  dateText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sectionCount: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
    fontWeight: typography.weights.medium,
  },
  celebration: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  celebrationIcon: {
    fontSize: 48,
    color: colors.accent.success,
  },
  celebrationText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  celebrationSub: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  bottomPad: {
    height: spacing.xl,
  },
});
