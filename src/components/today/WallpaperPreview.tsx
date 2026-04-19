// src/components/today/WallpaperPreview.tsx
// Shows a small thumbnail of today's wallpaper with reveal progress overlay.

import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Image } from 'expo-image';

import { colors, spacing, typography, radius } from '@/constants/theme';
import type { Wallpaper } from '@/types/wallpaper.types';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W - spacing.lg * 2;
const CARD_H = CARD_W * 0.55;

interface Props {
  wallpaper: Wallpaper;
  completionPct: number;
  renderedUri: string | null;
}

function pctToLabel(pct: number): string {
  if (pct === 0)   return 'Complete tasks to reveal';
  if (pct < 50)    return 'Keep going…';
  if (pct < 100)   return 'Almost revealed!';
  return 'Fully revealed ✓';
}

export function WallpaperPreview({ wallpaper, completionPct, renderedUri }: Props) {
  const displayUri = renderedUri ?? wallpaper.sourceUri;

  return (
    <View style={styles.card}>
      {/* Image */}
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: displayUri }}
          style={styles.image}
          contentFit="cover"
          transition={400}
        />
        {/* Reveal progress bar overlay */}
        <View style={styles.progressOverlay}>
          <View style={[styles.progressFill, { width: `${completionPct}%` }]} />
        </View>
        {/* Mode badge */}
        <View style={styles.modeBadge}>
          <Text style={styles.modeBadgeText}>{wallpaper.revealMode}</Text>
        </View>
      </View>

      {/* Info row */}
      <View style={styles.infoRow}>
        <View>
          <Text style={styles.wallpaperTitle} numberOfLines={1}>{wallpaper.title}</Text>
          <Text style={styles.wallpaperHint}>{pctToLabel(completionPct)}</Text>
        </View>
        <Text style={styles.pctBadge}>{Math.round(completionPct)}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  imageWrapper: {
    width: CARD_W,
    height: CARD_H,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  progressOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent.primary,
  },
  modeBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  modeBadgeText: {
    fontSize: typography.sizes.xs,
    color: colors.text.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  wallpaperTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  wallpaperHint: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  pctBadge: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.accent.primary,
    letterSpacing: -1,
  },
});
