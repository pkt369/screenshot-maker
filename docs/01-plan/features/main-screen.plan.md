# Plan: Main Screen

> Feature: `main-screen`
> Created: 2026-04-11
> Status: Draft

## Executive Summary

| Perspective | Description |
|-------------|-------------|
| **Problem** | 현재 앱은 iPhone 스크린샷 합성 기능만 단일 페이지로 제공하며, 다양한 디바이스(iPad, Galaxy 등) 확장을 위한 진입점이 없음 |
| **Solution** | Apple/Android 두 섹션으로 구분된 메인 화면을 추가하고, React Router 기반 라우팅으로 디바이스별 페이지 전환 구조를 구축 |
| **Function UX Effect** | 사용자가 메인 화면에서 디바이스 카드를 선택하여 해당 기기의 스크린샷 합성 페이지로 자연스럽게 이동 |
| **Core Value** | 멀티 디바이스 스크린샷 도구로의 확장 기반 마련. iPhone 기능은 즉시 사용 가능, 나머지는 Coming Soon으로 로드맵 제시 |

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 단일 디바이스(iPhone)에서 멀티 디바이스로 확장하기 위한 네비게이션 구조가 필요 |
| **WHO** | 앱 스토어 스크린샷을 제작하는 개발자/디자이너 |
| **RISK** | 기존 iPhone 기능 동작에 영향 없어야 함. 라우팅 추가 시 기존 URL 접근 깨지지 않아야 함 |
| **SUCCESS** | 메인 화면에서 iPhone 카드 클릭 → ComposerPage 정상 동작. Coming Soon 카드 비활성화 표시 |
| **SCOPE** | 메인 화면 UI + React Router 도입 + iPhone 연결. iPad/Galaxy/Graphic Design은 Coming Soon만 |

---

## 1. Background & Problem

### 1.1 Current State
- React + Vite SPA, 라우팅 라이브러리 없음
- `App.tsx` → `ComposerPage.tsx` 직접 렌더링 (단일 페이지)
- iPhone 16 목업 기반 스크린샷 합성 기능만 존재
- 디바이스 선택이나 카테고리 구분 없음

### 1.2 Problem
- 향후 iPad, Galaxy, Graphic Design 등 다양한 디바이스/기능 추가 시 진입점이 없음
- 사용자가 앱에 진입하면 바로 iPhone 합성 화면만 보이므로 다른 기능의 존재를 인지할 수 없음

### 1.3 Goal
- 메인 화면을 통해 앱의 전체 기능 범위를 한눈에 파악 가능하게 함
- React Router를 도입하여 URL 기반 페이지 전환 구조 확립
- 기존 iPhone 기능을 `/iphone` 경로로 이동, 메인은 `/`에 배치

## 2. Requirements

### 2.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | 메인 화면(`/`)에 Apple, Android 두 섹션 표시 | Must |
| FR-02 | Apple 섹션에 iPhone, iPad 카드 표시 | Must |
| FR-03 | Android 섹션에 Galaxy, Graphic Design 카드 표시 | Must |
| FR-04 | iPhone 카드 클릭 시 기존 ComposerPage(`/iphone`)로 이동 | Must |
| FR-05 | iPad, Galaxy, Graphic Design 카드에 "Coming Soon" 배지 표시 및 비활성화 | Must |
| FR-06 | ComposerPage에서 메인으로 돌아가는 네비게이션 제공 | Must |
| FR-07 | React Router 기반 URL 라우팅 (`/`, `/iphone`) | Must |
| FR-08 | DESIGN.md의 Vercel 디자인 시스템 적용 (shadow-border, Geist 타이포그래피, 카드 스타일) | Must |

### 2.2 Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-01 | 기존 ComposerPage 기능에 영향 없음 (회귀 방지) | Must |
| NFR-02 | 모바일 반응형 지원 (768px 브레이크포인트) | Should |
| NFR-03 | 페이지 전환 시 부드러운 UX | Should |

## 3. Scope

### 3.1 In Scope
- 메인 화면 (HomePage) 컴포넌트 신규 생성
- React Router 도입 및 라우트 설정 (`/`, `/iphone`)
- 디바이스 카드 컴포넌트 (활성/비활성 상태)
- ComposerPage에 뒤로가기 네비게이션 추가
- Vercel 디자인 시스템 스타일링

### 3.2 Out of Scope
- iPad 스크린샷 합성 기능
- Galaxy 스크린샷 합성 기능
- Graphic Design 기능
- 사용자 인증/계정
- 백엔드 API

## 4. Success Criteria

| ID | Criteria | Measurement |
|----|----------|-------------|
| SC-01 | `/` 접속 시 메인 화면 표시 (Apple/Android 섹션, 4개 카드) | 수동 확인 |
| SC-02 | iPhone 카드 클릭 → `/iphone` 이동 → ComposerPage 정상 동작 | 수동 확인 |
| SC-03 | Coming Soon 카드 클릭 시 페이지 이동 없음 | 수동 확인 |
| SC-04 | ComposerPage에서 메인으로 돌아가기 가능 | 수동 확인 |
| SC-05 | DESIGN.md 스타일 적용 (shadow-border 카드, Geist 타이포그래피) | 시각적 확인 |
| SC-06 | 기존 스크린샷 합성 기능 정상 동작 (회귀 없음) | 기존 테스트 통과 |

## 5. Technical Approach

### 5.1 Technology Choices
- **Routing**: `react-router-dom` v7 (BrowserRouter)
- **Styling**: 기존 CSS 파일 확장 (App.css에 메인 화면 스타일 추가)
- **Component**: 함수형 컴포넌트 + TypeScript

### 5.2 Architecture Changes
```
Before:
  App.tsx → ComposerPage.tsx (직접 렌더링)

After:
  App.tsx → BrowserRouter
    ├── Route "/" → HomePage.tsx (신규)
    └── Route "/iphone" → ComposerPage.tsx (기존)
```

### 5.3 File Changes

| Action | File | Description |
|--------|------|-------------|
| Create | `src/home/HomePage.tsx` | 메인 화면 컴포넌트 |
| Modify | `src/App.tsx` | Router 설정, 직접 렌더링 → Route 기반으로 변경 |
| Modify | `src/App.css` | 메인 화면 스타일 추가 |
| Modify | `src/composer/ComposerPage.tsx` | 뒤로가기 링크 추가 |
| Modify | `package.json` | `react-router-dom` 의존성 추가 |

## 6. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| 기존 ComposerPage 기능 회귀 | High | Router 도입 시 ComposerPage 코드 변경 최소화. 기존 테스트 유지 |
| URL 변경으로 인한 접근성 문제 | Medium | `/` 리다이렉트 처리, 404 시 메인으로 fallback |
| Vite SPA 라우팅 이슈 | Low | `vite.config.ts`에 historyApiFallback 설정 확인 |

## 7. Timeline

| Phase | Description |
|-------|-------------|
| Design | 컴포넌트 구조 및 스타일 설계 |
| Do | react-router-dom 설치, HomePage 구현, Router 설정, 스타일링 |
| Check | Gap Analysis, 기존 테스트 확인 |
