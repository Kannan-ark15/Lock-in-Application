import { Skia } from '@shopify/react-native-skia';

import type { RevealMode } from '@/types/wallpaper.types';

interface MaskGeneratorOptions {
  width: number;
  height: number;
  seedDate?: string;
  scatterColumns?: number;
  scatterRows?: number;
}

const DEFAULT_SCATTER_COLUMNS = 12;
const DEFAULT_SCATTER_ROWS = 20;
const DEFAULT_WIDTH = 1080;
const DEFAULT_HEIGHT = 2400;

const clampPct = (pct: number): number => {
  'worklet';
  if (pct < 0) {
    return 0;
  }
  if (pct > 100) {
    return 100;
  }
  return pct;
};

const getSeedDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const hashSeed = (seed: string): number => {
  'worklet';
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const seededRandomFactory = (seed: number): (() => number) => {
  'worklet';
  let value = seed || 1;
  return () => {
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    return (value >>> 0) / 4294967296;
  };
};

const shuffle = (items: number[], rng: () => number): number[] => {
  'worklet';
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    const temp = items[index];
    items[index] = items[swapIndex];
    items[swapIndex] = temp;
  }
  return items;
};

const generateRadialMask = (pct: number, width: number, height: number) => {
  'worklet';
  const clampedPct = clampPct(pct);
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);
  const radius = (clampedPct / 100) * maxRadius;
  return Skia.Path.Circle(centerX, centerY, radius);
};

const generateWipeMask = (pct: number, width: number, height: number) => {
  'worklet';
  const clampedPct = clampPct(pct);
  const revealWidth = (clampedPct / 100) * width;
  return Skia.Path.Rect(Skia.XYWHRect(0, 0, revealWidth, height));
};

const generateScatterMask = (
  pct: number,
  width: number,
  height: number,
  seedDate: string,
  columns: number,
  rows: number,
) => {
  'worklet';
  const clampedPct = clampPct(pct);
  const columnCount = Math.max(1, Math.floor(columns));
  const rowCount = Math.max(1, Math.floor(rows));
  const cellCount = columnCount * rowCount;
  const revealCount = Math.floor((clampedPct / 100) * cellCount);
  const cellWidth = width / columnCount;
  const cellHeight = height / rowCount;

  const indices = Array.from({ length: cellCount }, (_, index) => index);
  const rng = seededRandomFactory(hashSeed(seedDate));
  const orderedIndices = shuffle(indices, rng);
  const path = Skia.Path.Make();

  for (let index = 0; index < revealCount; index += 1) {
    const flatIndex = orderedIndices[index];
    const row = Math.floor(flatIndex / columnCount);
    const column = flatIndex % columnCount;
    path.addRect(
      Skia.XYWHRect(
        column * cellWidth,
        row * cellHeight,
        cellWidth + 0.5,
        cellHeight + 0.5,
      ),
    );
  }

  return path;
};

export const MaskGenerator = {
  generate(revealMode: RevealMode, pct: number, options?: Partial<MaskGeneratorOptions>) {
    'worklet';
    const width = options?.width ?? DEFAULT_WIDTH;
    const height = options?.height ?? DEFAULT_HEIGHT;
    const seedDate = options?.seedDate ?? getSeedDate();
    const scatterColumns = options?.scatterColumns ?? DEFAULT_SCATTER_COLUMNS;
    const scatterRows = options?.scatterRows ?? DEFAULT_SCATTER_ROWS;

    if (revealMode === 'radial') {
      return generateRadialMask(pct, width, height);
    }

    if (revealMode === 'wipe') {
      return generateWipeMask(pct, width, height);
    }

    return generateScatterMask(pct, width, height, seedDate, scatterColumns, scatterRows);
  },
};
