// src/components/today/EmptyTasksPrompt.tsx

import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors, spacing, typography, radius } from '@/constants/theme';

interface Props { onPress: () => void }

export function EmptyTasksPrompt({ onPress }: Props) {
  return (
    <Animated.View entering={FadeIn.delay(300)} style={styles.container}>
      <Text style={styles.icon}>□</Text>
      <Text style={styles.title}>No tasks for today</Text>
      <Text style={styles.body}>
        Add recurring tasks to start revealing your wallpaper as you complete them.
      </Text>
      <Pressable style={styles.button} onPress={onPress}>
        <Text style={styles.buttonText}>Set up tasks →</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  icon: {
    fontSize: 44,
    color: colors.text.tertiary,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  body: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 260,
  },
  button: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.accent.primary,
    borderRadius: radius.lg,
  },
  buttonText: {
    color: colors.bg.primary,
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.base,
  },
});
