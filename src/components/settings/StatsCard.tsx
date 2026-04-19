// src/components/settings/StatsCard.tsx

import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, radius } from '@/constants/theme';

interface Props {
  streakCount: number;
  longestStreak: number;
  lastCompletionDate: string | null;
}

function StatItem({ value, label, color }: { value: string; label: string; color?: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function StatsCard({ streakCount, longestStreak, lastCompletionDate }: Props) {
  const lastDate = lastCompletionDate
    ? new Date(lastCompletionDate + 'T12:00:00').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : '—';

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Your Progress</Text>
      <View style={styles.statsRow}>
        <StatItem
          value={String(streakCount)}
          label="Current streak"
          color={streakCount > 0 ? colors.accent.warning : undefined}
        />
        <View style={styles.divider} />
        <StatItem
          value={String(longestStreak)}
          label="Longest streak"
          color={longestStreak > 0 ? colors.accent.primary : undefined}
        />
        <View style={styles.divider} />
        <StatItem value={lastDate} label="Last complete" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 14,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
});
