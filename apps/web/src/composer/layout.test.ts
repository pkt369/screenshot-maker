import { describe, expect, it } from 'vitest';

import { IPHONE_CONFIG } from '../devices/iphone';
import {
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

    const position = getMockupPosition(IPHONE_CONFIG, mockupSize);
    const verticalSpace = IPHONE_CONFIG.canvas.height - mockupSize.height;

    expect(position.x).toBe(Math.round((IPHONE_CONFIG.canvas.width - mockupSize.width) / 2));
    expect(position.y).toBe(Math.round(verticalSpace * 0.7));
  });
});

describe('frame and screen geometry', () => {
  it('uses the same origin for frame and dynamic layers', () => {
    const position = getFramePosition({ x: 120, y: 240 });

    expect(position).toEqual({ x: 120, y: 240 });
  });

  it('maps the display opening close to the visible frame edges', () => {
    const rect = getScreenArea(IPHONE_CONFIG, { x: 100, y: 200 }, 1);

    expect(rect).toEqual({
      x: 126,
      y: 226,
      width: 778,
      height: 1632,
      cornerRadius: 100,
    });
  });
});
