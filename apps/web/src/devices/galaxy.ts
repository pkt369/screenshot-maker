// Design Ref: §3.1 — Galaxy S21 Ultra config, screen area measured from frame.png
// Measurement summary (GalaxyS21Ultra-frame.png 897×1902):
//   Outer black rim: ~9px (y=4..11, x=4..13)
//   Metallic frame band: ~9px gray 105..133 (y=12..20, x=14..23)
//   Display area: x=24..865, y=22..1880
// Plan SC: SC-03 — Canvas 1080×1920 (Google Play Store 9:16 portrait)
// Plan SC: SC-04 — dynamicImage includes camera punch-hole + volume/power buttons

import type { DeviceConfig } from './types';

export const GALAXY_CONFIG: DeviceConfig = {
  name: 'Galaxy',
  canvas: { width: 1080, height: 1920 },
  mockup: {
    frameImage: '/mockups/GalaxyS21Ultra-frame.png',
    dynamicImage: '/mockups/GalaxyS21Ultra-dynamic.png',
    originalSize: { width: 897, height: 1902 },
    screenArea: { x: 24, y: 22, width: 841, height: 1859, cornerRadius: 70 },
    scaleRatio: 0.65,
    verticalAlign: 0.3,
  },
  headline: { defaultFontSize: 112 },
};
