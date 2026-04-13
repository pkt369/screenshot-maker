// Design Ref: §3.2 — iPhone 16 config extracted from layout.ts hardcoded values

import type { DeviceConfig } from './types';

export const IPHONE_CONFIG: DeviceConfig = {
  name: 'iPhone',
  canvas: { width: 1242, height: 2688 },
  mockup: {
    frameImage: '/mockups/iPhone16-frame.png',
    dynamicImage: '/mockups/iPhone16-dynamic.png',
    originalSize: { width: 830, height: 1686 },
    screenArea: { x: 26, y: 26, width: 778, height: 1632, cornerRadius: 100 },
    scaleRatio: 0.55,
    verticalAlign: 0.3,
  },
  headline: { defaultFontSize: 128 },
};
