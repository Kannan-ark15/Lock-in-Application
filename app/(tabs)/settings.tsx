// app/(tabs)/settings.tsx
// Settings — reveal mode, sound, haptics, daily reminder, stats.

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useUserStore } from '@/stores/userStore';
import { NotificationService } from '@/services/NotificationService';
import { colors, spacing, typography, radius } from '@/constants/theme';
import { RevealModePicker } from '@/components/settings/RevealModePicker';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { StatsCard } from '@/components/settings/StatsCard';
import type { RevealMode } from '@/types/wallpaper.types';

export default function SettingsScreen() {
  const insets  = useSafeAreaInsets();
  const profile = useUserStore((s) => s.userProfile);
  const updateRevealMode    = useUserStore((s) => s.updateRevealMode);
  const updateSoundEnabled  = useUserStore((s) => s.updateSoundEnabled);
  const updateHapticEnabled = useUserStore((s) => s.updateHapticEnabled);

  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime]       = useState(() => {
    const d = new Date();
    d.setHours(20, 0, 0, 0);
    return d;
  });
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleReminderToggle = async (enabled: boolean) => {
    if (enabled) {
      const result = await NotificationService.scheduleDailyReminder(reminderTime);
      if (result.ok) {
        setReminderEnabled(true);
      } else {
        Alert.alert(
          'Permission required',
          'Please allow notifications in your device settings to use reminders.',
        );
      }
    } else {
      await NotificationService.cancelReminder();
      setReminderEnabled(false);
    }
  };

  const handleTimeChange = async (_: unknown, selected?: Date) => {
    setShowTimePicker(false);
    if (!selected) return;
    setReminderTime(selected);
    if (reminderEnabled) {
      await NotificationService.scheduleDailyReminder(selected);
    }
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <Animated.View entering={FadeInDown.delay(0).springify()}>
          <StatsCard
            streakCount={profile?.streakCount ?? 0}
            longestStreak={profile?.longestStreak ?? 0}
            lastCompletionDate={profile?.lastFullCompletionDate ?? null}
          />
        </Animated.View>

        {/* Reveal mode */}
        <Animated.View entering={FadeInDown.delay(80).springify()}>
          <Text style={styles.sectionLabel}>WALLPAPER REVEAL MODE</Text>
          <View style={styles.card}>
            <RevealModePicker
              value={profile?.preferredRevealMode ?? 'radial'}
              onChange={(mode: RevealMode) => updateRevealMode(mode)}
            />
          </View>
        </Animated.View>

        {/* Notifications */}
        <Animated.View entering={FadeInDown.delay(140).springify()}>
          <Text style={styles.sectionLabel}>DAILY REMINDER</Text>
          <View style={styles.card}>
            <SettingsRow
              label="Enable reminder"
              description="Get notified if you haven't completed tasks"
              right={
                <Switch
                  value={reminderEnabled}
                  onValueChange={handleReminderToggle}
                  trackColor={{ false: colors.bg.secondary, true: colors.accent.primary }}
                  thumbColor={colors.text.primary}
                />
              }
            />
            {reminderEnabled && (
              <>
                <View style={styles.divider} />
                <Pressable onPress={() => setShowTimePicker(true)}>
                  <SettingsRow
                    label="Reminder time"
                    description="Tap to change"
                    right={
                      <Text style={styles.timeText}>{formatTime(reminderTime)}</Text>
                    }
                  />
                </Pressable>
              </>
            )}
          </View>
        </Animated.View>

        {/* Feedback */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Text style={styles.sectionLabel}>FEEDBACK</Text>
          <View style={styles.card}>
            <SettingsRow
              label="Haptic feedback"
              description="Vibrate on task completion"
              right={
                <Switch
                  value={profile?.hapticEnabled ?? true}
                  onValueChange={updateHapticEnabled}
                  trackColor={{ false: colors.bg.secondary, true: colors.accent.primary }}
                  thumbColor={colors.text.primary}
                />
              }
            />
            <View style={styles.divider} />
            <SettingsRow
              label="Sound effects"
              description="Play sound on completion"
              right={
                <Switch
                  value={profile?.soundEnabled ?? true}
                  onValueChange={updateSoundEnabled}
                  trackColor={{ false: colors.bg.secondary, true: colors.accent.primary }}
                  thumbColor={colors.text.primary}
                />
              }
            />
          </View>
        </Animated.View>

        {/* About */}
        <Animated.View entering={FadeInDown.delay(260).springify()}>
          <Text style={styles.sectionLabel}>ABOUT</Text>
          <View style={styles.card}>
            <SettingsRow label="Version" right={<Text style={styles.metaText}>1.0.0</Text>} />
            <View style={styles.divider} />
            <SettingsRow label="Platform" right={<Text style={styles.metaText}>Android</Text>} />
          </View>
        </Animated.View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {/* Android time picker */}
      {showTimePicker && (
        <DateTimePicker
          value={reminderTime}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg.primary },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },
  sectionLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text.tertiary,
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  card: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  timeText: {
    fontSize: typography.sizes.base,
    color: colors.accent.primary,
    fontWeight: typography.weights.semibold,
    fontVariant: ['tabular-nums'],
  },
  metaText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
});
