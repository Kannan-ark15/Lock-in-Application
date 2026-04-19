// src/components/tasks/AddTaskSheet.tsx
// Modal bottom sheet for creating a new task.

import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated as RNAnimated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTaskStore } from '@/stores/taskStore';
import { colors, spacing, typography, radius } from '@/constants/theme';
import { PrioritySelector } from '@/components/tasks/PrioritySelector';
import { IconPicker } from '@/components/tasks/IconPicker';
import type { TaskPriority } from '@/types/task.types';

const { height: SCREEN_H } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function AddTaskSheet({ visible, onClose }: Props) {
  const insets  = useSafeAreaInsets();
  const addTask = useTaskStore((s) => s.addTask);

  const [title,    setTitle]    = useState('');
  const [icon,     setIcon]     = useState('○');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [recurring, setRecurring] = useState(true);

  const slideAnim = useRef(new RNAnimated.Value(SCREEN_H)).current;

  useEffect(() => {
    if (visible) {
      RNAnimated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start();
    } else {
      RNAnimated.timing(slideAnim, {
        toValue: SCREEN_H,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleAdd = () => {
    if (!title.trim()) return;
    addTask({
      title: title.trim(),
      icon,
      priority,
      isRecurring: recurring,
      archivedAt: null,
    });
    setTitle('');
    setIcon('○');
    setPriority('medium');
    setRecurring(true);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kvWrapper}
        pointerEvents="box-none"
      >
        <RNAnimated.View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + spacing.md },
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Handle */}
          <View style={styles.handle} />

          <Text style={styles.sheetTitle}>New Task</Text>

          <ScrollView
            contentContainerStyle={styles.form}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Icon picker */}
            <Text style={styles.fieldLabel}>ICON</Text>
            <IconPicker value={icon} onChange={setIcon} />

            {/* Title */}
            <Text style={styles.fieldLabel}>TITLE</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Morning workout"
              placeholderTextColor={colors.text.tertiary}
              autoFocus
              maxLength={60}
              returnKeyType="done"
              onSubmitEditing={handleAdd}
            />

            {/* Priority */}
            <Text style={styles.fieldLabel}>PRIORITY</Text>
            <PrioritySelector value={priority} onChange={setPriority} />

            {/* Recurring */}
            <Text style={styles.fieldLabel}>RECURRING</Text>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleDesc}>Repeat every day</Text>
              <Pressable
                style={[styles.toggle, recurring && styles.toggleOn]}
                onPress={() => setRecurring((v) => !v)}
              >
                <Text style={[styles.toggleText, recurring && styles.toggleTextOn]}>
                  {recurring ? 'On' : 'Off'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.addBtn, !title.trim() && styles.addBtnDisabled]}
              onPress={handleAdd}
              disabled={!title.trim()}
            >
              <Text style={styles.addBtnText}>Add Task</Text>
            </Pressable>
          </View>
        </RNAnimated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  kvWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bg.secondary,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderColor: colors.border,
    maxHeight: SCREEN_H * 0.85,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  sheetTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  form: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
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
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  cancelBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
  addBtn: {
    flex: 2,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
  },
  addBtnDisabled: {
    opacity: 0.4,
  },
  addBtnText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.bg.primary,
  },
});
