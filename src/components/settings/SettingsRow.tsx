// src/components/settings/SettingsRow.tsx

import type { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/constants/theme';

interface Props {
  label: string;
  description?: string;
  right?: ReactNode;
}

export function SettingsRow({ label, description, right }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
      {right && <View style={styles.right}>{right}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    minHeight: 52,
  },
  text: { flex: 1, gap: 2, paddingRight: spacing.md },
  label: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  description: {
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
    lineHeight: 16,
  },
  right: {
    flexShrink: 0,
  },
});
