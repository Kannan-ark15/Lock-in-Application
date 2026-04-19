// src/components/tasks/PrioritySelector.tsx

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, spacing, typography, radius } from '@/constants/theme';
import type { TaskPriority } from '@/types/task.types';

const OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low',    label: 'Low',    color: colors.text.tertiary },
  { value: 'medium', label: 'Medium', color: colors.accent.warning },
  { value: 'high',   label: 'High',   color: colors.accent.danger },
];

interface Props {
  value: TaskPriority;
  onChange: (v: TaskPriority) => void;
}

export function PrioritySelector({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            style={[styles.option, active && { borderColor: opt.color, backgroundColor: opt.color + '18' }]}
            onPress={() => onChange(opt.value)}
          >
            <View style={[styles.dot, { backgroundColor: opt.color }]} />
            <Text style={[styles.label, active && { color: opt.color }]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.bg.card,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
  },
});
