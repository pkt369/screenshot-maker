import { useEffect, useRef, useState, type RefObject } from 'react';

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
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

// Design Ref: §4.3 — 3-Layer compositing (frame → screenshot → dynamic)
function renderSlide(
  canvas: HTMLCanvasElement,
  frameImg: HTMLImageElement,
  dynamicImg: HTMLImageElement,
  slide: SlideConfig,
  shared: SharedConfig
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  gradient.addColorStop(0, shared.backgroundTop);
  gradient.addColorStop(1, shared.backgroundBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const mockupSize = getScaledMockup();
  const mockupPos = getMockupPosition(mockupSize);
  const scale = getMockupScale();
  const frameSize = getScaledFrame(scale);
  const framePos = getFramePosition(mockupPos);

  // Layer 1 (bottom): Phone frame body
  ctx.drawImage(frameImg, framePos.x, framePos.y, frameSize.width, frameSize.height);

  // Layer 2 (middle): User screenshot in screen area — Cover fit (crop to fill)
  // Plan SC: SC-01~SC-03 — aspect ratio preserved, screen area fully covered
  if (slide.screenshot) {
    const screenRect = getScreenArea(framePos, scale);
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
        // Preserve more of the top chrome so the status bar sits lower below the Dynamic Island.
        verticalAlign: 0.3,
      }
    );

    // Clip to the rounded display area so screenshot corners never bleed past the frame.
    ctx.save();
    clipRoundedRect(ctx, screenRect);
    ctx.drawImage(
      slide.screenshot,
      sx, sy, sw, sh,
      screenRect.x, screenRect.y, screenRect.width, screenRect.height
    );
    ctx.restore();
  }

  // Layer 3 (top): Dynamic Island + side buttons overlay
  ctx.drawImage(dynamicImg, mockupPos.x, mockupPos.y, mockupSize.width, mockupSize.height);

  // Draw headline above the phone
  if (slide.headline) {
    const headlineY = getHeadlineY(mockupPos.y);
    ctx.fillStyle = '#ffffff';
    const fontSize = slide.headlineFontSize;
    ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const lines = slide.headline.split('\n');
    const lineHeight = Math.round(fontSize * 1.25);
    const totalHeight = (lines.length - 1) * lineHeight;
    const startY = headlineY - totalHeight / 2;

    lines.forEach((line, i) => {
      ctx.fillText(line, CANVAS_WIDTH / 2, startY + i * lineHeight);
    });
  }
}

export function useMultiCanvasRenderer(
  canvasRefs: RefObject<(HTMLCanvasElement | null)[]>,
  slides: SlideConfig[],
  shared: SharedConfig
) {
  const frameImgRef = useRef<HTMLImageElement | null>(null);
  const dynamicImgRef = useRef<HTMLImageElement | null>(null);
  const [mockupLoaded, setMockupLoaded] = useState(false);
  const [mockupError, setMockupError] = useState<string | null>(null);

  // Load frame + dynamic layers in parallel
  useEffect(() => {
    Promise.all([
      loadImage('/mockups/iPhone16-frame.png'),
      loadImage('/mockups/iPhone16-dynamic.png'),
    ])
      .then(([frame, dynamic]) => {
        frameImgRef.current = frame;
        dynamicImgRef.current = dynamic;
        setMockupLoaded(true);
      })
      .catch((err) => {
        setMockupError(err.message);
      });
  }, []);

  useEffect(() => {
    const canvases = canvasRefs.current;
    const frameImg = frameImgRef.current;
    const dynamicImg = dynamicImgRef.current;
    if (!canvases || !mockupLoaded || !frameImg || !dynamicImg) return;

    slides.forEach((slide, i) => {
      const canvas = canvases[i];
      if (!canvas) return;
      renderSlide(canvas, frameImg, dynamicImg, slide, shared);
    });
  }, [canvasRefs, slides, shared, mockupLoaded]);

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
