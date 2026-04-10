import { describe, expect, it, vi } from 'vitest';

import { getScreenArea } from './layout';
import { clipRoundedRect, getCoverSourceRect } from './rendering';

describe('getCoverSourceRect', () => {
  it('crops horizontally for images that are wider than the target', () => {
    const rect = getCoverSourceRect({ width: 2400, height: 1200 }, { width: 300, height: 600 });

    expect(rect).toEqual({
      sx: 900,
      sy: 0,
      sw: 600,
      sh: 1200,
    });
  });

  it('crops vertically for images that are taller than the target', () => {
    const rect = getCoverSourceRect({ width: 1200, height: 2400 }, { width: 600, height: 300 });

    expect(rect).toEqual({
      sx: 0,
      sy: 900,
      sw: 1200,
      sh: 600,
    });
  });

  it('supports top-biased vertical cropping for tall images', () => {
    const rect = getCoverSourceRect(
      { width: 1200, height: 2400 },
      { width: 600, height: 300 },
      { verticalAlign: 0.3 }
    );

    expect(rect).toEqual({
      sx: 0,
      sy: 540,
      sw: 1200,
      sh: 600,
    });
  });

  it('keeps top crop shallow for App Store sized screenshots so the status bar sits lower', () => {
    const screenRect = getScreenArea({ x: 0, y: 0 }, 1);
    const rect = getCoverSourceRect(
      { width: 1242, height: 2688 },
      screenRect,
      { verticalAlign: 0.3 }
    );

    expect(rect.sx).toBe(0);
    expect(rect.sw).toBe(1242);
    expect(rect.sy).toBeLessThan(30);
  });
});

describe('clipRoundedRect', () => {
  it('clips the canvas with a rounded screen mask', () => {
    const ctx = {
      beginPath: vi.fn(),
      roundRect: vi.fn(),
      clip: vi.fn(),
    };

    clipRoundedRect(ctx, {
      x: 10,
      y: 20,
      width: 100,
      height: 200,
      cornerRadius: 24,
    });

    expect(ctx.beginPath).toHaveBeenCalledTimes(1);
    expect(ctx.roundRect).toHaveBeenCalledWith(10, 20, 100, 200, 24);
    expect(ctx.clip).toHaveBeenCalledTimes(1);
  });
});
