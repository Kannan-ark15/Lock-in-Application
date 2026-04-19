// src/components/settings/RevealModePicker.tsx

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, spacing, typography, radius } from '@/constants/theme';
import type { RevealMode } from '@/types/wallpaper.types';

const MODES: { value: RevealMode; label: string; icon: string; desc: string }[] = [
  { value: 'radial',  label: 'Radial',  icon: '◉', desc: 'Grows from center outward' },
  { value: 'wipe',    label: 'Wipe',    icon: '▷', desc: 'Slides left to right' },
  { value: 'scatter', label: 'Scatter', icon: '◈', desc: 'Random tile-by-tile reveal' },
];

interface Props {
  value: RevealMode;
  onChange: (v: RevealMode) => void;
}

export function RevealModePicker({ value, onChange }: Props) {
  return (
    <View style={styles.container}>
      {MODES.map((mode, index) => {
        const active = value === mode.value;
        return (
          <View key={mode.value}>
            {index > 0 && <View style={styles.divider} />}
            <Pressable
              style={[styles.option, active && styles.optionActive]}
              onPress={() => onChange(mode.value)}
              android_ripple={{ color: colors.accent.primary + '22' }}
            >
              <Text style={[styles.modeIcon, active && styles.modeIconActive]}>
                {mode.icon}
              </Text>
              <View style={styles.modeText}>
                <Text style={[styles.modeLabel, active && styles.modeLabelActive]}>
                  {mode.label}
                </Text>
                <Text style={styles.modeDesc}>{mode.desc}</Text>
              </View>
              {active && (
                <View style={styles.activeDot} />
              )}
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  optionActive: {
    backgroundColor: colors.accent.primary + '11',
  },
  modeIcon: {
    fontSize: 22,
    color: colors.text.tertiary,
    width: 28,
    textAlign: 'center',
  },
  modeIconActive: {
    color: colors.accent.primary,
  },
  modeText: { flex: 1, gap: 2 },
  modeLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  modeLabelActive: { color: colors.accent.primary },
  modeDesc: {
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
});
