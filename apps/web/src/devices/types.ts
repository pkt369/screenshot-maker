// Design Ref: §3.1 — DeviceConfig interface for multi-device abstraction

export interface DeviceConfig {
  /** Device display name */
  name: string;

  /** Output canvas size */
  canvas: {
    width: number;
    height: number;
  };

  /** Mockup image settings */
  mockup: {
    /** Frame image path (relative to public/) */
    frameImage: string;
    /** Dynamic overlay image path (omit for 2-layer rendering) */
    dynamicImage?: string;
    /** Original frame image size in pixels */
    originalSize: {
      width: number;
      height: number;
    };
    /** Screen area within the frame (original coordinates) */
    screenArea: {
      x: number;
      y: number;
      width: number;
      height: number;
      cornerRadius: number;
    };
    /** Mockup height as ratio of canvas height */
    scaleRatio: number;
    /** Screenshot vertical alignment (0=top, 0.5=center, 1=bottom) */
    verticalAlign?: number;
  };

  /** Headline defaults */
  headline: {
    defaultFontSize: number;
  };
}
