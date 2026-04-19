import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/constants/theme';
import type { Task } from '@/types/task.types';

interface Props {
  task: Task;
  isCompleted: boolean;
  onComplete: () => void;
  onUncomplete: () => void;
}

const PRIORITY_COLOR: Record<Task['priority'], string> = {
  low: colors.text.tertiary,
  medium: colors.accent.warning,
  high: colors.accent.danger,
};

export function TaskRow({ task, isCompleted, onComplete, onUncomplete }: Props) {
  const onToggle = isCompleted ? onUncomplete : onComplete;

  return (
    <View style={[styles.row, isCompleted && styles.rowDone]}>
      <Pressable onPress={onToggle} style={[styles.checkbox, isCompleted && styles.checkboxDone]}>
        <Text style={[styles.checkText, isCompleted && styles.checkTextDone]}>
          {isCompleted ? 'x' : ''}
        </Text>
      </Pressable>

      <View style={styles.content}>
        <Text style={[styles.title, isCompleted && styles.titleDone]}>
          {task.icon} {task.title}
        </Text>
        <View style={styles.meta}>
          <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLOR[task.priority] }]} />
          <Text style={styles.metaText}>{task.priority.toUpperCase()}</Text>
          {task.isRecurring && <Text style={styles.metaText}>RECURRING</Text>}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  rowDone: {
    opacity: 0.72,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.secondary,
  },
  checkboxDone: {
    borderColor: colors.accent.success,
    backgroundColor: colors.accent.success + '22',
  },
  checkText: {
    fontSize: typography.sizes.base,
    color: 'transparent',
    lineHeight: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  checkTextDone: {
    color: colors.accent.success,
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    fontWeight: typography.weights.medium,
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: colors.text.secondary,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
  metaText: {
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
    letterSpacing: 0.8,
  },
});
