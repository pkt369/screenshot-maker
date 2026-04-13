# Design: Main Screen

> Feature: `main-screen`
> Created: 2026-04-11
> Architecture: Option C — Pragmatic Balance
> Status: Draft

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 단일 디바이스(iPhone)에서 멀티 디바이스로 확장하기 위한 네비게이션 구조가 필요 |
| **WHO** | 앱 스토어 스크린샷을 제작하는 개발자/디자이너 |
| **RISK** | 기존 iPhone 기능 동작에 영향 없어야 함. 라우팅 추가 시 기존 URL 접근 깨지지 않아야 함 |
| **SUCCESS** | 메인 화면에서 iPhone 카드 클릭 → ComposerPage 정상 동작. Coming Soon 카드 비활성화 표시 |
| **SCOPE** | 메인 화면 UI + React Router 도입 + iPhone 연결. iPad/Galaxy/Graphic Design은 Coming Soon만 |

---

## 1. Overview

메인 화면(HomePage)을 추가하여 Apple/Android 섹션별 디바이스 카드를 제공하고, React Router로 페이지 전환 구조를 구축한다. 기존 ComposerPage는 `/iphone` 경로로 이동하며, 코드 변경을 최소화한다.

### 1.1 Architecture Decision

**Option C — Pragmatic Balance** 선택:
- `home/HomePage.tsx` 1개 파일 생성 (카드는 인라인)
- App.tsx에 Router 설정
- 과도한 분리 없이 적절한 경계

## 2. Component Structure

### 2.1 Component Tree

```
App.tsx (BrowserRouter + Routes)
├── Route "/" → HomePage
│   ├── Hero Section (title, subtitle)
│   ├── Apple Section
│   │   ├── Device Card: iPhone (Link → /iphone)
│   │   └── Device Card: iPad (disabled, Coming Soon badge)
│   └── Android Section
│       ├── Device Card: Galaxy (disabled, Coming Soon badge)
│       └── Device Card: Graphic Design (disabled, Coming Soon badge)
└── Route "/iphone" → ComposerPage (기존, back link 추가)
```

### 2.2 Component Specifications

#### HomePage (`src/home/HomePage.tsx`)

**역할**: 메인 진입점. 디바이스 섹션과 카드를 렌더링.

**Props**: 없음 (standalone page)

**State**: 없음 (정적 UI)

**구조**:
```tsx
import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <main className="home-shell">
      {/* Hero */}
      <section className="home-hero">
        <p className="eyebrow">Screenshot Maker</p>
        <h1>Create beautiful app screenshots.</h1>
        <p className="home-hero-copy">
          Choose your platform and device to get started.
        </p>
      </section>

      {/* Apple Section */}
      <section className="device-section">
        <h2 className="section-heading">Apple</h2>
        <div className="device-grid">
          <Link to="/iphone" className="device-card">
            <span className="device-icon">iPhone</span>
            <span className="device-name">iPhone</span>
            <span className="device-desc">App Store screenshots (1242×2688)</span>
          </Link>
          <div className="device-card disabled">
            <span className="device-icon">iPad</span>
            <span className="device-name">iPad</span>
            <span className="coming-soon-badge">Coming Soon</span>
          </div>
        </div>
      </section>

      {/* Android Section */}
      <section className="device-section">
        <h2 className="section-heading">Android</h2>
        <div className="device-grid">
          <div className="device-card disabled">
            <span className="device-icon">Galaxy</span>
            <span className="device-name">Galaxy</span>
            <span className="coming-soon-badge">Coming Soon</span>
          </div>
          <div className="device-card disabled">
            <span className="device-icon">Design</span>
            <span className="device-name">Graphic Design</span>
            <span className="coming-soon-badge">Coming Soon</span>
          </div>
        </div>
      </section>
    </main>
  );
}
```

#### App.tsx (수정)

**변경 사항**: BrowserRouter + Routes 추가

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './home/HomePage';
import { ComposerPage } from './composer/ComposerPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/iphone" element={<ComposerPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

#### ComposerPage (수정)

**변경 사항**: hero 섹션 위에 뒤로가기 링크 추가

```tsx
// 기존 import에 추가
import { Link } from 'react-router-dom';

// return 내부, <main> 시작 직후에 추가
<nav className="back-nav">
  <Link to="/" className="back-link">← Back</Link>
</nav>
```

## 3. Routing Design

### 3.1 Route Map

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `HomePage` | 메인 화면 (디바이스 선택) |
| `/iphone` | `ComposerPage` | iPhone 스크린샷 합성 (기존) |
| `*` | Navigate to `/` | 404 fallback → 메인으로 리다이렉트 |

### 3.2 Navigation Flow

```
[/] HomePage
  │
  ├── iPhone 카드 클릭 ──→ [/iphone] ComposerPage
  │                              │
  │                              └── "← Back" 클릭 ──→ [/] HomePage
  │
  ├── iPad 카드 (disabled) ──→ 이동 없음
  ├── Galaxy 카드 (disabled) ──→ 이동 없음
  └── Graphic Design 카드 (disabled) ──→ 이동 없음
```

### 3.3 Dependencies

```json
{
  "react-router-dom": "^7.0.0"
}
```

## 4. UI Design Specification

### 4.1 HomePage Layout

DESIGN.md의 Vercel 디자인 시스템을 따른다.

**페이지 구조**:
```
┌─────────────────────────────────────────────┐
│                                             │
│              Screenshot Maker               │  ← eyebrow (14px, #666)
│     Create beautiful app screenshots.       │  ← h1 (48px, weight 600, -2.4px)
│   Choose your platform and device to start. │  ← copy (20px, #4d4d4d)
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  Apple                                      │  ← section heading (32px, weight 600, -1.28px)
│  ┌──────────────────┐ ┌──────────────────┐  │
│  │                  │ │                  │  │
│  │     iPhone       │ │      iPad        │  │
│  │                  │ │   Coming Soon    │  │
│  │  App Store       │ │                  │  │
│  │  screenshots     │ │                  │  │
│  │  (1242×2688)     │ │                  │  │
│  └──────────────────┘ └──────────────────┘  │
│                                             │
│  Android                                    │  ← section heading
│  ┌──────────────────┐ ┌──────────────────┐  │
│  │                  │ │                  │  │
│  │     Galaxy       │ │  Graphic Design  │  │
│  │   Coming Soon    │ │   Coming Soon    │  │
│  │                  │ │                  │  │
│  └──────────────────┘ └──────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
```

### 4.2 Design Tokens (from DESIGN.md)

#### Typography

| Element | Font | Size | Weight | Line Height | Letter Spacing |
|---------|------|------|--------|-------------|----------------|
| Page title (h1) | Geist | 48px | 600 | 1.0 | -2.4px |
| Section heading (h2) | Geist | 32px | 600 | 1.25 | -1.28px |
| Eyebrow | Geist | 14px | 500 | 1.43 | normal |
| Body copy | Geist | 20px | 400 | 1.8 | normal |
| Card device name | Geist | 24px | 600 | 1.33 | -0.96px |
| Card description | Geist | 14px | 400 | 1.5 | normal |
| Coming Soon badge | Geist | 12px | 500 | 1.33 | normal |
| Back link | Geist | 14px | 500 | 1.43 | normal |

#### Colors

| Element | Color |
|---------|-------|
| Page background | `#ffffff` |
| Primary text | `#171717` |
| Secondary text (eyebrow, description) | `#666666` |
| Body copy | `#4d4d4d` |
| Card background | `#ffffff` |
| Card border (shadow) | `rgba(0, 0, 0, 0.08) 0px 0px 0px 1px` |
| Card hover shadow | `rgba(0,0,0,0.12) 0px 0px 0px 1px, rgba(0,0,0,0.06) 0px 4px 8px` |
| Disabled card opacity | `0.5` |
| Coming Soon badge bg | `#fafafa` |
| Coming Soon badge text | `#666666` |
| Coming Soon badge border | `rgba(0, 0, 0, 0.08) 0px 0px 0px 1px` |
| Back link text | `#666666` |
| Back link hover | `#171717` |

#### Spacing

| Element | Value |
|---------|-------|
| Page padding | `80px 24px 120px` |
| Hero margin-bottom | `64px` |
| Section gap | `48px` |
| Section heading margin-bottom | `24px` |
| Card grid gap | `16px` |
| Card padding | `32px` |
| Card border-radius | `12px` |
| Coming Soon badge padding | `4px 12px` |
| Coming Soon badge radius | `9999px` |

#### Card States

**Active card (iPhone)**:
- Background: `#ffffff`
- Shadow: `rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 2px, #fafafa 0px 0px 0px 1px`
- Hover: shadow intensifies + subtle translateY(-2px)
- Cursor: `pointer`

**Disabled card (Coming Soon)**:
- Background: `#ffffff`
- Opacity: `0.5`
- Shadow: `rgba(0, 0, 0, 0.08) 0px 0px 0px 1px`
- Cursor: `not-allowed`
- No hover effect

### 4.3 Back Navigation (ComposerPage)

```
┌─────────────────────────────┐
│ ← Back                     │  ← back-nav (sticky 아님, 페이지 상단)
│                             │
│     Screenshot Composer     │  ← 기존 hero
│     ...                     │
```

- Link text: `← Back`
- Font: Geist 14px weight 500
- Color: `#666666`, hover `#171717`
- Padding: `0 0 16px`
- 위치: hero 섹션 위, `<main>` 직후

### 4.4 Responsive Behavior

**Mobile (≤768px)**:
- Page padding: `48px 16px 80px`
- h1: `32px`, letter-spacing `-1.28px`
- Section heading (h2): `24px`, letter-spacing `-0.96px`
- Card grid: `1fr` (single column, stacked)
- Card padding: `24px`

## 5. File Changes Summary

| # | Action | File | Changes |
|---|--------|------|---------|
| 1 | Install | `package.json` | `react-router-dom` 추가 |
| 2 | Create | `src/home/HomePage.tsx` | 메인 화면 컴포넌트 (~50 lines) |
| 3 | Modify | `src/App.tsx` | BrowserRouter + Routes 설정 (~15 lines) |
| 4 | Modify | `src/App.css` | 메인 화면 스타일 추가 (~100 lines) |
| 5 | Modify | `src/composer/ComposerPage.tsx` | back-nav 링크 추가 (~5 lines) |

**총 변경량**: ~170 lines (Create ~50 + Modify ~120)

## 6. Implementation Order

```
Step 1: react-router-dom 설치
Step 2: src/home/HomePage.tsx 생성
Step 3: src/App.tsx 수정 (Router 설정)
Step 4: src/App.css 에 메인 화면 스타일 추가
Step 5: src/composer/ComposerPage.tsx 수정 (back link)
Step 6: 동작 확인
```

## 7. Test Plan

| ID | Test Case | Expected Result |
|----|-----------|-----------------|
| T-01 | `/` 접속 | HomePage 렌더링 (Hero + Apple 섹션 + Android 섹션) |
| T-02 | iPhone 카드 클릭 | `/iphone`로 이동, ComposerPage 표시 |
| T-03 | iPad 카드 클릭 | 페이지 이동 없음 |
| T-04 | Galaxy 카드 클릭 | 페이지 이동 없음 |
| T-05 | Graphic Design 카드 클릭 | 페이지 이동 없음 |
| T-06 | ComposerPage "← Back" 클릭 | `/`로 이동, HomePage 표시 |
| T-07 | `/iphone`에서 스크린샷 업로드/다운로드 | 기존 기능 정상 동작 |
| T-08 | 존재하지 않는 경로 접속 (`/foo`) | `/`로 리다이렉트 |
| T-09 | 모바일 뷰 (≤768px) | 카드 1열 스택, 축소된 타이포그래피 |
| T-10 | 브라우저 뒤로가기 버튼 | 정상 히스토리 탐색 |

## 8. Implementation Guide

### 8.1 Module Map

| Module | Files | Description |
|--------|-------|-------------|
| module-1 | `package.json` | react-router-dom 설치 |
| module-2 | `src/home/HomePage.tsx` | 메인 화면 컴포넌트 생성 |
| module-3 | `src/App.tsx`, `src/App.css` | Router 설정 + 스타일링 |
| module-4 | `src/composer/ComposerPage.tsx` | 뒤로가기 네비게이션 |

### 8.2 Recommended Session Plan

이 기능은 단일 세션에서 구현 가능 (약 170 lines). 분리 불필요.

```
Session 1: module-1 → module-2 → module-3 → module-4 (전체)
```

### 8.3 Session Guide

- **module-1**: `pnpm add react-router-dom` (또는 npm/yarn)
- **module-2**: HomePage.tsx 생성 — Hero + Apple/Android 섹션 + 카드
- **module-3**: App.tsx Router 래핑 + App.css 홈 스타일 추가
- **module-4**: ComposerPage.tsx에 Link import + back-nav 추가
