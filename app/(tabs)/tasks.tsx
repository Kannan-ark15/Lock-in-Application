// app/(tabs)/tasks.tsx
// Tasks screen — manage recurring tasks with add/edit/archive.

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeOutUp, Layout } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { useTaskStore } from '@/stores/taskStore';
import { colors, spacing, typography, radius } from '@/constants/theme';
import { TaskCard } from '@/components/tasks/TaskCard';
import { AddTaskSheet } from '@/components/tasks/AddTaskSheet';

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const tasks      = useTaskStore((s) => s.tasks);
  const archiveTask = useTaskStore((s) => s.archiveTask);

  const activeTasks   = tasks.filter((t) => !t.archivedAt);
  const archivedTasks = tasks.filter((t) => !!t.archivedAt);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Stores self-hydrate; brief delay for UX.
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
  }, []);

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View>
          <Text style={styles.title}>Tasks</Text>
          <Text style={styles.subtitle}>
            {activeTasks.length} active · {archivedTasks.length} archived
          </Text>
        </View>
        <Pressable
          style={styles.addButton}
          onPress={() => setShowAddSheet(true)}
          android_ripple={{ color: colors.accent.primary + '33', borderless: true }}
        >
          <Text style={styles.addButtonText}>＋</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.accent.primary]}
          />
        }
      >
        {/* Active tasks */}
        {activeTasks.length === 0 ? (
          <Animated.View entering={FadeInDown.springify()} style={styles.emptyState}>
            <Text style={styles.emptyIcon}>□</Text>
            <Text style={styles.emptyTitle}>No tasks yet</Text>
            <Text style={styles.emptyText}>
              Add recurring tasks that gate your wallpaper reveal each day.
            </Text>
            <Pressable
              style={styles.emptyAction}
              onPress={() => setShowAddSheet(true)}
            >
              <Text style={styles.emptyActionText}>Add your first task</Text>
            </Pressable>
          </Animated.View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>ACTIVE</Text>
            {activeTasks.map((task, i) => (
              <Animated.View
                key={task.id}
                entering={FadeInDown.delay(i * 50).springify()}
                exiting={FadeOutUp.springify()}
                layout={Layout.springify()}
              >
                <TaskCard
                  task={task}
                  onEdit={() => router.push({ pathname: '/tasks/edit', params: { id: task.id } })}
                  onArchive={() => archiveTask(task.id)}
                />
              </Animated.View>
            ))}
          </>
        )}

        {/* Archived tasks */}
        {archivedTasks.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: spacing.xl }]}>ARCHIVED</Text>
            {archivedTasks.map((task, i) => (
              <Animated.View
                key={task.id}
                entering={FadeInDown.delay(i * 40).springify()}
                layout={Layout.springify()}
              >
                <TaskCard
                  task={task}
                  archived
                  onEdit={() => {}}
                  onArchive={() => {}}
                />
              </Animated.View>
            ))}
          </>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {/* Add task bottom sheet */}
      <AddTaskSheet
        visible={showAddSheet}
        onClose={() => setShowAddSheet(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 24,
    color: colors.bg.primary,
    lineHeight: 28,
    fontWeight: typography.weights.regular,
  },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.sm },
  sectionLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text.tertiary,
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    gap: spacing.md,
  },
  emptyIcon: {
    fontSize: 48,
    color: colors.text.tertiary,
  },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  emptyText: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 260,
  },
  emptyAction: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.accent.primary,
    borderRadius: radius.lg,
  },
  emptyActionText: {
    color: colors.bg.primary,
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.base,
  },
});
