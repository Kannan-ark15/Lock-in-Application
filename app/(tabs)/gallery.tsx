// app/(tabs)/gallery.tsx
// Gallery — browse, preview, and activate wallpapers. Locked ones show unlock conditions.

import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';

import { useWallpaperStore } from '@/stores/wallpaperStore';
import { useUserStore } from '@/stores/userStore';
import { colors, spacing, typography, radius } from '@/constants/theme';
import { WallpaperTile } from '@/components/wallpaper/WallpaperTile';
import { WallpaperDetailSheet } from '@/components/wallpaper/WallpaperDetailSheet';
import type { Wallpaper } from '@/types/wallpaper.types';

const { width: SCREEN_W } = Dimensions.get('window');
const TILE_GAP = spacing.sm;
const TILE_W   = (SCREEN_W - spacing.lg * 2 - TILE_GAP) / 2;

export default function GalleryScreen() {
  const insets    = useSafeAreaInsets();
  const [selected, setSelected] = useState<Wallpaper | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const wallpapers     = useWallpaperStore((s) => s.wallpapers);
  const activeWallpaper = useWallpaperStore((s) => s.activeWallpaper);
  const profile        = useUserStore((s) => s.userProfile);

  const unlockedCount = wallpapers.filter((w) => w.isUnlocked).length;
  const totalCount    = wallpapers.length;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
  }, []);

  const renderItem = useCallback(({ item, index }: { item: Wallpaper; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 40).springify()}>
      <WallpaperTile
        wallpaper={item}
        isActive={activeWallpaper?.id === item.id}
        tileWidth={TILE_W}
        onPress={() => setSelected(item)}
      />
    </Animated.View>
  ), [activeWallpaper]);

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View>
          <Text style={styles.title}>Gallery</Text>
          <Text style={styles.subtitle}>
            {unlockedCount}/{totalCount} unlocked
          </Text>
        </View>
        {/* Streak progress toward next unlock */}
        <View style={styles.streakHint}>
          <Text style={styles.streakHintIcon}>◈</Text>
          <Text style={styles.streakHintText}>
            {profile?.streakCount ?? 0} day streak
          </Text>
        </View>
      </View>

      {/* Wallpaper grid */}
      {wallpapers.length === 0 ? (
        <Animated.View entering={FadeIn.delay(200)} style={styles.emptyState}>
          <Text style={styles.emptyIcon}>◇</Text>
          <Text style={styles.emptyTitle}>No wallpapers yet</Text>
          <Text style={styles.emptyText}>
            Wallpapers will appear here as they are seeded into the database.
          </Text>
        </Animated.View>
      ) : (
        <FlatList
          data={wallpapers}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.accent.primary]}
            />
          }
        />
      )}

      {/* Detail sheet */}
      {selected && (
        <WallpaperDetailSheet
          wallpaper={selected}
          isActive={activeWallpaper?.id === selected.id}
          onClose={() => setSelected(null)}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  streakHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bg.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  streakHintIcon: { fontSize: 14, color: colors.accent.warning },
  streakHintText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
  grid: {
    padding: spacing.lg,
    gap: TILE_GAP,
  },
  row: { gap: TILE_GAP },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: { fontSize: 48, color: colors.text.tertiary },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  emptyText: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
