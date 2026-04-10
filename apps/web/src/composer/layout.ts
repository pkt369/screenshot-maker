// Design Ref: §4.3 — 3-Layer compositing layout constants

export const CANVAS_WIDTH = 1242;
export const CANVAS_HEIGHT = 2688;

// Dynamic overlay layer (830×1686) — outer bounding box including side buttons
const DYNAMIC_ORIGINAL_WIDTH = 830;
const DYNAMIC_ORIGINAL_HEIGHT = 1686;

// Frame layer currently shares the same bounding box as the dynamic overlay asset.
const FRAME_ORIGINAL_WIDTH = 830;

// Screen area coordinates within the FRAME image (830×1686)
// Inset from frame edge to leave a uniform black bezel border visible
const SCREEN_AREA = {
  x: 26,
  y: 26,
  width: 778,
  height: 1632,
  cornerRadius: 100,
};

const PHONE_SCALE_RATIO = 0.55;

export interface Size {
  width: number;
  height: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface Rect extends Position, Size {}

export interface RoundedRect extends Rect {
  cornerRadius: number;
}

// Dynamic layer defines the outer bounding box for positioning
export function getScaledMockup(): Size {
  const targetHeight = CANVAS_HEIGHT * PHONE_SCALE_RATIO;
  const scale = targetHeight / DYNAMIC_ORIGINAL_HEIGHT;
  return {
    width: Math.round(DYNAMIC_ORIGINAL_WIDTH * scale),
    height: Math.round(targetHeight),
  };
}

export function getScaledFrame(scale: number): Size {
  return {
    width: Math.round(FRAME_ORIGINAL_WIDTH * scale),
    height: Math.round(DYNAMIC_ORIGINAL_HEIGHT * scale),
  };
}

export function getMockupScale(): number {
  const targetHeight = CANVAS_HEIGHT * PHONE_SCALE_RATIO;
  return targetHeight / DYNAMIC_ORIGINAL_HEIGHT;
}

// Dynamic layer position (centered horizontally, pushed toward bottom)
export function getMockupPosition(mockupSize: Size): Position {
  const verticalSpace = CANVAS_HEIGHT - mockupSize.height;
  return {
    x: Math.round((CANVAS_WIDTH - mockupSize.width) / 2),
    y: Math.round(verticalSpace * 0.7),
  };
}

// Frame position — centered within the dynamic layer's bounding box
export function getFramePosition(dynamicPos: Position): Position {
  return {
    x: dynamicPos.x,
    y: dynamicPos.y,
  };
}

// Screen area is relative to the frame position
export function getScreenArea(framePos: Position, scale: number): RoundedRect {
  return {
    x: framePos.x + Math.round(SCREEN_AREA.x * scale),
    y: framePos.y + Math.round(SCREEN_AREA.y * scale),
    width: Math.round(SCREEN_AREA.width * scale),
    height: Math.round(SCREEN_AREA.height * scale),
    cornerRadius: Math.round(SCREEN_AREA.cornerRadius * scale),
  };
}

export function getHeadlineY(mockupY: number): number {
  return mockupY / 2;
}
