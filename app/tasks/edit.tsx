// app/tasks/edit.tsx
// Edit task screen — nested stack under tasks tab.

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTaskStore } from '@/stores/taskStore';
import { colors, spacing, typography, radius } from '@/constants/theme';
import { PrioritySelector } from '@/components/tasks/PrioritySelector';
import { IconPicker } from '@/components/tasks/IconPicker';
import type { Task, TaskPriority } from '@/types/task.types';

export default function EditTaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const insets  = useSafeAreaInsets();

  const tasks      = useTaskStore((s) => s.tasks);
  const updateTask = useTaskStore((s) => s.updateTask);
  const archiveTask = useTaskStore((s) => s.archiveTask);

  const task = tasks.find((t) => t.id === id);

  const [title,    setTitle]    = useState(task?.title    ?? '');
  const [icon,     setIcon]     = useState(task?.icon     ?? '○');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'medium');
  const [recurring, setRecurring] = useState(task?.isRecurring ?? true);

  useEffect(() => {
    if (!task) router.back();
  }, [task]);

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Title required', 'Please enter a task title.');
      return;
    }
    updateTask(id!, { title: title.trim(), icon, priority, isRecurring: recurring });
    router.back();
  };

  const handleArchive = () => {
    Alert.alert('Archive task?', 'This will remove the task from future days.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: () => { archiveTask(id!); router.back(); },
      },
    ]);
  };

  if (!task) return null;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Edit Task</Text>
        <Pressable onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Icon picker */}
        <Text style={styles.fieldLabel}>ICON</Text>
        <IconPicker value={icon} onChange={setIcon} />

        {/* Title input */}
        <Text style={styles.fieldLabel}>TITLE</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Task title…"
          placeholderTextColor={colors.text.tertiary}
          maxLength={60}
          returnKeyType="done"
        />

        {/* Priority */}
        <Text style={styles.fieldLabel}>PRIORITY</Text>
        <PrioritySelector value={priority} onChange={setPriority} />

        {/* Recurring toggle */}
        <Text style={styles.fieldLabel}>RECURRING</Text>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleDesc}>Include in every day's task list</Text>
          <Pressable
            style={[styles.toggle, recurring && styles.toggleOn]}
            onPress={() => setRecurring(!recurring)}
          >
            <Text style={[styles.toggleText, recurring && styles.toggleTextOn]}>
              {recurring ? 'On' : 'Off'}
            </Text>
          </Pressable>
        </View>

        {/* Archive action */}
        <Pressable style={styles.archiveButton} onPress={handleArchive}>
          <Text style={styles.archiveText}>Archive task</Text>
        </Pressable>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg.primary },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: { padding: spacing.xs },
  backIcon: { fontSize: 24, color: colors.text.primary },
  headerTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  saveButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  saveButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.bg.primary,
  },
  scroll: { flex: 1 },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  fieldLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text.tertiary,
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    fontSize: typography.sizes.base,
    color: colors.text.primary,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  toggleDesc: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    flex: 1,
  },
  toggle: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.bg.secondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleOn: {
    backgroundColor: colors.accent.primary + '22',
    borderColor: colors.accent.primary,
  },
  toggleText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
  },
  toggleTextOn: { color: colors.accent.primary },
  archiveButton: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accent.danger + '66',
    alignItems: 'center',
  },
  archiveText: {
    fontSize: typography.sizes.base,
    color: colors.accent.danger,
    fontWeight: typography.weights.medium,
  },
});
