// Design Ref: §4 — Layout functions refactored to DeviceConfig-based

import type { DeviceConfig } from '../devices/types';

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

export function getScaledMockup(config: DeviceConfig): Size {
  const targetHeight = config.canvas.height * config.mockup.scaleRatio;
  const scale = targetHeight / config.mockup.originalSize.height;
  return {
    width: Math.round(config.mockup.originalSize.width * scale),
    height: Math.round(targetHeight),
  };
}

export function getScaledFrame(config: DeviceConfig, scale: number): Size {
  return {
    width: Math.round(config.mockup.originalSize.width * scale),
    height: Math.round(config.mockup.originalSize.height * scale),
  };
}

export function getMockupScale(config: DeviceConfig): number {
  const targetHeight = config.canvas.height * config.mockup.scaleRatio;
  return targetHeight / config.mockup.originalSize.height;
}

export function getMockupPosition(config: DeviceConfig, mockupSize: Size): Position {
  const verticalSpace = config.canvas.height - mockupSize.height;
  return {
    x: Math.round((config.canvas.width - mockupSize.width) / 2),
    y: Math.round(verticalSpace * 0.7),
  };
}

export function getFramePosition(dynamicPos: Position): Position {
  return {
    x: dynamicPos.x,
    y: dynamicPos.y,
  };
}

export function getScreenArea(config: DeviceConfig, framePos: Position, scale: number): RoundedRect {
  const sa = config.mockup.screenArea;
  return {
    x: framePos.x + Math.round(sa.x * scale),
    y: framePos.y + Math.round(sa.y * scale),
    width: Math.round(sa.width * scale),
    height: Math.round(sa.height * scale),
    cornerRadius: Math.round(sa.cornerRadius * scale),
  };
}

export function getHeadlineY(mockupY: number): number {
  return mockupY / 2;
}
