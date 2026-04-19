// src/components/today/StreakBadge.tsx

import { View, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useEffect } from 'react';
import { colors, typography, radius, spacing } from '@/constants/theme';

interface Props { count: number }

export function StreakBadge({ count }: Props) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (count > 0) {
      scale.value = withSpring(1.15, { damping: 8 }, () => {
        scale.value = withSpring(1, { damping: 12 });
      });
    }
  }, [count]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.badge, animStyle]}>
      <Text style={styles.fire}>◈</Text>
      <Text style={styles.count}>{count}</Text>
      <Text style={styles.label}>day streak</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bg.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.accent.warning + '66',
  },
  fire: { fontSize: 14, color: colors.accent.warning },
  count: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.accent.warning,
  },
  label: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
});
