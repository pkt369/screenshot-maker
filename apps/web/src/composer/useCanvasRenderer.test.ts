import { describe, expect, it, vi } from 'vitest';

import { IPHONE_CONFIG } from '../devices/iphone';
import { renderSlide, type SlideConfig, type SharedConfig } from './useCanvasRenderer';

function createMockContext() {
  let currentFillStyle: string | CanvasGradient = '';
  const headlineFillStyles: Array<string | CanvasGradient> = [];
  const gradient = {
    addColorStop: vi.fn(),
  } as unknown as CanvasGradient;

  const ctx = {
    createLinearGradient: vi.fn(() => gradient),
    fillRect: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    roundRect: vi.fn(),
    clip: vi.fn(),
    fillText: vi.fn(() => {
      headlineFillStyles.push(currentFillStyle);
    }),
    font: '',
    textAlign: 'start' as CanvasTextAlign,
    textBaseline: 'alphabetic' as CanvasTextBaseline,
    set fillStyle(value: string | CanvasGradient) {
      currentFillStyle = value;
    },
    get fillStyle() {
      return currentFillStyle;
    },
  };

  return { ctx, headlineFillStyles };
}

describe('renderSlide', () => {
  it('uses the selected headline color when drawing text', () => {
    const { ctx, headlineFillStyles } = createMockContext();
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ctx),
    } as unknown as HTMLCanvasElement;

    const slide: SlideConfig = {
      screenshot: null,
      headline: 'Hello world',
      headlineFontSize: 128,
      headlineColor: '#ff0000',
    };
    const shared: SharedConfig = {
      backgroundTop: '#000000',
      backgroundBottom: '#111111',
    };

    renderSlide(
      canvas,
      {} as HTMLImageElement,
      null,
      slide,
      shared,
      IPHONE_CONFIG
    );

    expect(ctx.fillText).toHaveBeenCalledWith('Hello world', IPHONE_CONFIG.canvas.width / 2, expect.any(Number));
    expect(headlineFillStyles).toContain('#ff0000');
  });
});
