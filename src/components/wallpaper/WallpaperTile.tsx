// src/components/wallpaper/WallpaperTile.tsx

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';

import { colors, spacing, typography, radius } from '@/constants/theme';
import type { Wallpaper } from '@/types/wallpaper.types';

interface Props {
  wallpaper: Wallpaper;
  isActive: boolean;
  tileWidth: number;
  onPress: () => void;
}

export function WallpaperTile({ wallpaper, isActive, tileWidth, onPress }: Props) {
  const locked = !wallpaper.isUnlocked;
  const tileH  = tileWidth * 1.6;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.tile,
        { width: tileWidth, height: tileH },
        isActive && styles.tileActive,
      ]}
      android_ripple={{ color: colors.accent.primary + '33' }}
    >
      {/* Wallpaper image */}
      <Image
        source={{ uri: wallpaper.sourceUri }}
        style={[styles.image, locked && styles.imageLocked]}
        contentFit="cover"
        transition={300}
      />

      {/* Lock overlay */}
      {locked && (
        <View style={styles.lockOverlay}>
          <Text style={styles.lockIcon}>⊛</Text>
          <Text style={styles.lockCondition} numberOfLines={2}>
            {wallpaper.unlockCondition?.replace(/-/g, ' ') ?? 'Locked'}
          </Text>
        </View>
      )}

      {/* Active badge */}
      {isActive && (
        <View style={styles.activeBadge}>
          <Text style={styles.activeBadgeText}>Active</Text>
        </View>
      )}

      {/* Info bar */}
      <View style={styles.infoBar}>
        <Text style={styles.tileTitle} numberOfLines={1}>{wallpaper.title}</Text>
        <Text style={styles.tileMode}>{wallpaper.revealMode}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.bg.card,
  },
  tileActive: {
    borderColor: colors.accent.primary,
  },
  image: {
    flex: 1,
  },
  imageLocked: {
    opacity: 0.35,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingBottom: 40,
  },
  lockIcon: {
    fontSize: 28,
    color: colors.text.secondary,
  },
  lockCondition: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    textAlign: 'center',
    letterSpacing: 0.3,
    lineHeight: 16,
  },
  activeBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  activeBadgeText: {
    fontSize: typography.sizes.xs,
    color: colors.bg.primary,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
  },
  infoBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tileTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    flex: 1,
  },
  tileMode: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 4,
  },
});
