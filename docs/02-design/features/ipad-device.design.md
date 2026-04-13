# Design: iPad Device Support

> Feature: `ipad-device`
> Created: 2026-04-11
> Architecture: Option C — Pragmatic Balance
> Status: Draft

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | iPad App Store 스크린샷 제작 수요 충족 + 멀티 디바이스 확장의 첫 단계 |
| **WHO** | iPad 앱을 출시하는 개발자/디자이너 |
| **RISK** | 기존 iPhone 합성 기능 회귀. 디바이스 추상화 시 iPhone 렌더링 결과 변경 위험 |
| **SUCCESS** | iPad 카드 활성화 → `/ipad` 이동 → 스크린샷 업로드 → 2048×2732 PNG 다운로드 정상 동작 |
| **SCOPE** | 디바이스 config 추상화 + iPad layout/renderer + iPad ComposerPage + 라우팅 + HomePage 카드 활성화 |

---

## 1. Overview

iPad Pro M4 목업을 활용한 스크린샷 합성 기능을 추가한다. 기존 iPhone 전용 하드코딩을 DeviceConfig 인터페이스 기반으로 추상화하여 iPhone/iPad 공통 렌더러를 구축한다. Option C(Pragmatic Balance) 방식으로 기존 함수 시그니처를 유지하면서 config 파라미터를 추가한다.

### 1.1 Architecture Decision

**Option C — Pragmatic Balance** 선택:
- `devices/` 디렉토리에 DeviceConfig 타입 + iPhone/iPad config 분리
- layout.ts 함수에 config 파라미터 추가 (기존 시그니처 호환)
- useCanvasRenderer에 config 전달, dynamic overlay 선택적 처리
- ComposerPage는 deviceConfig prop으로 범용화

## 2. Component Structure

### 2.1 Component Tree

```
App.tsx (BrowserRouter + Routes)
├── Route "/" → HomePage
│   ├── Device Card: iPhone (Link → /iphone)
│   ├── Device Card: iPad (Link → /ipad)     ← 활성화
│   └── ...
├── Route "/iphone" → ComposerPage(config=IPHONE_CONFIG)
├── Route "/ipad" → ComposerPage(config=IPAD_CONFIG)    ← 신규
└── Route "*" → Navigate to "/"
```

### 2.2 Component Specifications

#### ComposerPage (`src/composer/ComposerPage.tsx`)

**변경 사항**: deviceConfig prop 추가

```tsx
interface ComposerPageProps {
  deviceConfig: DeviceConfig;
}

export function ComposerPage({ deviceConfig }: ComposerPageProps) {
  // CANVAS_WIDTH/HEIGHT → deviceConfig.canvas.width/height 사용
  // useMultiCanvasRenderer에 deviceConfig 전달
  // hero 텍스트에 디바이스명 + 캔버스 크기 반영
}
```

**Hero 텍스트 변경**:
- eyebrow: `Screenshot Composer` (동일)
- h1: `Create App Store screenshots instantly.` (동일)
- copy: `Upload your app screens, add headlines, and download store-ready {width}×{height} mockups.` (동적)

#### App.tsx (수정)

```tsx
import { IPHONE_CONFIG } from './devices/iphone';
import { IPAD_CONFIG } from './devices/ipad';

<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/iphone" element={<ComposerPage deviceConfig={IPHONE_CONFIG} />} />
  <Route path="/ipad" element={<ComposerPage deviceConfig={IPAD_CONFIG} />} />
  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
```

#### HomePage (`src/home/HomePage.tsx`)

**변경 사항**: iPad 카드 활성화

```tsx
// Before: disabled div
<div className="device-card disabled">
  <span className="device-icon">iPad</span>
  <span className="device-name">iPad</span>
  <span className="coming-soon-badge">Coming Soon</span>
</div>

// After: active Link
<Link to="/ipad" className="device-card">
  <span className="device-icon">iPad</span>
  <span className="device-name">iPad</span>
  <span className="device-desc">App Store screenshots (2048×2732)</span>
</Link>
```

## 3. Data Model

### 3.1 DeviceConfig Interface (`src/devices/types.ts`)

```typescript
export interface DeviceConfig {
  /** 디바이스 표시명 */
  name: string;

  /** 출력 캔버스 크기 */
  canvas: {
    width: number;
    height: number;
  };

  /** 목업 이미지 설정 */
  mockup: {
    /** 프레임 이미지 경로 (public/ 기준) */
    frameImage: string;
    /** 오버레이 이미지 경로 (없으면 2-layer 렌더링) */
    dynamicImage?: string;
    /** 프레임 이미지 원본 크기 */
    originalSize: {
      width: number;
      height: number;
    };
    /** 프레임 내 스크린 영역 (원본 좌표 기준) */
    screenArea: {
      x: number;
      y: number;
      width: number;
      height: number;
      cornerRadius: number;
    };
    /** 캔버스 높이 대비 목업 높이 비율 */
    scaleRatio: number;
    /** 스크린샷 세로 정렬 (0=top, 0.5=center, 1=bottom) */
    verticalAlign?: number;
  };

  /** 헤드라인 기본 설정 */
  headline: {
    defaultFontSize: number;
  };
}
```

### 3.2 iPhone Config (`src/devices/iphone.ts`)

기존 `layout.ts` 하드코딩 값을 그대로 추출:

```typescript
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
```

### 3.3 iPad Config (`src/devices/ipad.ts`)

iPadPro-M4.png 프레임 이미지 분석 기반:

```typescript
import type { DeviceConfig } from './types';

export const IPAD_CONFIG: DeviceConfig = {
  name: 'iPad',
  canvas: { width: 2048, height: 2732 },
  mockup: {
    frameImage: '/mockups/iPadPro-M4.png',
    // dynamicImage 없음 → 2-layer 렌더링
    originalSize: { width: TBD, height: TBD },  // 이미지 실측 필요
    screenArea: { x: TBD, y: TBD, width: TBD, height: TBD, cornerRadius: TBD },
    scaleRatio: 0.65,  // iPad는 캔버스 대비 더 큰 비율 (화면이 넓으므로)
    verticalAlign: 0.5, // 중앙 정렬
  },
  headline: { defaultFontSize: 120 },
};
```

> **Note**: `TBD` 값은 Do 단계에서 iPadPro-M4.png 이미지를 실측하여 확정.
> 이미지를 canvas에 로드 후 `naturalWidth`/`naturalHeight`로 원본 크기 확인,
> 베젤 두께/코너 라디우스는 시각적 측정.

## 4. Layout Functions Refactoring

### 4.1 변경 전략

기존 `layout.ts`의 하드코딩 상수를 DeviceConfig에서 읽도록 변경. 함수명과 반환 타입은 유지하되, 첫 번째 파라미터로 `config: DeviceConfig`를 추가한다.

### 4.2 함수 변경 상세

```typescript
// Before (하드코딩)
export const CANVAS_WIDTH = 1242;
export const CANVAS_HEIGHT = 2688;

export function getScaledMockup(): Size { ... }
export function getMockupScale(): number { ... }
export function getMockupPosition(mockupSize: Size): Position { ... }
export function getScreenArea(framePos: Position, scale: number): RoundedRect { ... }
export function getHeadlineY(mockupY: number): number { ... }

// After (config 기반)
// CANVAS_WIDTH, CANVAS_HEIGHT는 제거 → config.canvas.width/height 사용

export function getScaledMockup(config: DeviceConfig): Size {
  const targetHeight = config.canvas.height * config.mockup.scaleRatio;
  const scale = targetHeight / config.mockup.originalSize.height;
  return {
    width: Math.round(config.mockup.originalSize.width * scale),
    height: Math.round(targetHeight),
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
  return mockupY / 2;  // 변경 없음 (config 불필요)
}
```

### 4.3 기존 테스트 호환

`layout.test.ts`에서 기존 테스트를 IPHONE_CONFIG로 호출하도록 수정:

```typescript
import { IPHONE_CONFIG } from '../devices/iphone';

// Before: getScaledMockup()
// After: getScaledMockup(IPHONE_CONFIG)
```

## 5. Renderer Refactoring

### 5.1 useCanvasRenderer 변경

```typescript
export function useMultiCanvasRenderer(
  canvasRefs: RefObject<(HTMLCanvasElement | null)[]>,
  slides: SlideConfig[],
  shared: SharedConfig,
  config: DeviceConfig  // ← 추가
) {
  // 이미지 로드: config.mockup.frameImage + config.mockup.dynamicImage (선택적)
  useEffect(() => {
    const promises = [loadImage(config.mockup.frameImage)];
    if (config.mockup.dynamicImage) {
      promises.push(loadImage(config.mockup.dynamicImage));
    }

    Promise.all(promises)
      .then(([frame, dynamic]) => {
        frameImgRef.current = frame;
        dynamicImgRef.current = dynamic ?? null;  // iPad: null
        setMockupLoaded(true);
      })
      .catch(/* ... */);
  }, [config]);

  // renderSlide에 config 전달
}
```

### 5.2 renderSlide 변경

```typescript
function renderSlide(
  canvas: HTMLCanvasElement,
  frameImg: HTMLImageElement,
  dynamicImg: HTMLImageElement | null,  // ← nullable로 변경
  slide: SlideConfig,
  shared: SharedConfig,
  config: DeviceConfig  // ← 추가
) {
  canvas.width = config.canvas.width;
  canvas.height = config.canvas.height;

  // 그라디언트 배경
  const gradient = ctx.createLinearGradient(0, 0, 0, config.canvas.height);
  // ...

  const mockupSize = getScaledMockup(config);
  const mockupPos = getMockupPosition(config, mockupSize);
  const scale = getMockupScale(config);
  const framePos = getFramePosition(mockupPos);
  const screenRect = getScreenArea(config, framePos, scale);

  // Layer 1: Frame
  ctx.drawImage(frameImg, framePos.x, framePos.y, frameSize.width, frameSize.height);

  // Layer 2: Screenshot
  if (slide.screenshot) {
    const verticalAlign = config.mockup.verticalAlign ?? 0.5;
    // ... getCoverSourceRect with verticalAlign
    ctx.save();
    clipRoundedRect(ctx, screenRect);
    ctx.drawImage(/* ... */);
    ctx.restore();
  }

  // Layer 3: Dynamic overlay (iPhone만, iPad는 skip)
  if (dynamicImg) {
    ctx.drawImage(dynamicImg, mockupPos.x, mockupPos.y, mockupSize.width, mockupSize.height);
  }

  // Headline
  if (slide.headline) {
    // config.canvas.width / 2 로 중앙 정렬
  }
}
```

### 5.3 핵심 변경 포인트

| 항목 | iPhone (3-layer) | iPad (2-layer) |
|------|-----------------|----------------|
| Frame 이미지 | iPhone16-frame.png | iPadPro-M4.png |
| Dynamic 이미지 | iPhone16-dynamic.png | 없음 (null) |
| 렌더링 레이어 | frame → screenshot → dynamic | frame → screenshot |
| 캔버스 크기 | 1242×2688 | 2048×2732 |
| verticalAlign | 0.3 (상단 편향) | 0.5 (중앙) |

## 6. Routing Design

### 6.1 Route Map

| Path | Component | Config |
|------|-----------|--------|
| `/` | `HomePage` | - |
| `/iphone` | `ComposerPage` | `IPHONE_CONFIG` |
| `/ipad` | `ComposerPage` | `IPAD_CONFIG` |
| `*` | Navigate to `/` | - |

### 6.2 Navigation Flow

```
[/] HomePage
  ├── iPhone 카드 ──→ [/iphone] ComposerPage(IPHONE_CONFIG)
  ├── iPad 카드 ──→ [/ipad] ComposerPage(IPAD_CONFIG)    ← 신규
  │                       │
  │                       └── "← Back" ──→ [/] HomePage
  ├── Galaxy (disabled)
  └── Graphic Design (disabled)
```

## 7. UI Design Specification

### 7.1 iPad ComposerPage

iPhone ComposerPage와 동일한 레이아웃. 차이점:

| 항목 | iPhone | iPad |
|------|--------|------|
| hero copy | `...1242×2688 mockups.` | `...2048×2732 mockups.` |
| Preview aspect-ratio | `1242 / 2688` (~0.46) | `2048 / 2732` (~0.75) |
| Default font size | 128 | 120 |

프리뷰 canvas의 `aspectRatio`는 `config.canvas.width / config.canvas.height`로 자동 적용되므로 iPad 프리뷰가 더 넓은 비율로 표시된다.

### 7.2 HomePage iPad 카드

```
┌──────────────────┐
│                  │
│      iPad        │  ← device-icon (32px, 600)
│      iPad        │  ← device-name (24px, 600)
│  App Store       │  ← device-desc (14px, 400, #666)
│  screenshots     │
│  (2048×2732)     │
│                  │
└──────────────────┘
```

- 기존 disabled 스타일 제거
- iPhone과 동일한 active 카드 스타일 적용
- Link to `/ipad`

## 8. Test Plan

| ID | Test Case | Expected Result |
|----|-----------|-----------------|
| T-01 | HomePage iPad 카드 클릭 | `/ipad`로 이동 |
| T-02 | `/ipad` 스크린샷 업로드 | iPad 프레임 내 렌더링 |
| T-03 | `/ipad` 다운로드 | 2048×2732 PNG |
| T-04 | `/ipad` 헤드라인 입력 | 목업 위에 텍스트 표시 |
| T-05 | `/ipad` 슬라이드 3~5개 | 추가/삭제/개별 다운로드 |
| T-06 | `/ipad` "← Back" 클릭 | HomePage로 이동 |
| T-07 | `/iphone` 기존 기능 | 완전 동일 동작 (회귀 없음) |
| T-08 | layout.test.ts | IPHONE_CONFIG 전달 시 기존 결과 동일 |
| T-09 | rendering.test.ts | 변경 없음, 기존 통과 |
| T-10 | 프리뷰 aspect-ratio | iPad 프리뷰가 더 넓은 비율 |

## 9. File Changes Summary

| # | Action | File | Changes |
|---|--------|------|---------|
| 1 | Create | `src/devices/types.ts` | DeviceConfig 인터페이스 (~35 lines) |
| 2 | Create | `src/devices/iphone.ts` | iPhone config 객체 (~20 lines) |
| 3 | Create | `src/devices/ipad.ts` | iPad config 객체 (~20 lines) |
| 4 | Modify | `src/composer/layout.ts` | 상수 제거, config 파라미터 추가 (~40 lines 변경) |
| 5 | Modify | `src/composer/useCanvasRenderer.ts` | config 파라미터 추가, dynamic 선택적 (~30 lines 변경) |
| 6 | Modify | `src/composer/ComposerPage.tsx` | deviceConfig prop 추가, 동적 텍스트 (~15 lines 변경) |
| 7 | Modify | `src/App.tsx` | /ipad 라우트 + config import (~5 lines) |
| 8 | Modify | `src/home/HomePage.tsx` | iPad 카드 활성화 (~5 lines) |
| 9 | Modify | `src/composer/layout.test.ts` | IPHONE_CONFIG 전달 (~10 lines) |
| 10 | Modify | `src/composer/rendering.test.ts` | 변경 없음 (rendering.ts 변경 없으므로) |

**총 변경량**: Create ~75 lines + Modify ~105 lines = ~180 lines

## 10. Implementation Order

```
Step 1: src/devices/types.ts 생성 (DeviceConfig 인터페이스)
Step 2: src/devices/iphone.ts 생성 (기존 상수 추출)
Step 3: src/devices/ipad.ts 생성 (iPadPro-M4.png 실측값)
Step 4: src/composer/layout.ts 리팩터링 (config 파라미터 추가)
Step 5: src/composer/layout.test.ts 수정 (IPHONE_CONFIG 전달)
Step 6: src/composer/useCanvasRenderer.ts 리팩터링 (config + dynamic 선택적)
Step 7: src/composer/ComposerPage.tsx 수정 (deviceConfig prop)
Step 8: src/App.tsx 수정 (/ipad 라우트 + config import)
Step 9: src/home/HomePage.tsx 수정 (iPad 카드 활성화)
Step 10: 동작 확인 (iPhone 회귀 + iPad 신규)
```

## 11. Implementation Guide

### 11.1 Module Map

| Module | Files | Description | Dependencies |
|--------|-------|-------------|-------------|
| module-1 | `devices/types.ts`, `devices/iphone.ts`, `devices/ipad.ts` | DeviceConfig 타입 및 config 객체 | 없음 |
| module-2 | `composer/layout.ts`, `composer/layout.test.ts` | layout 함수 리팩터링 | module-1 |
| module-3 | `composer/useCanvasRenderer.ts` | renderer 리팩터링 | module-1, module-2 |
| module-4 | `composer/ComposerPage.tsx`, `App.tsx`, `home/HomePage.tsx` | UI 통합 + 라우팅 | module-1, module-2, module-3 |

### 11.2 Recommended Session Plan

이 기능은 단일 세션에서 구현 가능 (~180 lines). 순서대로 진행.

```
Session 1: module-1 → module-2 → module-3 → module-4 (전체)
```

### 11.3 Session Guide

- **module-1**: DeviceConfig 타입 정의 → iPhone config (기존 상수 복사) → iPad config (이미지 실측)
- **module-2**: layout.ts에서 CANVAS_WIDTH/HEIGHT export 제거, 각 함수에 config 파라미터 추가. layout.test.ts에서 IPHONE_CONFIG 전달하여 기존 테스트 통과 확인
- **module-3**: useMultiCanvasRenderer에 config 파라미터 추가. 이미지 로드 시 dynamicImage 있을 때만 로드. renderSlide에서 dynamicImg nullable 처리
- **module-4**: ComposerPage에 deviceConfig prop 추가. App.tsx에 /ipad 라우트. HomePage iPad 카드 활성화
