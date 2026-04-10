import type { RoundedRect, Size } from './layout';

export interface SourceRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export interface CoverSourceRectOptions {
  verticalAlign?: number;
}

export function getCoverSourceRect(
  image: Size,
  target: Size,
  options: CoverSourceRectOptions = {}
): SourceRect {
  const targetAspect = target.width / target.height;
  const imageAspect = image.width / image.height;
  const verticalAlign = options.verticalAlign ?? 0.5;

  if (imageAspect > targetAspect) {
    const sh = image.height;
    const sw = image.height * targetAspect;
    return {
      sx: (image.width - sw) / 2,
      sy: 0,
      sw,
      sh,
    };
  }

  const sw = image.width;
  const sh = image.width / targetAspect;
  return {
    sx: 0,
    sy: (image.height - sh) * verticalAlign,
    sw,
    sh,
  };
}

export function clipRoundedRect(
  ctx: Pick<CanvasRenderingContext2D, 'beginPath' | 'roundRect' | 'clip'>,
  rect: RoundedRect
) {
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.width, rect.height, rect.cornerRadius);
  ctx.clip();
}
