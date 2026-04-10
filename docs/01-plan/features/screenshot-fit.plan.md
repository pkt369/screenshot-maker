# Plan: Screenshot Fit

> 스크린샷 크기/비율에 관계없이 프레임 스크린 영역에 비율 유지하며 꽉 채우기 (Cover fitting)

- Feature: screenshot-fit
- Created: 2026-04-10
- Status: Draft

## Executive Summary

| Perspective | Description |
|-------------|-------------|
| **Problem** | 업로드한 스크린샷의 비율이 프레임 스크린 영역(774:1630)과 다르면 이미지가 stretch되어 찌그러진다 |
| **Solution** | Cover fitting 알고리즘을 적용하여 비율을 유지하면서 스크린 영역을 빈틈없이 채우고, 넘치는 부분은 중앙 기준으로 crop한다 |
| **Function UX Effect** | 어떤 크기/비율의 스크린샷을 넣어도 왜곡 없이 프레임 안에 자연스럽게 표시된다 |
| **Core Value** | 스크린샷 규격을 신경 쓸 필요 없이 항상 고품질 목업 생성 |

## Context Anchor

| Anchor | Content |
|--------|---------|
| **WHY** | 다양한 크기의 스크린샷이 프레임에서 왜곡되는 문제를 해결하기 위해 |
| **WHO** | 스크린샷 메이커를 사용하는 앱 개발자 |
| **RISK** | crop 영역 계산 오류 시 이미지가 잘리거나 빈 공간 발생 가능 |
| **SUCCESS** | 모든 비율의 스크린샷이 왜곡 없이 프레임을 빈틈없이 채운다 |
| **SCOPE** | `useCanvasRenderer.ts`의 drawImage 로직 수정 (Cover fit 알고리즘) |

---

## 1. Background

현재 `useCanvasRenderer.ts:66-69`에서 스크린샷을 그릴 때 원본 이미지 전체를 스크린 영역 크기에 강제로 맞추고 있다:

```js
ctx.drawImage(
  slide.screenshot,
  0, 0, slide.screenshot.naturalWidth, slide.screenshot.naturalHeight,
  screenRect.x, screenRect.y, screenRect.width, screenRect.height
);
```

이 방식은 이미지와 스크린 영역의 비율이 다를 때 이미지가 늘어나거나 찌그러진다.

## 2. Requirements

### 2.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | 스크린샷 비율을 유지하면서 스크린 영역을 빈틈없이 채운다 (Cover fit) | Must |
| FR-02 | 넘치는 부분은 중앙 기준으로 crop한다 | Must |
| FR-03 | 기존 3-Layer 합성 구조와 레이아웃 상수는 변경하지 않는다 | Must |

### 2.2 Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-01 | 추가 라이브러리 없이 Canvas API drawImage의 source clipping으로 구현 |

## 3. Solution

### Cover Fit 알고리즘

1. 스크린 영역 비율 계산: `screenAspect = screenRect.width / screenRect.height`
2. 이미지 비율 계산: `imgAspect = naturalWidth / naturalHeight`
3. 비율 비교:
   - `imgAspect > screenAspect` → 이미지가 더 넓음 → 높이 기준 맞추고 좌우 crop
   - `imgAspect <= screenAspect` → 이미지가 더 좁음 → 너비 기준 맞추고 상하 crop
4. source 영역(sx, sy, sw, sh)을 계산하여 `drawImage`의 source clipping 파라미터로 전달

### 수정 대상

- `apps/web/src/composer/useCanvasRenderer.ts` — renderSlide 함수 내 screenshot drawImage 로직

## 4. Success Criteria

| ID | Criteria | Verification |
|----|----------|-------------|
| SC-01 | 프레임과 동일한 비율(774:1630)의 스크린샷 → 왜곡 없이 정확히 맞음 | 육안 확인 |
| SC-02 | 가로로 넓은 스크린샷(예: 16:9) → 좌우가 crop되고 세로 꽉 참 | 육안 확인 |
| SC-03 | 세로로 긴 스크린샷(예: 9:21) → 상하가 crop되고 가로 꽉 참 | 육안 확인 |
| SC-04 | 기존 기능(그라데이션, 헤드라인, 다운로드) 정상 동작 | 기능 테스트 |

## 5. Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| crop 계산 오류로 빈 공간 발생 | Medium | 정확한 source rect 계산 및 다양한 비율로 테스트 |
| 기존 레이아웃 깨짐 | Low | layout.ts는 수정하지 않음, drawImage source만 변경 |

## 6. Scope

### In Scope
- Cover fit 알고리즘 구현 (drawImage source clipping)

### Out of Scope
- Contain fit 모드 (여백 표시)
- 사용자가 fit 모드를 선택하는 UI
- 이미지 위치 수동 조정 (드래그)
