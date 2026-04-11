import {
  BlendMode,
  ImageFormat,
  Skia,
} from '@shopify/react-native-skia';
import { executeOnUIRuntimeSync } from 'react-native-reanimated';

import { MaskGenerator } from '@/engine/MaskGenerator';
import type { RevealMode } from '@/types/wallpaper.types';
import type { Result } from '@/types/result.types';
import { err, ok } from '@/types/result.types';

interface CompositeInput {
  sourceBase64: string;
  revealMode: RevealMode;
  pct: number;
  width: number;
  height: number;
  seedDate: string;
}

const GRAYSCALE_MATRIX = [
  0.2126, 0.7152, 0.0722, 0, 0,
  0.2126, 0.7152, 0.0722, 0, 0,
  0.2126, 0.7152, 0.0722, 0, 0,
  0, 0, 0, 1, 0,
];

const compositeOnUI = executeOnUIRuntimeSync((input: CompositeInput): string | null => {
  'worklet';

  const sourceData = Skia.Data.fromBase64(input.sourceBase64);
  const sourceImage = Skia.Image.MakeImageFromEncoded(sourceData);
  if (!sourceImage) {
    return null;
  }

  const surface = Skia.Surface.MakeOffscreen(input.width, input.height);
  if (!surface) {
    return null;
  }

  const canvas = surface.getCanvas();
  canvas.clear(Skia.Color('black'));

  const srcRect = Skia.XYWHRect(0, 0, sourceImage.width(), sourceImage.height());
  const dstRect = Skia.XYWHRect(0, 0, input.width, input.height);
  const maskPath = MaskGenerator.generate(input.revealMode, input.pct, {
    width: input.width,
    height: input.height,
    seedDate: input.seedDate,
  });

  const grayscalePaint = Skia.Paint();
  grayscalePaint.setAntiAlias(true);
  grayscalePaint.setColorFilter(Skia.ColorFilter.MakeMatrix(GRAYSCALE_MATRIX));
  canvas.drawImageRect(sourceImage, srcRect, dstRect, grayscalePaint);

  canvas.saveLayer();

  const maskPaint = Skia.Paint();
  maskPaint.setAntiAlias(true);
  maskPaint.setColor(Skia.Color('white'));
  canvas.drawPath(maskPath, maskPaint);

  const colorPaint = Skia.Paint();
  colorPaint.setAntiAlias(true);
  colorPaint.setBlendMode(BlendMode.SrcIn);
  canvas.drawImageRect(sourceImage, srcRect, dstRect, colorPaint);

  canvas.restore();
  surface.flush();

  const outputImage = surface.makeImageSnapshot();
  return outputImage.encodeToBase64(ImageFormat.PNG);
});

export const ImageCompositor = {
  composite(input: CompositeInput): Result<string, Error> {
    try {
      const base64 = compositeOnUI(input);
      if (!base64) {
        return err(new Error('Image composition failed.'));
      }

      return ok(base64);
    } catch (cause) {
      return err(cause instanceof Error ? cause : new Error('Image composition failed.'));
    }
  },
};
