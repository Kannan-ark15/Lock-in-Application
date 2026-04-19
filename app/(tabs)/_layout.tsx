// app/(tabs)/_layout.tsx
// Bottom tab navigator — Today / Tasks / Gallery / Settings

import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

import { colors, spacing, typography } from '@/constants/theme';

// ─── Icons (inline SVG-style via Text for zero-dep) ─────────────────────────

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  index:    { active: '◉', inactive: '○' },
  tasks:    { active: '▣', inactive: '□' },
  gallery:  { active: '◈', inactive: '◇' },
  settings: { active: '⊛', inactive: '⊙' },
};

const TAB_LABELS: Record<string, string> = {
  index:    'Today',
  tasks:    'Tasks',
  gallery:  'Gallery',
  settings: 'Settings',
};

// ─── Animated Tab Item ───────────────────────────────────────────────────────

function TabItem({
  routeName,
  isFocused,
  onPress,
}: {
  routeName: string;
  isFocused: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(isFocused ? 1 : 0.45);

  useEffect(() => {
    scale.value = withSpring(isFocused ? 1.12 : 1, { damping: 14, stiffness: 220 });
    opacity.value = withTiming(isFocused ? 1 : 0.45, { duration: 180 });
  }, [isFocused]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const icons = TAB_ICONS[routeName] ?? TAB_ICONS['index'];
  const label = TAB_LABELS[routeName] ?? routeName;

  return (
    <Pressable
      onPress={onPress}
      style={styles.tabItem}
      android_ripple={{ color: 'transparent' }}
    >
      <Animated.View style={[styles.tabInner, animStyle]}>
        <Text style={[styles.tabIcon, isFocused && styles.tabIconActive]}>
          {isFocused ? icons.active : icons.inactive}
        </Text>
        <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
          {label}
        </Text>
        {isFocused && <View style={styles.tabDot} />}
      </Animated.View>
    </Pressable>
  );
}

// ─── Custom Tab Bar ──────────────────────────────────────────────────────────

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom + 4 }]}>
      <View style={styles.tabBarInner}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabItem
              key={route.key}
              routeName={route.name}
              isFocused={isFocused}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
}

// ─── Layout ──────────────────────────────────────────────────────────────────

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="tasks" />
      <Tabs.Screen name="gallery" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.bg.secondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  tabBarInner: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  tabInner: {
    alignItems: 'center',
    gap: 2,
    minHeight: 44,
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 18,
    color: colors.text.tertiary,
  },
  tabIconActive: {
    color: colors.accent.primary,
  },
  tabLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
    letterSpacing: 0.5,
    fontWeight: typography.weights.medium,
  },
  tabLabelActive: {
    color: colors.accent.primary,
  },
  tabDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent.primary,
    marginTop: 1,
  },
});
