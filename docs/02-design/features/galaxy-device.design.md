# Design: Galaxy S21 Ultra Device Support

> Feature: `galaxy-device`
> Created: 2026-04-13
> Architecture: Option A — Minimal Changes
> Status: Draft

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | Google Play Store Android 스크린샷 수요 충족. iOS 전용 → 양대 플랫폼 대응 |
| **WHO** | Google Play Store에 Android 앱을 출시하는 개발자/디자이너 |
| **RISK** | 기존 iPhone/iPad 회귀 (리스크 매우 낮음 — 기존 파일 미수정), screenArea 좌표 정확도 |
| **SUCCESS** | Galaxy 카드 활성화 → `/galaxy` → 업로드 → 1080×1920 PNG, 카메라 펀치홀 자연스러운 오버레이 |
| **SCOPE** | `src/devices/galaxy.ts` 신규 + `App.tsx` 라우트 + `HomePage.tsx` 카드 활성화. 기존 layout/renderer/ComposerPage 수정 없음 |

---

## 1. Overview

이전 `ipad-device` 단계에서 DeviceConfig 추상화가 완성되었기 때문에, Galaxy S21 Ultra 추가는 **config 객체 신규 생성 + 라우트/홈 카드 단순 연결**만으로 완성된다. 기존 `layout.ts`, `useCanvasRenderer.ts`, `ComposerPage.tsx`는 **수정하지 않는다** (회귀 리스크 제거 목적).

### 1.1 Architecture Decision

**Option A — Minimal Changes** 선택 (사용자 승인):
- `src/devices/galaxy.ts` 신규 생성 (GALAXY_CONFIG 객체)
- `App.tsx`에 `/galaxy` 라우트 1줄 추가 + import 1줄
- `HomePage.tsx`에서 Galaxy 카드를 `disabled div` → `Link to /galaxy`로 변경 (기존 iPad 카드 활성화와 동일한 패턴)
- 레지스트리 패턴(B안)은 현재 3개 디바이스 규모에선 과한 추상화 — YAGNI 원칙에 따라 배제

**근거**:
- DeviceConfig 추상화는 이미 "config만 추가하면 새 디바이스 지원"을 목표로 설계됨 (iPad Plan의 NFR-02 명시)
- Galaxy는 iPhone과 동일한 **3-layer 렌더링 패턴**을 사용 → 기존 `useCanvasRenderer`의 dynamic overlay 로직 그대로 재사용
- Galaxy 카메라 펀치홀 + 볼륨/전원 버튼은 iPhone의 Dynamic Island + 볼륨 버튼과 **동일한 `dynamicImage` 슬롯**에 매핑됨

## 2. Component Structure

### 2.1 Component Tree

```
App.tsx (BrowserRouter + Routes)
├── Route "/" → HomePage
│   ├── Apple section
│   │   ├── iPhone card (Link → /iphone)
│   │   └── iPad card (Link → /ipad)
│   └── Android section
│       ├── Galaxy card (Link → /galaxy)    ← 활성화
│       └── Graphic Design card (disabled)
├── Route "/iphone" → ComposerPage(config=IPHONE_CONFIG)
├── Route "/ipad" → ComposerPage(config=IPAD_CONFIG)
├── Route "/galaxy" → ComposerPage(config=GALAXY_CONFIG)    ← 신규
└── Route "*" → Navigate to "/"
```

### 2.2 Component Specifications

#### App.tsx (수정: +2 lines)

```tsx
import { IPHONE_CONFIG } from './devices/iphone';
import { IPAD_CONFIG } from './devices/ipad';
import { GALAXY_CONFIG } from './devices/galaxy';  // ← 추가

<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/iphone" element={<ComposerPage deviceConfig={IPHONE_CONFIG} />} />
  <Route path="/ipad" element={<ComposerPage deviceConfig={IPAD_CONFIG} />} />
  <Route path="/galaxy" element={<ComposerPage deviceConfig={GALAXY_CONFIG} />} />  {/* ← 추가 */}
  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
```

#### HomePage.tsx (수정: Galaxy 카드 활성화)

```tsx
// Before (disabled)
<div className="device-card disabled">
  <span className="device-icon">Galaxy</span>
  <span className="device-name">Galaxy</span>
  <span className="coming-soon-badge">Coming Soon</span>
</div>

// After (active — iPad 카드와 완전히 동일한 패턴)
<Link to="/galaxy" className="device-card">
  <span className="device-icon">Galaxy</span>
  <span className="device-name">Galaxy</span>
  <span className="device-desc">
    Play Store screenshots (1080×1920)
  </span>
</Link>
```

주석도 업데이트: `// Design Ref: §2.2 — iPad card activated with Link to /ipad` → `// Design Ref: §2.2 — iPad/Galaxy cards activated`

#### ComposerPage.tsx — **변경 없음**
- 이미 `deviceConfig` prop을 받아서 동적으로 렌더링
- `config.name`, `config.canvas`, `config.mockup.*` 모두 파라미터화 완료

#### useCanvasRenderer.ts — **변경 없음**
- 이미 `config.mockup.dynamicImage` 선택적 처리 (iPhone 3-layer, iPad 2-layer)
- Galaxy는 iPhone과 동일한 3-layer 경로 사용

#### layout.ts — **변경 없음**
- 이미 모든 함수가 `config: DeviceConfig` 파라미터 기반

## 3. Data Model

### 3.1 GALAXY_CONFIG (`src/devices/galaxy.ts`) — 신규

`frame.png` 픽셀 측정 기반 (Plan 5.5절 측정 결과):

```typescript
// Design Ref: §3.1 — Galaxy S21 Ultra config, screen area measured from frame.png
// Measurement summary (frame.png 897×1902):
//   Outer black rim: ~9px (y=4..11, x=4..13)
//   Metallic frame band: ~9px (y=12..20, x=14..23 gray 105..133)
//   Display area: x=24..865, y=22..1880

import type { DeviceConfig } from './types';

export const GALAXY_CONFIG: DeviceConfig = {
  name: 'Galaxy',
  canvas: { width: 1080, height: 1920 },  // Google Play Store 9:16 portrait
  mockup: {
    frameImage: '/mockups/GalaxyS21Ultra-frame.png',
    dynamicImage: '/mockups/GalaxyS21Ultra-dynamic.png',
    originalSize: { width: 897, height: 1902 },
    screenArea: {
      x: 24,
      y: 22,
      width: 841,
      height: 1859,
      cornerRadius: 55,
    },
    scaleRatio: 0.8,      // 캔버스 높이 대비 목업 높이 비율
    verticalAlign: 0.3,    // iPhone과 동일한 상단 편향 (헤드라인 공간 확보)
  },
  headline: { defaultFontSize: 112 },  // 1080 캔버스 기준 (iPhone 128 × 1080/1242)
};
```

### 3.2 측정 근거 (Pixel Analysis Summary)

| Measurement | Value | Source |
|-------------|-------|--------|
| Image original size | 897 × 1902 | `sips`/PIL 결과 |
| Top metallic frame band | y=12~20 (9px) | `px[200..700, y]` 스캔 |
| Bottom metallic frame band | y=1881~1887 (7px) | `px[200, y]` 스캔 |
| Left metallic frame band | x=14~23 (10px) | `px[x, 300..1300]` 스캔 |
| Right metallic frame band | x=866~875 (10px) | `px[x, 900]` 스캔 |
| Display x range | 24 ~ 865 (width 842) | 메탈릭 밴드 바로 안쪽 |
| Display y range | 22 ~ 1880 (height 1859) | 메탈릭 밴드 바로 안쪽 |
| cornerRadius (estimate) | 55 | S21 Ultra 실제 디스플레이 곡률 반영 |

> `screenArea.width`를 841로 설정한 이유: 수학적으로 865-24+1=842이지만, 미세한 안티앨리어싱 픽셀을 피해 841로 1px 여유. Do 단계에서 첫 렌더링 결과를 확인하며 ±1~2px 미세 조정 가능.

### 3.3 기존 config 파일 — **변경 없음**
- `src/devices/types.ts`: DeviceConfig 인터페이스 그대로
- `src/devices/iphone.ts`: 그대로
- `src/devices/ipad.ts`: 그대로

## 4. Rendering Pipeline (재사용)

Galaxy는 iPhone과 **완전히 동일한 3-layer 렌더링 경로**를 사용한다. 기존 `useCanvasRenderer.ts` 코드를 그대로 사용.

```
Layer 1: Frame (GalaxyS21Ultra-frame.png)
   └── config.mockup.frameImage로 로드

Layer 2: Screenshot (업로드된 스크린샷)
   └── screenArea {x:24, y:22, w:841, h:1859, cr:55}로 clip
   └── verticalAlign=0.3 → 상단 편향 cover

Layer 3: Dynamic Overlay (GalaxyS21Ultra-dynamic.png)
   └── config.mockup.dynamicImage로 로드
   └── 카메라 펀치홀 + 볼륨/전원 버튼 포함
```

iPhone 렌더링과 유일한 차이는 config 값. 코드 경로는 동일하므로 회귀 리스크 제로.

## 5. Routing Design

### 5.1 Route Map

| Path | Component | Config | Status |
|------|-----------|--------|--------|
| `/` | `HomePage` | - | 수정 (Galaxy 카드 활성화) |
| `/iphone` | `ComposerPage` | `IPHONE_CONFIG` | 기존 |
| `/ipad` | `ComposerPage` | `IPAD_CONFIG` | 기존 |
| `/galaxy` | `ComposerPage` | `GALAXY_CONFIG` | **신규** |
| `*` | Navigate to `/` | - | 기존 |

### 5.2 Navigation Flow

```
[/] HomePage
  ├── Apple
  │   ├── iPhone 카드 ──→ [/iphone]
  │   └── iPad 카드 ──→ [/ipad]
  └── Android
      ├── Galaxy 카드 ──→ [/galaxy]    ← 신규
      │                     │
      │                     └── "← Back" ──→ [/] HomePage
      └── Graphic Design (disabled, 유지)
```

## 6. UI Design Specification

### 6.1 Galaxy ComposerPage

ComposerPage는 이미 `deviceConfig` prop 기반으로 범용화되어 있어 별도 컴포넌트 불필요. Galaxy 전용 차이점:

| 항목 | iPhone | iPad | Galaxy |
|------|--------|------|--------|
| Canvas | 1242×2688 | 2048×2732 | **1080×1920** |
| Mockup scale ratio | 0.55 | 0.65 | **0.8** |
| Vertical align | 0.3 | 0.5 | **0.3** |
| Dynamic overlay | ✓ Dynamic Island | ✗ | **✓ 펀치홀 + 버튼** |
| Default font size | 128 | 120 | **112** |
| Preview aspect-ratio | 0.462 | 0.749 | **0.5625** (9:16) |
| Hero copy | `...1242×2688 mockups.` | `...2048×2732 mockups.` | `...1080×1920 mockups.` |

Hero copy는 `ComposerPage.tsx`가 `config.canvas.width/height`로 동적 생성하므로 자동 반영됨.

### 6.2 HomePage Galaxy 카드

```
Android 섹션:
┌──────────────────┐  ┌──────────────────┐
│                  │  │                  │
│     Galaxy       │  │     Design       │ ← 여전히 disabled
│     Galaxy       │  │  Graphic Design  │
│  Play Store      │  │   Coming Soon    │
│  screenshots     │  │                  │
│  (1080×1920)     │  │                  │
└──────────────────┘  └──────────────────┘
     (활성화)             (유지)
```

- 기존 `disabled` 클래스 제거
- iPad 카드와 완전히 동일한 스타일/마크업 구조
- `device-desc` 텍스트: `Play Store screenshots (1080×1920)`

## 7. Google Play Store 요건 준수

| Play Store 요건 | Galaxy config 반영 |
|----------------|-------------------|
| 9:16 세로 비율 | 1080:1920 = 9:16 ✅ |
| 최소 1080px | 단변 1080 ✅ |
| 최대 3840px | 장변 1920 (범위 내) ✅ |
| 최대:최소 ≤ 2배 | 1920/1080 = 1.78 ≤ 2 ✅ |
| 24-bit PNG | PNG toBlob 출력 (alpha 없는 합성) ✅ |
| 2~8개 스크린샷 | 3~5 슬라이드 지원 ✅ |

## 8. Test Plan

| ID | Test Case | Expected Result | Level |
|----|-----------|-----------------|-------|
| T-01 | HomePage Galaxy 카드 클릭 | `/galaxy`로 이동 | Manual |
| T-02 | `/galaxy` 스크린샷 업로드 | Galaxy 프레임 안에 렌더링, screenArea 경계 준수 | Manual |
| T-03 | `/galaxy` 다운로드 | **정확히 1080×1920 PNG** | Auto (blob size 확인) |
| T-04 | `/galaxy` 카메라 펀치홀 | dynamic overlay가 스크린샷 위에 합성 | Visual |
| T-05 | `/galaxy` 헤드라인 | 목업 위 상단에 텍스트 정상 표시 | Manual |
| T-06 | `/galaxy` 슬라이드 3~5개 | 추가/삭제/개별+전체 다운로드 | Manual |
| T-07 | `/galaxy` "← Back" | HomePage로 이동 | Manual |
| T-08 | `/iphone` 기존 기능 | **완전 동일 동작** (회귀 없음) | Manual |
| T-09 | `/ipad` 기존 기능 | **완전 동일 동작** (회귀 없음) | Manual |
| T-10 | screenArea 정확도 | 스크린샷 경계가 디스플레이 영역과 일치 (± 2px 허용) | Visual |
| T-11 | 기존 단위 테스트 | `layout.test.ts`, `rendering.test.ts`, `useCanvasRenderer.test.ts`, `ComposerPage.test.tsx` 전부 통과 | Auto |

## 9. File Changes Summary

| # | Action | File | Changes |
|---|--------|------|---------|
| 1 | Create | `apps/web/src/devices/galaxy.ts` | GALAXY_CONFIG 객체 (~22 lines) |
| 2 | Modify | `apps/web/src/App.tsx` | import + route 2 lines 추가 |
| 3 | Modify | `apps/web/src/home/HomePage.tsx` | Galaxy 카드 disabled→Link (~6 lines) |

**총 변경량**: Create ~22 lines + Modify ~8 lines = **~30 lines**

**수정되지 않는 파일** (회귀 리스크 제거):
- `apps/web/src/devices/types.ts`
- `apps/web/src/devices/iphone.ts`
- `apps/web/src/devices/ipad.ts`
- `apps/web/src/composer/ComposerPage.tsx`
- `apps/web/src/composer/layout.ts`
- `apps/web/src/composer/rendering.ts`
- `apps/web/src/composer/useCanvasRenderer.ts`
- 모든 기존 테스트 파일

## 10. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| screenArea 좌표가 미세하게 어긋남 (스크린샷이 베젤 침범 or 여백) | Medium | Do 단계에서 첫 렌더링 후 시각 확인 → ±1~2px 미세 조정 |
| scaleRatio 0.8이 너무 크거나 작아서 헤드라인 공간 부족 | Low | Do 단계에서 0.75~0.85 범위로 1~2회 튜닝 |
| headline 112px가 1080 캔버스에서 작거나 큼 | Low | 실 렌더링 확인 후 ±8 조정 |
| dynamic overlay의 카메라 펀치홀 위치가 스크린샷 중요 영역을 가림 | Low | 펀치홀은 상단 중앙, 스크린샷 상단은 대부분 상태바 영역이라 문제 없을 가능성 높음 |
| 기존 iPhone/iPad 회귀 | **Very Low** | 기존 파일 수정 없음 (config 신규 + 라우트/홈 단순 추가만) |

## 11. Implementation Guide

### 11.1 Module Map

| Module | Files | Description | Dependencies |
|--------|-------|-------------|--------------|
| module-1 | `src/devices/galaxy.ts` | GALAXY_CONFIG 신규 생성 | 없음 |
| module-2 | `src/App.tsx`, `src/home/HomePage.tsx` | 라우트 등록 + HomePage 카드 활성화 | module-1 |

### 11.2 Recommended Session Plan

단일 세션에서 완료 가능 (~30 lines 총 변경).

```
Session 1: module-1 → module-2 → 시각 검증 (전체)
```

### 11.3 Session Guide

- **module-1**: `apps/web/src/devices/galaxy.ts` 생성. iPhone config를 베이스로 복사하고 경로/크기/screenArea를 Galaxy 값으로 교체. 측정 주석 포함.
- **module-2**:
  1. `App.tsx`에 `import { GALAXY_CONFIG } from './devices/galaxy';` 추가
  2. `<Route path="/galaxy" element={<ComposerPage deviceConfig={GALAXY_CONFIG} />} />` 추가
  3. `HomePage.tsx`에서 Galaxy `<div className="device-card disabled">` 블록을 iPad와 동일한 `<Link to="/galaxy" className="device-card">` 패턴으로 교체
  4. 주석 업데이트
  5. `npm run dev` (또는 기존 개발 서버)로 `/galaxy` 이동, 스크린샷 업로드, 렌더링 시각 확인
  6. 필요 시 screenArea / scaleRatio / defaultFontSize 1~2px 단위 미세 조정

### 11.4 Implementation Order Checklist

- [ ] `apps/web/src/devices/galaxy.ts` 생성 (GALAXY_CONFIG 객체)
- [ ] `apps/web/src/App.tsx` import + route 추가
- [ ] `apps/web/src/home/HomePage.tsx` Galaxy 카드 활성화
- [ ] `/galaxy` 페이지 이동 확인 (T-01)
- [ ] 스크린샷 업로드 → 렌더링 확인 (T-02)
- [ ] 다운로드 → 1080×1920 확인 (T-03)
- [ ] 카메라 펀치홀 오버레이 확인 (T-04)
- [ ] 헤드라인 표시 확인 (T-05)
- [ ] 슬라이드 3~5개 동작 확인 (T-06)
- [ ] iPhone/iPad 회귀 테스트 (T-08, T-09)
- [ ] 기존 단위 테스트 실행 (T-11)
