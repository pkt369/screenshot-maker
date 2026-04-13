import { useEffect, useRef, useState, type RefObject } from 'react';

import type { DeviceConfig } from '../devices/types';
import {
  getScaledMockup,
  getScaledFrame,
  getMockupScale,
  getMockupPosition,
  getFramePosition,
  getScreenArea,
  getHeadlineY,
} from './layout';
import { clipRoundedRect, getCoverSourceRect } from './rendering';

export interface SlideConfig {
  screenshot: HTMLImageElement | null;
  headline: string;
  headlineFontSize: number;
  headlineColor: string;
}

export interface SharedConfig {
  backgroundTop: string;
  backgroundBottom: string;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

// Design Ref: §5.2 — config-based rendering, dynamic overlay optional
export function renderSlide(
  canvas: HTMLCanvasElement,
  frameImg: HTMLImageElement,
  dynamicImg: HTMLImageElement | null,
  slide: SlideConfig,
  shared: SharedConfig,
  config: DeviceConfig
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = config.canvas.width;
  canvas.height = config.canvas.height;

  const gradient = ctx.createLinearGradient(0, 0, 0, config.canvas.height);
  gradient.addColorStop(0, shared.backgroundTop);
  gradient.addColorStop(1, shared.backgroundBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, config.canvas.width, config.canvas.height);

  const mockupSize = getScaledMockup(config);
  const mockupPos = getMockupPosition(config, mockupSize);
  const scale = getMockupScale(config);
  const frameSize = getScaledFrame(config, scale);
  const framePos = getFramePosition(mockupPos);

  // Layer 1 (bottom): Device frame body
  ctx.drawImage(frameImg, framePos.x, framePos.y, frameSize.width, frameSize.height);

  // Layer 2 (middle): User screenshot in screen area
  // Plan SC: SC-02 — screenshot renders inside iPad/iPhone frame
  if (slide.screenshot) {
    const screenRect = getScreenArea(config, framePos, scale);
    const { sx, sy, sw, sh } = getCoverSourceRect(
      {
        width: slide.screenshot.naturalWidth,
        height: slide.screenshot.naturalHeight,
      },
      {
        width: screenRect.width,
        height: screenRect.height,
      },
      {
        verticalAlign: config.mockup.verticalAlign ?? 0.5,
      }
    );

    ctx.save();
    clipRoundedRect(ctx, screenRect);
    ctx.drawImage(
      slide.screenshot,
      sx, sy, sw, sh,
      screenRect.x, screenRect.y, screenRect.width, screenRect.height
    );
    ctx.restore();
  }

  // Layer 3 (top): Dynamic overlay (iPhone only, iPad skips)
  if (dynamicImg) {
    ctx.drawImage(dynamicImg, mockupPos.x, mockupPos.y, mockupSize.width, mockupSize.height);
  }

  // Draw headline above the device
  if (slide.headline) {
    const headlineY = getHeadlineY(mockupPos.y);
    ctx.fillStyle = slide.headlineColor;
    const fontSize = slide.headlineFontSize;
    ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const lines = slide.headline.split('\n');
    const lineHeight = Math.round(fontSize * 1.25);
    const totalHeight = (lines.length - 1) * lineHeight;
    const startY = headlineY - totalHeight / 2;

    lines.forEach((line, i) => {
      ctx.fillText(line, config.canvas.width / 2, startY + i * lineHeight);
    });
  }
}

// Design Ref: §5.1 — config-based hook with optional dynamic image loading
export function useMultiCanvasRenderer(
  canvasRefs: RefObject<(HTMLCanvasElement | null)[]>,
  slides: SlideConfig[],
  shared: SharedConfig,
  config: DeviceConfig
) {
  const frameImgRef = useRef<HTMLImageElement | null>(null);
  const dynamicImgRef = useRef<HTMLImageElement | null>(null);
  const [mockupLoaded, setMockupLoaded] = useState(false);
  const [mockupError, setMockupError] = useState<string | null>(null);

  // Load frame + dynamic layers (dynamic is optional for iPad)
  useEffect(() => {
    setMockupLoaded(false);
    setMockupError(null);

    const promises: Promise<HTMLImageElement>[] = [loadImage(config.mockup.frameImage)];
    if (config.mockup.dynamicImage) {
      promises.push(loadImage(config.mockup.dynamicImage));
    }

    Promise.all(promises)
      .then(([frame, dynamic]) => {
        frameImgRef.current = frame;
        dynamicImgRef.current = dynamic ?? null;
        setMockupLoaded(true);
      })
      .catch((err) => {
        setMockupError(err.message);
      });
  }, [config]);

  useEffect(() => {
    const canvases = canvasRefs.current;
    const frameImg = frameImgRef.current;
    const dynamicImg = dynamicImgRef.current;
    if (!canvases || !mockupLoaded || !frameImg) return;

    slides.forEach((slide, i) => {
      const canvas = canvases[i];
      if (!canvas) return;
      renderSlide(canvas, frameImg, dynamicImg, slide, shared, config);
    });
  }, [canvasRefs, slides, shared, mockupLoaded, config]);

  const downloadAll = () => {
    const canvases = canvasRefs.current;
    if (!canvases) return;

    slides.forEach((slide, i) => {
      const canvas = canvases[i];
      if (!canvas) return;
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `screenshot-${i + 1}.png`;
      link.href = dataUrl;
      link.click();
    });
  };

  const downloadOne = (index: number) => {
    const canvases = canvasRefs.current;
    if (!canvases) return;
    const canvas = canvases[index];
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `screenshot-${index + 1}.png`;
    link.href = dataUrl;
    link.click();
  };

  return { mockupLoaded, mockupError, downloadAll, downloadOne };
}
