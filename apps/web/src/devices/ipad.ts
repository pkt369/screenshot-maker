// Design Ref: §3.3 — iPad Pro M4 config (measured from iPadPro-M4.png 1338×1745)

import type { DeviceConfig } from './types';

export const IPAD_CONFIG: DeviceConfig = {
  name: 'iPad',
  canvas: { width: 2048, height: 2732 },
  mockup: {
    frameImage: '/mockups/iPadPro-M4.png',
    // No dynamic overlay — iPad has no Dynamic Island, uses 2-layer rendering
    originalSize: { width: 1338, height: 1745 },
    screenArea: { x: 42, y: 42, width: 1254, height: 1661, cornerRadius: 60 },
    scaleRatio: 0.65,
    verticalAlign: 0.5,
  },
  headline: { defaultFontSize: 120 },
};
