// src/components/tasks/IconPicker.tsx

import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { colors, spacing, radius, typography } from '@/constants/theme';

const ICONS = [
  '○','□','◇','△','☆','♡','◉','▣','◈','⊕',
  '✦','⬡','◎','⊙','⊛','◐','◑','◒','◓','◔',
  '🏃','🏋️','📚','💻','🎯','🧘','🥗','💊','🛌','✍️',
  '🎸','🎨','🌿','💧','🔥','⚡','🌙','☀️','🏔️','🌊',
];

interface Props {
  value: string;
  onChange: (icon: string) => void;
}

export function IconPicker({ value, onChange }: Props) {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        <View style={styles.row}>
          {ICONS.map((icon) => (
            <Pressable
              key={icon}
              style={[styles.iconBtn, value === icon && styles.iconBtnActive]}
              onPress={() => onChange(icon)}
            >
              <Text style={styles.iconText}>{icon}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  scroll: {
    paddingVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  iconBtnActive: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.accent.primary + '22',
  },
  iconText: {
    fontSize: 20,
    lineHeight: 24,
  },
});
