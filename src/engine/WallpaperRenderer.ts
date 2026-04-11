import type { Wallpaper } from '@/types/wallpaper.types';
import type { Result } from '@/types/result.types';
import { ok } from '@/types/result.types';

export interface RenderJob {
  wallpaper: Wallpaper;
  completionPct: number;
  outputSize: { width: number; height: number };
}

export const WallpaperRenderer = {
  async render(_job: RenderJob): Promise<Result<{ uri: string }, Error>> {
    // Stage 4 will replace this stub with the Skia rendering pipeline.
    return ok({ uri: '' });
  },
};
