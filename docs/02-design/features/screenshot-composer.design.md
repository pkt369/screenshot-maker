# Design: Screenshot Composer

> iPhone App Store 제출용 스크린샷 자동 생성 기능

- Feature: screenshot-composer
- Created: 2026-04-10
- Architecture: Option C (Pragmatic Balance)
- Status: Draft

## Context Anchor

| Anchor | Content |
|--------|---------|
| **WHY** | App Store 제출용 스크린샷 제작의 수동 반복 작업을 제거하기 위해 |
| **WHO** | 앱 스크린샷을 스토어에 자주 업로드하는 개발자 / 소규모 팀 |
| **RISK** | PNG 목업 이미지 위에 스크린샷 합성 시 화면 영역 정렬 정확도 |
| **SUCCESS** | 1242×2688 규격의 스토어 제출 가능한 PNG를 브라우저에서 생성하고 다운로드할 수 있다 |
| **SCOPE** | iPhone16 목업 1종, 프론트엔드 Canvas API 렌더링, headline 텍스트 1줄 |

---

## 1. Overview

이전 서버 렌더링 프로토타입을 대체하여, 프론트엔드 Canvas API로 iPhone16 PNG 목업 이미지에 스크린샷을 합성하는 Composer 기능을 제공한다.

### Architecture Decision

**Option C (Pragmatic Balance)** 선택:
- `composer/` 디렉토리에 로직 분리
- 기존 코드 수정 최소화 (App.tsx에서 Composer 직접 렌더링)
- 3개 신규 파일로 관심사 분리

## 2. File Structure

```
apps/web/src/
├─ App.tsx                        # Composer 진입점
├─ composer/
│  ├─ ComposerPage.tsx            # 신규: 입력 폼 + 미리보기 + 다운로드 UI
│  ├─ useCanvasRenderer.ts        # 신규: Canvas 렌더링 커스텀 훅
│  └─ layout.ts                   # 신규: 레이아웃 상수 및 계산 함수
└─ ...
```

## 3. Data Model

### 3.1 ComposerConfig (입력)

```typescript
interface ComposerConfig {
  screenshot: HTMLImageElement | null;  // 업로드한 스크린샷
  headline: string;                     // 폰 위 텍스트
  backgroundTop: string;               // 그라디언트 상단 색상
  backgroundBottom: string;            // 그라디언트 하단 색상
}
```

### 3.2 Layout Constants

```typescript
// 최종 출력 캔버스
const CANVAS_WIDTH = 1242;
const CANVAS_HEIGHT = 2688;

// iPhone16 목업 원본 이미지 크기
const MOCKUP_ORIGINAL_WIDTH = 830;
const MOCKUP_ORIGINAL_HEIGHT = 1686;

// 목업 내 화면 영역 (원본 기준 좌표 - 구현 시 정밀 측정 필요)
const SCREEN_AREA = {
  x: 38,
  y: 38,
  width: 754,
  height: 1610,
  cornerRadius: 55,
};

// 폰 스케일: 캔버스 높이의 60%
const PHONE_SCALE_RATIO = 0.6;
```

## 4. Component Design

### 4.1 ComposerPage.tsx

페이지 전체를 담당하는 컨테이너 컴포넌트.

**State:**
- `screenshot: HTMLImageElement | null` — 업로드된 스크린샷 이미지
- `headline: string` — 헤드라인 텍스트
- `backgroundTop: string` — 그라디언트 상단 색상
- `backgroundBottom: string` — 그라디언트 하단 색상

**UI 구성:**
```
┌─────────────────────────────────────────────┐
│  Screenshot Composer                         │
├──────────────────┬──────────────────────────┤
│  [입력 패널]      │  [미리보기 캔버스]         │
│                  │                          │
│  Screenshot:     │  ┌────────────────────┐  │
│  [파일 선택]      │  │  Headline Text     │  │
│                  │  │                    │  │
│  Headline:       │  │   ┌──────────┐     │  │
│  [텍스트 입력]    │  │   │ iPhone16 │     │  │
│                  │  │   │          │     │  │
│  Gradient Top:   │  │   │ screen-  │     │  │
│  [색상 선택]      │  │   │ shot     │     │  │
│                  │  │   │          │     │  │
│  Gradient Bottom:│  │   └──────────┘     │  │
│  [색상 선택]      │  └────────────────────┘  │
│                  │                          │
│  [Download PNG]  │                          │
└──────────────────┴──────────────────────────┘
```

**Event Flow:**
1. 파일 선택 → `FileReader` → `Image` 객체 생성 → state 업데이트
2. 텍스트/색상 입력 → state 업데이트
3. state 변경 시 → `useCanvasRenderer` 훅이 Canvas 자동 리렌더
4. Download 클릭 → `canvas.toDataURL('image/png')` → 다운로드 트리거

### 4.2 useCanvasRenderer.ts

Canvas 렌더링을 담당하는 커스텀 훅.

```typescript
function useCanvasRenderer(
  canvasRef: RefObject<HTMLCanvasElement>,
  config: ComposerConfig
): { download: () => void }
```

**렌더링 파이프라인 (순서 중요):**

```
Step 1: Clear canvas (1242 × 2688)
Step 2: Draw gradient background (top → bottom)
Step 3: Calculate phone position (하단 중앙, 60% 스케일)
Step 4: Draw headline text (폰 위 영역, 중앙 정렬)
Step 5: Draw screenshot into screen area (클리핑 + 리사이즈)
Step 6: Draw iPhone16 mockup PNG over screenshot (프레임이 스크린샷 위를 덮음)
```

**핵심 포인트 — 렌더링 순서:**
- 스크린샷을 먼저 그리고, 그 위에 목업 프레임을 덮어씌운다
- 이렇게 하면 목업의 라운드 코너와 베젤이 스크린샷 경계를 자연스럽게 마스킹한다
- 별도의 클리핑 마스크 없이도 깔끔한 결과를 얻을 수 있다

**download 함수:**
```typescript
const download = () => {
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = 'appstore-screenshot.png';
  link.href = dataUrl;
  link.click();
};
```

### 4.3 layout.ts

레이아웃 계산 함수와 상수를 모아놓는 모듈.

```typescript
// 스케일된 목업 크기 계산
function getScaledMockup(): { width: number; height: number } {
  const targetHeight = CANVAS_HEIGHT * PHONE_SCALE_RATIO;
  const scale = targetHeight / MOCKUP_ORIGINAL_HEIGHT;
  return {
    width: Math.round(MOCKUP_ORIGINAL_WIDTH * scale),
    height: Math.round(targetHeight),
  };
}

// 목업 위치 (하단 중앙)
function getMockupPosition(mockupSize: Size): { x: number; y: number } {
  return {
    x: Math.round((CANVAS_WIDTH - mockupSize.width) / 2),
    y: CANVAS_HEIGHT - mockupSize.height,  // 하단 정렬
  };
}

// 스크린샷 삽입 영역 (스케일 적용)
function getScreenArea(mockupPos: Position, scale: number): Rect {
  return {
    x: mockupPos.x + Math.round(SCREEN_AREA.x * scale),
    y: mockupPos.y + Math.round(SCREEN_AREA.y * scale),
    width: Math.round(SCREEN_AREA.width * scale),
    height: Math.round(SCREEN_AREA.height * scale),
  };
}

// 헤드라인 영역 (캔버스 상단 ~ 폰 상단 사이)
function getHeadlineArea(mockupY: number): Rect {
  return {
    x: 0,
    y: 0,
    width: CANVAS_WIDTH,
    height: mockupY,  // 폰 시작점까지
  };
}
```

## 5. Rendering Detail

### 5.1 Background Gradient

```typescript
const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
gradient.addColorStop(0, config.backgroundTop);
gradient.addColorStop(1, config.backgroundBottom);
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
```

### 5.2 Headline Text

```typescript
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 64px system-ui, -apple-system, sans-serif';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText(config.headline, CANVAS_WIDTH / 2, headlineArea.height / 2);
```

- 폰트: `system-ui` (Apple 환경에서 San Francisco 자동 적용)
- 색상: 흰색 고정 (배경 그라디언트 위에 가독성 확보)
- 정렬: 수평/수직 중앙
- 크기: 64px (1242px 캔버스 대비 적절한 비율)

### 5.3 Screenshot Compositing

```typescript
// 스크린샷을 화면 영역에 cover 방식으로 채우기
const screenRect = getScreenArea(mockupPos, scale);
ctx.drawImage(
  screenshotImg,
  0, 0, screenshotImg.naturalWidth, screenshotImg.naturalHeight,  // source
  screenRect.x, screenRect.y, screenRect.width, screenRect.height  // dest
);
```

### 5.4 Mockup Frame Overlay

```typescript
// 목업 프레임을 스크린샷 위에 덮어씌움
const mockupSize = getScaledMockup();
const mockupPos = getMockupPosition(mockupSize);
ctx.drawImage(mockupImg, mockupPos.x, mockupPos.y, mockupSize.width, mockupSize.height);
```

## 6. Asset Management

- `mockup/iPhone16.png`를 `apps/web/public/mockups/iPhone16.png`로 복사
- Vite의 public 디렉토리에서 정적 서빙
- `useCanvasRenderer` 초기화 시 `new Image()`로 비동기 로드
- 로드 완료 후 렌더링 시작 (로딩 상태 표시)

## 7. App.tsx Integration

기존 App.tsx에 최소한의 변경만 적용:

```typescript
// 간단한 탭/토글로 기존 기능과 Composer 전환
const [mode, setMode] = useState<'mockup' | 'composer'>('composer');
```

- 기존 mockup generator 기능은 그대로 유지
- 상단 탭으로 전환 가능

## 8. Test Plan

| ID | Test | Type | Priority |
|----|------|------|----------|
| T-1 | `getScaledMockup()` 반환값이 캔버스 60% 기준 | Unit | P0 |
| T-2 | `getMockupPosition()` 하단 중앙 정렬 정확도 | Unit | P0 |
| T-3 | `getScreenArea()` 스케일 적용 좌표 정확도 | Unit | P0 |
| T-4 | 다운로드 PNG 크기가 1242×2688 | Integration | P0 |
| T-5 | 텍스트 변경 시 미리보기 즉시 반영 | E2E | P1 |
| T-6 | 스크린샷 없이 렌더링 시 빈 화면 영역 표시 | Edge case | P1 |

## 9. Error Handling

| Case | Handling |
|------|----------|
| 목업 이미지 로드 실패 | 에러 메시지 표시, 렌더링 비활성화 |
| 스크린샷 미선택 | 목업만 렌더링 (스크린 영역은 검정) |
| 브라우저 Canvas 미지원 | 에러 메시지 (현실적으로 거의 없음) |

## 10. Dependencies

- 추가 라이브러리: **없음** (Canvas API는 브라우저 내장)
- 기존 의존성 변경: 없음

## 11. Implementation Guide

### 11.1 Implementation Order

```
1. layout.ts         — 상수 정의 + 계산 함수 (순수 함수, 테스트 가능)
2. useCanvasRenderer.ts — Canvas 렌더링 훅 (layout.ts 의존)
3. ComposerPage.tsx  — UI 조립 (useCanvasRenderer 의존)
4. App.tsx 수정       — Composer 페이지 연결
5. Asset 복사         — mockup/iPhone16.png → public/mockups/
```

### 11.2 Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| 렌더링 위치 | 프론트엔드 Canvas API | 실시간 미리보기, 서버 부하 없음 |
| 프레임 합성 방식 | 스크린샷 → 목업 오버레이 | 클리핑 마스크 불필요, 자연스러운 경계 처리 |
| 화면 영역 정의 | 좌표 상수 (정적) | 동적 감지보다 안정적, 목업 이미지 고정 |
| 폰트 | system-ui | OS 네이티브 폰트, 추가 로딩 불필요 |

### 11.3 Session Guide

| Session | Module | Scope | Estimated Lines |
|---------|--------|-------|-----------------|
| Session 1 | M1+M2 | layout.ts + useCanvasRenderer.ts | ~150 lines |
| Session 2 | M3+M4 | ComposerPage.tsx + App.tsx 수정 + Asset 복사 | ~120 lines |

모든 모듈을 한 세션에서 구현 가능한 규모 (~270 lines).
