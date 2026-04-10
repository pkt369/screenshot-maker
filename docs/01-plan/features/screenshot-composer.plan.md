# Plan: Screenshot Composer

> iPhone App Store 제출용 스크린샷 자동 생성 기능

- Feature: screenshot-composer
- Created: 2026-04-10
- Status: Draft

## Executive Summary

| Perspective | Description |
|-------------|-------------|
| **Problem** | Apple App Store 제출용 스크린샷을 매번 Figma에서 수동으로 만들어야 하며, 반복 작업 비용이 높다 |
| **Solution** | iPhone16 목업을 3-layer(frame → screenshot → dynamic)로 분리하여 Canvas API로 합성, 브라우저에서 즉시 스토어 규격 스크린샷을 생성한다 |
| **Function UX Effect** | 스크린샷 업로드 → 문구 입력 → 실시간 미리보기 → 다운로드까지 한 화면에서 완료 |
| **Core Value** | Figma 없이 수 초 만에 App Store 제출 가능한 고품질 목업 이미지 생성 |

## Context Anchor

| Anchor | Content |
|--------|---------|
| **WHY** | App Store 제출용 스크린샷 제작의 수동 반복 작업을 제거하기 위해 |
| **WHO** | 앱 스크린샷을 스토어에 자주 업로드하는 개발자 / 소규모 팀 |
| **RISK** | 3-layer(frame/screenshot/dynamic) 합성 시 레이어 간 정렬 정확도 및 z-order |
| **SUCCESS** | 1242×2688 규격의 스토어 제출 가능한 PNG를 브라우저에서 생성하고 다운로드할 수 있다 |
| **SCOPE** | iPhone16 목업 3-layer 합성, 프론트엔드 Canvas API 렌더링, headline 텍스트 1줄 |

---

## 1. Background

초기 프로토타입은 NestJS + Sharp 기반으로 서버에서 SVG 스타일의 디바이스 프레임을 프로그래밍 방식으로 그려 합성했다. 이 방식은 범용적이지만:

- 실제 디바이스와 시각적 차이가 있다
- Apple이 요구하는 정확한 규격(1242×2688)에 맞추기 어렵다
- 서버 의존으로 실시간 미리보기가 불가능하다

이번 기능은 iPhone16 목업을 3개의 레이어로 분리하여 프론트엔드에서 Canvas API로 합성하는 방식으로 전환한다:

- **Layer 1 (Bottom)**: `mockup/iPhone16-frame.png` — 폰 프레임 본체 (배경색이 있는 라운드 사각형)
- **Layer 2 (Middle)**: 사용자 스크린샷 — 화면 영역에 맞게 배치
- **Layer 3 (Top)**: `mockup/iPhone16-dynamic.png` — Dynamic Island, 사이드 버튼 등 스크린샷 위에 오버레이

이 3-layer 방식은 Dynamic Island이 스크린샷 위에 자연스럽게 겹치며, 실제 디바이스와 동일한 시각적 결과를 제공한다.

## 2. Requirements

### 2.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | 사용자가 앱 스크린샷 이미지를 업로드할 수 있다 | Must |
| FR-2 | 업로드한 스크린샷이 3-layer 방식(frame → screenshot → dynamic)으로 합성된다 | Must |
| FR-3 | 최종 출력 이미지 크기는 1242×2688 px이다 | Must |
| FR-4 | iPhone16 목업은 캔버스 대비 60% 크기로 배치된다 | Must |
| FR-5 | 폰 위에 사용자가 입력한 headline 텍스트를 표시한다 | Must |
| FR-6 | 실시간 미리보기를 Canvas에서 즉시 렌더링한다 | Must |
| FR-7 | 최종 이미지를 PNG로 다운로드할 수 있다 | Must |
| FR-8 | 배경색(그라디언트)을 사용자가 설정할 수 있다 | Should |

### 2.2 Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-1 | 렌더링은 브라우저 Canvas API로 처리 (서버 불필요) |
| NFR-2 | 동일 입력에 대해 동일 결과 (deterministic) |
| NFR-3 | 렌더링 시간 1초 이내 |

## 3. Constraints

- 렌더링은 프론트엔드 Canvas API 전용 (서버 렌더링 없음)
- iPhone16 목업 레이어 이미지(`mockup/iPhone16-frame.png`, `mockup/iPhone16-dynamic.png`)를 정적 에셋으로 사용
- 출력 규격은 Apple App Store 6.5" display 기준 (1242×2688)
- 렌더링 로직은 프론트엔드에 집중하고 별도 API 서버는 두지 않음

## 4. Technical Approach

### 4.1 Canvas Rendering Pipeline (3-Layer)

```
[User Input]
    ↓
1. Canvas 생성 (1242 × 2688)
2. 배경 그라디언트 렌더링
3. Headline 텍스트 렌더링 (폰 위 영역)
4. [Layer 1] iPhone16-frame.png 로드 + 스케일링 + 하단 중앙 배치 (폰 본체)
5. [Layer 2] 스크린샷 이미지 → 화면 영역에 맞게 배치
6. [Layer 3] iPhone16-dynamic.png 로드 + 동일 위치/스케일 오버레이 (Dynamic Island + 버튼)
7. Canvas → PNG export → 다운로드
```

> **Layer 순서가 핵심**: frame이 가장 아래, 그 위에 screenshot, 최상단에 dynamic overlay.
> Dynamic Island이 스크린샷을 자연스럽게 덮어 실제 디바이스 외관을 재현한다.

### 4.2 Layout Calculation

- **Canvas**: 1242 × 2688 px
- **Phone frame (60%)**: 목업 이미지의 원본 비율 유지하며 캔버스 높이의 60% 기준으로 스케일
- **Phone position**: 하단 중앙 정렬
- **Text area**: 캔버스 상단 ~ 폰 프레임 상단 사이 영역

### 4.3 3-Layer Compositing

iPhone16 목업을 3개의 PNG 레이어로 분리하여 합성한다:

| Layer | File | Role | Z-Index |
|-------|------|------|---------|
| Frame | `mockup/iPhone16-frame.png` | 폰 본체 (라운드 사각형 프레임) | 1 (bottom) |
| Screenshot | 사용자 업로드 이미지 | 앱 화면 캡처 | 2 (middle) |
| Dynamic | `mockup/iPhone16-dynamic.png` | Dynamic Island, 사이드 버튼 오버레이 | 3 (top) |

접근 방식:
- frame과 dynamic은 동일한 원본 크기/좌표계를 공유 (같은 위치에 동일 스케일로 그린다)
- 스크린샷은 frame의 화면 영역 좌표를 사전 측정하여 상수로 정의
- 원본 목업 대비 스케일 비율에 따라 좌표를 동적 계산
- 스크린샷을 해당 영역에 맞게 리사이즈 후 drawImage
- dynamic overlay는 frame과 동일 위치/크기로 drawImage하여 최상단에 합성

## 5. Scope

### In Scope

- iPhone16 목업 1종 지원
- Canvas API 기반 프론트엔드 렌더링
- Headline 텍스트 입력 및 렌더링
- 배경 그라디언트 설정
- PNG 다운로드
- 실시간 미리보기

### Out of Scope

- Android 목업 (이번 범위 외)
- 서버 사이드 렌더링
- 다국어 텍스트 자동 관리
- 폰트 커스터마이징
- 멀티 스크린샷 배치 레이아웃

## 6. Success Criteria

| ID | Criteria | Measurement |
|----|----------|-------------|
| SC-1 | 1242×2688 PNG 파일이 정확한 크기로 생성된다 | 다운로드 파일 해상도 확인 |
| SC-2 | iPhone16 목업이 캔버스의 60%로 렌더링된다 | 시각적 검증 |
| SC-3 | 스크린샷이 목업 화면 영역에 정확히 합성된다 | 시각적 검증 |
| SC-4 | Headline 텍스트가 폰 위에 표시된다 | 시각적 검증 |
| SC-5 | 실시간 미리보기가 입력 변경 시 즉시 반영된다 | UX 테스트 |
| SC-6 | 다운로드 PNG가 Apple App Store에 제출 가능하다 | 실제 업로드 테스트 |

## 7. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| 3-layer 정렬 오차 | frame/dynamic 레이어 간 위치 불일치 | 두 레이어를 동일 좌표/스케일로 렌더링 |
| 스크린샷 화면 영역 좌표 오차 | 스크린샷 위치 어긋남 | 좌표를 정밀 측정하고 미리보기로 즉시 검증 |
| Canvas 텍스트 렌더링 폰트 일관성 | OS별 다른 폰트 렌더링 | 시스템 폰트(San Francisco / system-ui) 사용 |
| 이미지 2장 추가 로딩 | 초기 로딩 시간 증가 | 두 레이어 이미지를 병렬 로딩 (Promise.all) |
| CORS 이슈 (목업 이미지 로딩) | canvas.toDataURL 실패 | 목업 이미지를 같은 origin에서 서빙 |

## 8. Implementation Modules

| Module | Description | Files |
|--------|-------------|-------|
| M1 - Canvas Renderer | 3-layer 합성 렌더링 엔진 (배경 → frame → screenshot → dynamic) | `apps/web/src/composer/useCanvasRenderer.ts` |
| M2 - Layout Calculator | 목업 크기/위치 계산, 화면 영역 좌표 매핑 | `apps/web/src/composer/layout.ts` |
| M3 - Composer UI | 입력 폼 + 실시간 미리보기 + 다운로드 버튼 | `apps/web/src/composer/ComposerPage.tsx` |
| M4 - Asset Management | frame/dynamic 2개 레이어 PNG 병렬 로딩 및 캐싱 | `apps/web/src/composer/useCanvasRenderer.ts` |
