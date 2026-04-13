# Plan: Galaxy S21 Ultra Device Support

> Feature: `galaxy-device`
> Created: 2026-04-13
> Status: Draft

## Executive Summary

| Perspective | Description |
|-------------|-------------|
| **Problem** | 메인 화면에 Galaxy 카드가 "Coming Soon"으로 비활성화되어 있고, Google Play Store용 Android 스크린샷 합성 기능이 없음 |
| **Solution** | `GalaxyS21Ultra-frame.png` + `GalaxyS21Ultra-dynamic.png` 목업을 활용한 Galaxy 스크린샷 합성 페이지 추가. 기존 DeviceConfig 추상화(iPhone/iPad에서 구축됨)를 그대로 재사용 |
| **Function UX Effect** | 메인 화면에서 Galaxy 카드 클릭 → `/galaxy` 페이지에서 1080×1920 (9:16) Play Store 규격 스크린샷 합성 가능. 카메라 펀치홀 오버레이 포함 3-layer 렌더링 |
| **Core Value** | iOS + Android 양대 플랫폼 앱 스토어 스크린샷을 한 도구에서 제작 가능. 디바이스 추상화 구조가 검증되어 최소 비용으로 추가 디바이스 확장 |

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | Google Play Store Android 스크린샷 제작 수요 충족. iOS 전용 도구 → iOS + Android 양대 플랫폼 대응 |
| **WHO** | Google Play Store에 Android 앱을 출시하는 개발자/디자이너 (특히 iPhone 버전을 이미 이 도구로 만들어본 사용자) |
| **RISK** | (1) 기존 iPhone/iPad 합성 기능 회귀 없음이 보장되어야 함 — 코드 수정 없이 config만 추가하는 구조라 리스크 낮음 (2) Galaxy 목업 이미지의 정확한 screenArea 좌표 측정 (3) Play Store의 "alpha 미포함 PNG" 권장사항과 현재 PNG 출력의 호환성 |
| **SUCCESS** | Galaxy 카드 활성화 → `/galaxy` 이동 → 스크린샷 업로드 → 1080×1920 PNG 다운로드, 카메라 펀치홀이 자연스럽게 오버레이됨 |
| **SCOPE** | `src/devices/galaxy.ts` 신규 생성, `App.tsx`에 `/galaxy` 라우트 추가, `HomePage.tsx`에서 Galaxy 카드 활성화. 기존 layout/renderer/ComposerPage 수정 **없음** |

---

## 1. Background & Problem

### 1.1 Current State
- iPhone 16 (1242×2688, 3-layer: frame + screenshot + dynamic overlay) — 완료
- iPad Pro M4 (2048×2732, 2-layer: frame + screenshot) — 완료
- `src/devices/{types,iphone,ipad}.ts` 기반 DeviceConfig 추상화 검증됨
- `composer/layout.ts`, `useCanvasRenderer.ts`, `ComposerPage.tsx`는 이미 DeviceConfig prop 기반으로 범용화
- Galaxy 목업 이미지 2장 준비됨:
  - `public/mockups/GalaxyS21Ultra-frame.png` (897×1902) — 프레임 전체
  - `public/mockups/GalaxyS21Ultra-dynamic.png` (897×1902) — 카메라 펀치홀 + 볼륨/전원 버튼 오버레이 (iPhone dynamic.png의 볼륨 버튼과 동일한 역할)
- `HomePage.tsx` Galaxy 카드: `disabled` 클래스, "Coming Soon" 배지 (iPad와 동일 패턴이었음)

### 1.2 Problem
- 현재 도구로는 Google Play Store용 Android 스크린샷을 만들 수 없음
- Galaxy 목업 이미지는 준비되어 있으나 활용되지 않음 (최근 추가)
- iOS만 지원하는 한계로 Android 앱 출시 개발자는 별도 도구를 찾아야 함

### 1.3 Goal
- Galaxy S21 Ultra 목업을 사용한 1080×1920 (9:16) Google Play Store 규격 스크린샷 합성 기능 제공
- 카메라 펀치홀을 가리지 않는 자연스러운 스크린샷 합성 (dynamic overlay 레이어 활용)
- 코드 수정을 최소화하고 **config 추가만으로** 새 디바이스 지원 (DeviceConfig 추상화 검증)

## 2. Requirements

### 2.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | `src/devices/galaxy.ts`에 `GALAXY_CONFIG: DeviceConfig` 객체 생성 | Must |
| FR-02 | Galaxy 캔버스 크기: **1080×1920** (Google Play Store 9:16 세로 모드 권장 규격) | Must |
| FR-03 | `mockup.frameImage = '/mockups/GalaxyS21Ultra-frame.png'` | Must |
| FR-04 | `mockup.dynamicImage = '/mockups/GalaxyS21Ultra-dynamic.png'` (카메라 펀치홀 오버레이) | Must |
| FR-05 | `mockup.originalSize = { width: 897, height: 1902 }` (실제 이미지 크기) | Must |
| FR-06 | `mockup.screenArea` 좌표 (x, y, width, height, cornerRadius) — iPhone/iPad와 동일하게 `frame.png` 픽셀 수동 측정 후 하드코딩 (Design 단계) | Must |
| FR-07 | `App.tsx`에 `/galaxy` 라우트 추가 (`<Route path="/galaxy" element={<ComposerPage deviceConfig={GALAXY_CONFIG} />} />`) | Must |
| FR-08 | `HomePage.tsx` Galaxy 카드 활성화: `disabled` 제거 → `<Link to="/galaxy">` | Must |
| FR-09 | Galaxy 스크린샷 업로드 → 미리보기 → 다운로드 (개별 + 전체) 동작 | Must |
| FR-10 | 헤드라인 텍스트 Galaxy 목업 위 정상 렌더링 | Must |
| FR-11 | Galaxy는 세로(Portrait) 9:16 모드만 지원 | Must |

### 2.2 Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-01 | 기존 iPhone/iPad 합성 결과물 회귀 없음 (config만 추가, 기존 파일 수정 없음) | Must |
| NFR-02 | Google Play Store 콘텐츠 요구사항 준수: 최소 1080px, 최대 3840px, 9:16 세로 비율 | Must |
| NFR-03 | 다운로드 PNG는 24-bit (alpha 없이도 가능하나, 현재 도구는 투명도 없는 배경 위에 합성하므로 실질적 alpha 영향 없음) | Should |
| NFR-04 | Galaxy 목업 이미지 로드 실패 시 사용자에게 에러 표시 | Must |
| NFR-05 | 스크린샷 업로드 시 1080×1920 권장 해상도 안내(선택) | Nice-to-have |

## 3. Scope

### 3.1 In Scope
- `src/devices/galaxy.ts` 신규 생성 (DeviceConfig 객체)
- `src/App.tsx`에 `/galaxy` 라우트 추가
- `src/home/HomePage.tsx` Galaxy 카드 활성화
- Galaxy screenArea 좌표 측정 (Design 단계)
- Galaxy 디바이스 테스트 (ComposerPage는 이미 config prop 기반이라 추가 컴포넌트 불필요)

### 3.2 Out of Scope
- Landscape(가로) 16:9 모드 지원
- 다른 Galaxy 모델 (S22/S23/S24/Fold/Flip 등)
- 일반 Android 디바이스 추상 규격
- 기존 `layout.ts`, `useCanvasRenderer.ts`, `ComposerPage.tsx` **수정 금지** (기존 회귀 리스크 제거)
- Play Store 업로드 API 연동
- JPEG 출력 (현재 PNG만 지원, 추가 포맷은 별도 기능)

## 4. Success Criteria

| ID | Criteria | Measurement |
|----|----------|-------------|
| SC-01 | HomePage에서 Galaxy 카드 활성화(Coming Soon 제거), 클릭 시 `/galaxy`로 이동 | 수동 확인 |
| SC-02 | `/galaxy`에서 스크린샷 업로드 → Galaxy 목업 프레임 안에 screenArea 경계에 맞게 렌더링 | 수동 확인 |
| SC-03 | 다운로드된 PNG가 정확히 **1080×1920** 크기 | 다운로드 파일 메타 확인 |
| SC-04 | 카메라 펀치홀 영역이 dynamic overlay로 덮여 스크린샷이 펀치홀을 침범하지 않음 | 시각적 확인 |
| SC-05 | 헤드라인 텍스트가 Galaxy 목업 위에 정상 표시 (기본 폰트 크기는 iPhone과 유사한 스케일) | 수동 확인 |
| SC-06 | 기존 iPhone(`/iphone`) 합성 결과 완전히 동일 (회귀 없음) | iPhone 페이지 비교 |
| SC-07 | 기존 iPad(`/ipad`) 합성 결과 완전히 동일 (회귀 없음) | iPad 페이지 비교 |
| SC-08 | 슬라이드 3~5개 추가/삭제/개별 다운로드/전체 다운로드 정상 동작 | 수동 확인 |
| SC-09 | screenArea 좌표가 frame.png의 실제 화면 영역과 일치하여 스크린샷 경계가 베젤 안쪽에 정확히 들어감 | 수동 측정값 vs 렌더링 결과 시각 비교 |

## 5. Technical Approach

### 5.1 Reuse of Existing Abstraction

Galaxy는 iPhone과 **완전히 동일한 3-layer 렌더링** 패턴을 사용:
1. **Layer 1**: 업로드된 스크린샷 (screenArea 안에 clip)
2. **Layer 2**: `GalaxyS21Ultra-frame.png` (디바이스 프레임, 베젤)
3. **Layer 3**: `GalaxyS21Ultra-dynamic.png` (카메라 펀치홀 + 볼륨/전원 버튼 오버레이)

iPhone의 Dynamic Island/볼륨 버튼과 Galaxy의 카메라 펀치홀/볼륨 버튼은 **역할이 완전히 동일한 `dynamicImage` 슬롯**에 들어감. 따라서 `useCanvasRenderer`의 기존 3-layer 로직을 그대로 재사용하며, iPhone config 구조(`iphone.ts`)를 1:1 복제하는 방식으로 구현한다.

### 5.2 Architecture (변경 없음)

```
기존 구조 그대로:
  src/devices/
    types.ts        → DeviceConfig 인터페이스 (수정 없음)
    iphone.ts       → IPHONE_CONFIG (수정 없음)
    ipad.ts         → IPAD_CONFIG (수정 없음)
    galaxy.ts       → GALAXY_CONFIG (신규) ⭐
  src/composer/
    layout.ts               → 수정 없음 (이미 config 파라미터화)
    useCanvasRenderer.ts    → 수정 없음 (dynamicImage 선택적 로직 존재)
    ComposerPage.tsx        → 수정 없음 (config prop 받음)
  src/App.tsx               → /galaxy 라우트 1줄 추가
  src/home/HomePage.tsx     → Galaxy 카드 disabled 제거 + Link 변경
```

### 5.3 Galaxy Config 초안

```typescript
// src/devices/galaxy.ts
import type { DeviceConfig } from './types';

export const GALAXY_CONFIG: DeviceConfig = {
  name: 'Galaxy',
  canvas: { width: 1080, height: 1920 }, // Google Play Store 9:16
  mockup: {
    frameImage: '/mockups/GalaxyS21Ultra-frame.png',
    dynamicImage: '/mockups/GalaxyS21Ultra-dynamic.png',
    originalSize: { width: 897, height: 1902 },
    screenArea: {
      // Design 단계에서 dynamic.png의 4 코너 마커 픽셀 좌표 측정 후 확정
      x: TBD, y: TBD, width: TBD, height: TBD, cornerRadius: TBD,
    },
    scaleRatio: TBD,   // 캔버스 대비 목업 높이 비율 (iPhone 0.55, iPad 0.65 참고)
    verticalAlign: TBD, // 0=top, 0.3~0.5 권장
  },
  headline: { defaultFontSize: TBD }, // 1080 캔버스 기준 (iPhone 1242→128, 비율로 약 110~112)
};
```

### 5.4 File Changes

| Action | File | Description |
|--------|------|-------------|
| Create | `src/devices/galaxy.ts` | Galaxy S21 Ultra DeviceConfig |
| Modify | `src/App.tsx` | `import { GALAXY_CONFIG }` + `/galaxy` 라우트 1줄 |
| Modify | `src/home/HomePage.tsx` | Galaxy 카드 `disabled` → `<Link to="/galaxy">` (iPad 카드와 동일 패턴) |

### 5.5 Galaxy Screen Area 측정 계획 (Design 단계)

**iPhone/iPad와 동일한 방식 — 수동 측정 후 하드코딩.** dynamic.png는 순수 오버레이(카메라 펀치홀 + 버튼)이며 측정 가이드가 아님.

측정 대상 파일: `GalaxyS21Ultra-frame.png` (897×1902)

측정 절차 (iPhone 참고: `iphone.ts` screenArea `{x:26, y:26, w:778, h:1632, cornerRadius:100}`):
1. frame.png를 이미지 뷰어/에디터로 열어 픽셀 단위로 베젤 두께 확인
2. 상/하/좌/우 베젤 두께 측정 → `screenArea.x`, `screenArea.y`, `screenArea.width`, `screenArea.height` 산출
3. 화면 코너의 라운딩 반경 시각 측정 → `cornerRadius` (iPhone 100, iPad 60 참고)
4. 첫 렌더링 결과를 보고 1~2픽셀 단위 미세 조정

> dynamic.png의 검은 사각형들은 실제 Galaxy의 **볼륨/전원 버튼**이므로 측정 기준이 아님 (iPhone dynamic.png의 볼륨 버튼과 같은 역할).

### 5.6 Google Play Store 가이드라인 반영

사용자가 제공한 Play Store 가이드라인 중 이 도구와 관련된 핵심 요건:

| 요건 | 이 도구에서의 대응 |
|------|------------------|
| 세로 9:16, 최소 1080×1920 | 캔버스 1080×1920 고정 ✅ |
| 최대 3840px, 최대:최소 2배 이하 | 1080×1920은 이 범위 안 ✅ |
| JPEG 또는 24-bit PNG (alpha 미포함) | 현재 PNG 출력, 배경 불투명하게 합성되므로 사실상 alpha 없음 ✅ |
| 최소 2개~최대 8개 스크린샷 | 현재 3~5개 슬라이드 지원 → 요건 충족 ✅ |
| 가로세로 비율 9:16 정확 | 1080:1920 = 9:16 ✅ |
| 기기 프레임은 Wear OS/게임 외에는 허용 | 일반 앱 스크린샷은 목업 프레임 OK ✅ |

## 6. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Galaxy screenArea 좌표 부정확 | Medium | iPhone/iPad와 동일한 방식으로 `frame.png` 픽셀 수동 측정 → 하드코딩. 첫 렌더링 후 시각 확인으로 1~2픽셀 미세 조정 |
| 카메라 펀치홀 위치가 화면 영역과 겹쳐 스크린샷을 가림 | Medium | dynamic overlay가 Layer 3에 합성되므로 자연스럽게 처리됨. 펀치홀이 화면 상단에 위치해 헤드라인 영역과만 겹칠 가능성 |
| 1080×1920은 iPhone(1242×2688)/iPad(2048×2732)보다 작음 → 헤드라인 폰트/목업 스케일 재조정 필요 | Low | `scaleRatio`와 `headline.defaultFontSize`를 1080 캔버스에 맞춰 비례 조정 (Design에서 확정) |
| Play Store의 "기기 프레임 지양" 조항 우려 | Low | 해당 조항은 Wear OS/게임에만 강제. 일반 앱은 기기 프레임 허용 — Plan 문서에 명시 |
| 기존 iPhone/iPad 회귀 | Very Low | 기존 코드 수정 없음 (config 파일 신규 생성 + 라우트/홈 단순 추가만) |

## 7. Timeline

| Phase | Description |
|-------|-------------|
| Design | `frame.png` 픽셀 수동 측정으로 screenArea 확정, scaleRatio/verticalAlign/defaultFontSize 확정, 3가지 아키텍처 옵션 제시(최소변경/클린/균형) |
| Do | `devices/galaxy.ts` 생성, `App.tsx` + `HomePage.tsx` 수정, 수동 렌더링 검증 |
| Check | Gap Analysis, iPhone/iPad 회귀 테스트, Galaxy 렌더링 시각 검증, Play Store 규격 확인 |
| Act | Match Rate < 90%일 경우 자동 개선 |
| Report | 완료 보고서 작성 (iOS + Android 양대 플랫폼 달성) |

## 8. Dependencies

- ✅ DeviceConfig 추상화 (이미 완료 — `ipad-device` 기능에서 구축)
- ✅ Galaxy 목업 이미지 2장 (이미 `public/mockups/`에 존재)
- ✅ ComposerPage의 config prop 지원 (이미 완료)
- ✅ 3-layer 렌더링 파이프라인 (iPhone에서 검증됨)
