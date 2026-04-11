import { ImageFormat, Skia } from '@shopify/react-native-skia';
import * as FileSystem from 'expo-file-system/legacy';

import { ImageCompositor } from '@/engine/ImageCompositor';
import type { Result } from '@/types/result.types';
import { err, ok } from '@/types/result.types';
import type { Wallpaper } from '@/types/wallpaper.types';

export interface RenderJob {
  wallpaper: Wallpaper;
  completionPct: number;
  outputSize: { width: number; height: number };
}

const MAX_RENDER_MS = 300;

const getWallpaperCacheDir = (): string => {
  if (!FileSystem.cacheDirectory) {
    throw new Error('FileSystem.cacheDirectory is unavailable.');
  }
  return `${FileSystem.cacheDirectory}wallpapers/`;
};

const getLocalDateKey = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const deletePreviousRendersForDate = async (dateKey: string): Promise<void> => {
  const cacheDir = getWallpaperCacheDir();
  await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
  const entries = await FileSystem.readDirectoryAsync(cacheDir);
  const filenames = entries.filter(
    (name) => name.startsWith(`${dateKey}-`) && name.toLowerCase().endsWith('.png'),
  );

  await Promise.all(
    filenames.map((filename) =>
      FileSystem.deleteAsync(`${cacheDir}${filename}`, { idempotent: true }),
    ),
  );
};

const readImageFromUri = async (sourceUri: string) => {
  const data = await Skia.Data.fromURI(sourceUri);
  return Skia.Image.MakeImageFromEncoded(data);
};

const getRenderSize = (job: RenderJob, sourceWidth: number, sourceHeight: number) => ({
  width: Math.max(1, Math.floor(Math.min(job.outputSize.width, sourceWidth))),
  height: Math.max(1, Math.floor(Math.min(job.outputSize.height, sourceHeight))),
});

export const WallpaperRenderer = {
  async render(job: RenderJob): Promise<Result<{ uri: string }, Error>> {
    const startMs = globalThis.performance?.now?.() ?? Date.now();

    try {
      const sourceImage = await readImageFromUri(job.wallpaper.sourceUri);
      if (!sourceImage) {
        return err(new Error('Failed to decode wallpaper source image.'));
      }

      const sourceBase64 = sourceImage.encodeToBase64(ImageFormat.PNG);
      const size = getRenderSize(job, sourceImage.width(), sourceImage.height());
      const dateKey = getLocalDateKey();
      const pct = Math.round(Math.max(0, Math.min(100, job.completionPct)));
      const compositeResult = ImageCompositor.composite({
        sourceBase64,
        revealMode: job.wallpaper.revealMode,
        pct,
        width: size.width,
        height: size.height,
        seedDate: dateKey,
      });

      if (!compositeResult.ok) {
        return err(compositeResult.error);
      }

      await deletePreviousRendersForDate(dateKey);

      const outputUri = `${getWallpaperCacheDir()}${dateKey}-${pct}.png`;
      await FileSystem.writeAsStringAsync(outputUri, compositeResult.data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const endMs = globalThis.performance?.now?.() ?? Date.now();
      const durationMs = endMs - startMs;
      if (__DEV__ && durationMs > MAX_RENDER_MS) {
        console.warn(
          `[WallpaperRenderer] render exceeded budget: ${durationMs.toFixed(1)}ms (budget ${MAX_RENDER_MS}ms)`,
        );
      }

      return ok({ uri: outputUri });
    } catch (cause) {
      return err(cause instanceof Error ? cause : new Error('Wallpaper render failed.'));
    }
  },
};
