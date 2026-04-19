import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/constants/theme';
import type { Task } from '@/types/task.types';

interface Props {
  task: Task;
  onEdit: () => void;
  onArchive: () => void;
  archived?: boolean;
}

const PRIORITY_COLOR: Record<Task['priority'], string> = {
  low: colors.text.tertiary,
  medium: colors.accent.warning,
  high: colors.accent.danger,
};

export function TaskCard({ task, onEdit, onArchive, archived = false }: Props) {
  return (
    <View style={[styles.card, archived && styles.cardArchived]}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {task.icon} {task.title}
        </Text>
        <View style={styles.badges}>
          <View style={[styles.badge, { borderColor: PRIORITY_COLOR[task.priority] }]}>
            <Text style={[styles.badgeText, { color: PRIORITY_COLOR[task.priority] }]}>
              {task.priority.toUpperCase()}
            </Text>
          </View>
          {task.isRecurring && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>RECURRING</Text>
            </View>
          )}
          {archived && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>ARCHIVED</Text>
            </View>
          )}
        </View>
      </View>

      {!archived && (
        <View style={styles.actions}>
          <Pressable style={styles.editBtn} onPress={onEdit}>
            <Text style={styles.editText}>Edit</Text>
          </Pressable>
          <Pressable style={styles.archiveBtn} onPress={onArchive}>
            <Text style={styles.archiveText}>Archive</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  cardArchived: {
    opacity: 0.7,
  },
  header: {
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    fontWeight: typography.weights.semibold,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  badge: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
    letterSpacing: 0.6,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  editBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.bg.secondary,
  },
  archiveBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.accent.danger + '66',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  editText: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  archiveText: {
    color: colors.accent.danger,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
});
