import { describe, expect, it } from 'vitest';

import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  getFramePosition,
  getMockupPosition,
  getScreenArea,
} from './layout';

describe('getMockupPosition', () => {
  it('centers the mockup horizontally and pushes it toward the bottom', () => {
    const mockupSize = {
      width: 728,
      height: 1478,
    };

    const position = getMockupPosition(mockupSize);
    const verticalSpace = CANVAS_HEIGHT - mockupSize.height;

    expect(position.x).toBe(Math.round((CANVAS_WIDTH - mockupSize.width) / 2));
    expect(position.y).toBe(Math.round(verticalSpace * 0.7));
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
      x: 126,
      y: 226,
      width: 778,
      height: 1632,
      cornerRadius: 100,
    });
  });
});
