# Plan: iPad Device Support

> Feature: `ipad-device`
> Created: 2026-04-11
> Status: Draft

## Executive Summary

| Perspective | Description |
|-------------|-------------|
| **Problem** | 메인 화면에 iPad가 "Coming Soon"으로 비활성화되어 있고, iPad용 스크린샷 합성 기능이 없음 |
| **Solution** | iPadPro-M4.png 목업을 활용한 iPad 스크린샷 합성 페이지 추가. 디바이스 추상화로 iPhone/iPad 공통 렌더러 구축 |
| **Function UX Effect** | 메인 화면에서 iPad 카드 클릭 → `/ipad` 페이지에서 2048×2732 App Store 규격 iPad 스크린샷 합성 가능 |
| **Core Value** | 멀티 디바이스 스크린샷 도구로의 첫 확장. 디바이스 추상화로 향후 Galaxy 등 추가 시 최소 비용으로 확장 가능 |

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | iPad App Store 스크린샷 제작 수요 충족 + 멀티 디바이스 확장의 첫 단계 |
| **WHO** | iPad 앱을 출시하는 개발자/디자이너 |
| **RISK** | 기존 iPhone 합성 기능 회귀. 디바이스 추상화 시 iPhone 렌더링 결과 변경 위험 |
| **SUCCESS** | iPad 카드 활성화 → `/ipad` 이동 → 스크린샷 업로드 → 2048×2732 PNG 다운로드 정상 동작 |
| **SCOPE** | 디바이스 config 추상화 + iPad layout/renderer + iPad ComposerPage + 라우팅 + HomePage 카드 활성화 |

---

## 1. Background & Problem

### 1.1 Current State
- iPhone 16 전용 3-layer 합성 시스템 (frame → screenshot → dynamic overlay)
- 캔버스: 1242×2688 (iPhone App Store 규격)
- `layout.ts`: iPhone 전용 상수 하드코딩 (830×1686 dynamic, 26px inset 등)
- `useCanvasRenderer.ts`: iPhone frame + dynamic 2개 이미지 로드 및 렌더링
- 메인 화면 iPad 카드: `disabled` 클래스, "Coming Soon" 배지
- iPad 목업 이미지 `iPadPro-M4.png` 이미 `public/mockups/`에 존재

### 1.2 Problem
- iPad App Store 스크린샷을 만들 수 없음
- 현재 코드가 iPhone에 하드코딩되어 새 디바이스 추가 시 전체 복사가 필요
- iPad Pro M4 목업 이미지는 준비되어 있지만 활용되지 않음

### 1.3 Goal
- iPad Pro M4 목업을 사용한 2048×2732 스크린샷 합성 기능 제공
- layout/renderer를 디바이스 config 기반으로 추상화하여 코드 재사용
- 메인 화면 iPad 카드 활성화 및 `/ipad` 라우트 연결

## 2. Requirements

### 2.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | 디바이스 config 인터페이스 정의 (캔버스 크기, 목업 이미지, 스크린 영역, 스케일 등) | Must |
| FR-02 | iPhone config 추출 (기존 하드코딩 → config 객체) | Must |
| FR-03 | iPad Pro M4 config 생성 (2048×2732 캔버스, iPadPro-M4.png 프레임) | Must |
| FR-04 | layout.ts 함수들을 디바이스 config 파라미터 기반으로 리팩터링 | Must |
| FR-05 | useCanvasRenderer를 디바이스 config 기반으로 리팩터링 (dynamic overlay 선택적) | Must |
| FR-06 | iPad ComposerPage (`/ipad` 라우트) 생성 | Must |
| FR-07 | HomePage iPad 카드 활성화 (`disabled` → Link to `/ipad`) | Must |
| FR-08 | iPad 스크린샷 다운로드 (개별 + 전체) | Must |
| FR-09 | iPad는 단일 프레임 사용 (dynamic overlay 없음, 2-layer: frame + screenshot) | Must |
| FR-10 | iPad 세로(Portrait) 모드만 지원 | Must |

### 2.2 Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-01 | 기존 iPhone 합성 결과물이 pixel-perfect 동일해야 함 (회귀 방지) | Must |
| NFR-02 | 디바이스 추상화 후 향후 Galaxy 등 추가 시 config만 정의하면 되는 구조 | Should |
| NFR-03 | iPad 목업 이미지 로드 실패 시 에러 메시지 표시 | Must |

## 3. Scope

### 3.1 In Scope
- 디바이스 config 타입 정의 및 iPhone/iPad config 객체
- layout.ts 리팩터링 (디바이스 config 파라미터화)
- useCanvasRenderer 리팩터링 (config 기반, dynamic overlay 선택적)
- iPad ComposerPage 생성 (기존 ComposerPage를 config로 일반화)
- App.tsx에 `/ipad` 라우트 추가
- HomePage iPad 카드 활성화
- iPad 스크린 영역 측정 및 config 작성

### 3.2 Out of Scope
- Landscape(가로) 모드 지원
- iPad mini, iPad Air 등 다른 iPad 모델
- Galaxy/Android 디바이스 지원
- 디바이스 간 설정 공유/동기화
- 백엔드 API

## 4. Success Criteria

| ID | Criteria | Measurement |
|----|----------|-------------|
| SC-01 | HomePage에서 iPad 카드 활성화, 클릭 시 `/ipad`로 이동 | 수동 확인 |
| SC-02 | `/ipad`에서 스크린샷 업로드 → iPad 목업 프레임 안에 렌더링 | 수동 확인 |
| SC-03 | 다운로드된 PNG가 2048×2732 크기 | 다운로드 파일 크기 확인 |
| SC-04 | 헤드라인 텍스트가 iPad 목업 위에 정상 표시 | 수동 확인 |
| SC-05 | 기존 iPhone 합성 기능 완전히 동일하게 동작 (회귀 없음) | iPhone 페이지 테스트 |
| SC-06 | iPad ComposerPage에서 메인으로 돌아가기 가능 | 수동 확인 |
| SC-07 | 슬라이드 3~5개 추가/삭제/개별 다운로드 정상 동작 | 수동 확인 |

## 5. Technical Approach

### 5.1 디바이스 Config 인터페이스

```typescript
interface DeviceConfig {
  name: string;
  canvas: { width: number; height: number };
  mockup: {
    frameImage: string;           // 프레임 이미지 경로
    dynamicImage?: string;        // 오버레이 이미지 (iPad는 없음)
    originalSize: { width: number; height: number };
    screenArea: { x: number; y: number; width: number; height: number; cornerRadius: number };
    scaleRatio: number;           // 캔버스 대비 목업 높이 비율
    verticalAlign?: number;       // 스크린샷 세로 정렬 (기본 0.5)
  };
  headline: {
    defaultFontSize: number;
  };
}
```

### 5.2 Architecture Changes

```
Before (iPhone 하드코딩):
  layout.ts          → iPhone 상수 하드코딩
  useCanvasRenderer  → iPhone frame + dynamic 2개 이미지 로드
  ComposerPage       → iPhone 전용

After (디바이스 추상화):
  devices/
    types.ts         → DeviceConfig 인터페이스
    iphone.ts        → iPhone config 객체
    ipad.ts          → iPad config 객체
  composer/
    layout.ts        → getScaledMockup(config), getMockupPosition(config) 등
    useCanvasRenderer.ts → config 기반 렌더링, dynamic 선택적
    ComposerPage.tsx → config prop 받아 범용 동작
  App.tsx            → /ipad 라우트 추가
  home/HomePage.tsx  → iPad 카드 활성화
```

### 5.3 File Changes

| Action | File | Description |
|--------|------|-------------|
| Create | `src/devices/types.ts` | DeviceConfig 인터페이스 정의 |
| Create | `src/devices/iphone.ts` | iPhone 16 config (기존 상수 추출) |
| Create | `src/devices/ipad.ts` | iPad Pro M4 config (스크린 영역 측정값) |
| Modify | `src/composer/layout.ts` | 하드코딩 → DeviceConfig 파라미터 기반 함수 |
| Modify | `src/composer/useCanvasRenderer.ts` | DeviceConfig 기반 렌더링, dynamic overlay 선택적 |
| Modify | `src/composer/ComposerPage.tsx` | DeviceConfig prop 받아 범용화 |
| Modify | `src/App.tsx` | `/ipad` 라우트 추가 |
| Modify | `src/home/HomePage.tsx` | iPad 카드 활성화 (disabled → Link) |

### 5.4 iPad Pro M4 스크린 영역 측정
- iPadPro-M4.png 이미지를 분석하여 스크린 영역 좌표 측정 필요
- 프레임 베젤 두께, 코너 라디우스 측정
- 구현(Do) 단계에서 정밀 측정 후 config에 반영

## 6. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| iPhone 렌더링 회귀 | High | 리팩터링 전후 iPhone 렌더링 결과 비교 테스트. config 추출 시 기존 상수값 정확히 보존 |
| iPad 스크린 영역 좌표 부정확 | Medium | 이미지 분석 도구로 정밀 측정. 미세 조정 가능한 config 구조 |
| 디바이스 추상화 과도한 복잡성 | Medium | 현재 필요한 최소한의 추상화만 수행. iPhone/iPad 2개 config로 검증 후 확장 |
| ComposerPage 일반화 시 UX 차이 | Low | iPad 캔버스 비율(3:4)에 맞는 미리보기 aspect-ratio 자동 적용 |

## 7. Timeline

| Phase | Description |
|-------|-------------|
| Design | DeviceConfig 인터페이스 확정, iPad 스크린 영역 측정, 컴포넌트 구조 설계 |
| Do | devices/ 생성, layout/renderer 리팩터링, ComposerPage 범용화, 라우팅/홈 수정 |
| Check | Gap Analysis, iPhone 회귀 테스트, iPad 렌더링 검증 |
