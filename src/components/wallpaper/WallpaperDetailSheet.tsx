// src/components/wallpaper/WallpaperDetailSheet.tsx
// Bottom sheet showing wallpaper details, unlock condition, and activate button.

import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Animated as RNAnimated,
  Dimensions,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useWallpaperStore } from '@/stores/wallpaperStore';
import { useUserStore } from '@/stores/userStore';
import { colors, spacing, typography, radius } from '@/constants/theme';
import type { Wallpaper } from '@/types/wallpaper.types';

const { height: SCREEN_H } = Dimensions.get('window');

interface Props {
  wallpaper: Wallpaper;
  isActive: boolean;
  onClose: () => void;
}

const REVEAL_MODE_DESC: Record<string, string> = {
  radial:  'Reveals from the center outward in a growing circle.',
  wipe:    'Reveals from left to right like a curtain pull.',
  scatter: 'Reveals in random pixel-grid tiles seeded by today\'s date.',
};

export function WallpaperDetailSheet({ wallpaper, isActive, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const activeWallpaper = useWallpaperStore((s) => s.activeWallpaper);
  const profile = useUserStore((s) => s.userProfile);
  const slideAnim = useRef(new RNAnimated.Value(SCREEN_H)).current;

  useEffect(() => {
    RNAnimated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
    }).start();
  }, []);

  const handleActivate = () => {
    if (!wallpaper.isUnlocked) {
      Alert.alert(
        'Locked',
        `Complete the condition "${wallpaper.unlockCondition?.replace(/-/g, ' ')}" to unlock this wallpaper.`,
      );
      return;
    }
    // Set as active by updating the store
    useWallpaperStore.setState((s) => ({
      activeWallpaper: s.wallpapers.find((w) => w.id === wallpaper.id) ?? s.activeWallpaper,
    }));
    onClose();
  };

  const streakNeeded = (() => {
    if (!wallpaper.unlockCondition) return null;
    const match = wallpaper.unlockCondition.match(/(\d+)-day-streak/);
    return match ? Number(match[1]) : null;
  })();

  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose} />

      <RNAnimated.View
        style={[
          styles.sheet,
          { paddingBottom: insets.bottom + spacing.md },
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Handle */}
        <View style={styles.handle} />

        {/* Thumbnail */}
        <View style={styles.thumbnailWrapper}>
          <Image
            source={{ uri: wallpaper.sourceUri }}
            style={styles.thumbnail}
            contentFit="cover"
            transition={300}
          />
          {!wallpaper.isUnlocked && (
            <View style={styles.lockOverlay}>
              <Text style={styles.lockIcon}>⊛</Text>
            </View>
          )}
          {isActive && (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>Currently Active</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <Text style={styles.title}>{wallpaper.title}</Text>
        <Text style={styles.theme}>{wallpaper.theme}</Text>

        {/* Reveal mode */}
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>REVEAL MODE</Text>
          <Text style={styles.infoValue}>{wallpaper.revealMode}</Text>
          <Text style={styles.infoDesc}>
            {REVEAL_MODE_DESC[wallpaper.revealMode] ?? ''}
          </Text>
        </View>

        {/* Unlock condition */}
        {!wallpaper.isUnlocked && wallpaper.unlockCondition && (
          <View style={styles.lockCard}>
            <Text style={styles.lockCardLabel}>UNLOCK CONDITION</Text>
            <Text style={styles.lockCardCondition}>
              {wallpaper.unlockCondition.replace(/-/g, ' ')}
            </Text>
            {streakNeeded !== null && (
              <View style={styles.streakProgress}>
                <View
                  style={[
                    styles.streakFill,
                    {
                      width: `${Math.min(100, ((profile?.streakCount ?? 0) / streakNeeded) * 100)}%`,
                    },
                  ]}
                />
                <Text style={styles.streakProgressLabel}>
                  {profile?.streakCount ?? 0} / {streakNeeded} days
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Close</Text>
          </Pressable>
          {!isActive && (
            <Pressable
              style={[styles.activateBtn, !wallpaper.isUnlocked && styles.activateBtnLocked]}
              onPress={handleActivate}
            >
              <Text style={styles.activateBtnText}>
                {wallpaper.isUnlocked ? 'Set Active' : 'Locked'}
              </Text>
            </Pressable>
          )}
        </View>
      </RNAnimated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
  thumbnailWrapper: {
    height: 180,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIcon: { fontSize: 40, color: colors.text.secondary },
  activeBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  activeBadgeText: {
    fontSize: typography.sizes.xs,
    color: colors.bg.primary,
    fontWeight: typography.weights.bold,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  theme: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: 2,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoCard: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: 4,
  },
  infoLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
    letterSpacing: 1.5,
    fontWeight: typography.weights.semibold,
  },
  infoValue: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    textTransform: 'capitalize',
  },
  infoDesc: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  lockCard: {
    backgroundColor: colors.accent.warning + '11',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accent.warning + '44',
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  lockCardLabel: {
    fontSize: typography.sizes.xs,
    color: colors.accent.warning,
    letterSpacing: 1.5,
    fontWeight: typography.weights.semibold,
  },
  lockCardCondition: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    textTransform: 'capitalize',
  },
  streakProgress: {
    height: 6,
    backgroundColor: colors.bg.secondary,
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  streakFill: {
    height: '100%',
    backgroundColor: colors.accent.warning,
    borderRadius: 3,
  },
  streakProgressLabel: {
    fontSize: typography.sizes.xs,
    color: colors.accent.warning,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  closeBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
  activateBtn: {
    flex: 2,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
  },
  activateBtnLocked: {
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activateBtnText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.bg.primary,
  },
});
