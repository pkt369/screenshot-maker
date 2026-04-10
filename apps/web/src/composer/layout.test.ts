import { describe, expect, it } from 'vitest';

import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  getFramePosition,
  getMockupPosition,
  getScreenArea,
} from './layout';

describe('getMockupPosition', () => {
  it('centers the mockup with balanced left/right and top/bottom margins', () => {
    const mockupSize = {
      width: 728,
      height: 1478,
    };

    const position = getMockupPosition(mockupSize);

    expect(position.x).toBe(Math.round((CANVAS_WIDTH - mockupSize.width) / 2));
    expect(position.y).toBe(Math.round((CANVAS_HEIGHT - mockupSize.height) / 2));
  });
});

describe('frame and screen geometry', () => {
  it('uses the same origin for frame and dynamic layers', () => {
    const position = getFramePosition({ x: 120, y: 240 }, 1);

    expect(position).toEqual({ x: 120, y: 240 });
  });

  it('maps the display opening close to the visible frame edges', () => {
    const rect = getScreenArea({ x: 100, y: 200 }, 1);

    expect(rect).toEqual({
      x: 134,
      y: 234,
      width: 762,
      height: 1618,
      cornerRadius: 148,
    });
  });
});
