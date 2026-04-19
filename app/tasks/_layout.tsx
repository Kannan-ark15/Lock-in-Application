// app/tasks/_layout.tsx
// Nested stack for task editing screens, pushed from the Tasks tab.

import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

export default function TasksStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg.primary },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="edit" />
    </Stack>
  );
}
