# 월간 스케줄표 이미지 생성기 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 년·월을 고르고 일정을 채우면 4000×2250 PNG 스케줄표 이미지를 뽑아주는, 백엔드 없는 React 웹앱을 만든다.

**Architecture:** 미리보기는 실제 4000×2250 px DOM이며 화면에는 CSS `transform: scale()`로 축소해 보여준다. CSS 1 px = 결과물 1 px이므로 "보이는 것과 나오는 것이 같다"가 구조적으로 보장된다. `preview/`는 `ScheduleDoc` 하나만 받아 그리는 순수 표시 계층이고, `editor/`는 그 문서를 편집한다. 둘 사이에 상태·저장 로직이 새지 않게 한다.

**Tech Stack:** React 18 + TypeScript + Vite + Vitest. 런타임 외부 의존성은 `html-to-image` 하나뿐이다.

## Global Constraints

이 절의 요구사항은 **모든 태스크에 암묵적으로 포함된다.**

- **캔버스 규격**: 정확히 `4000 × 2250` px (16:9). 이 숫자는 `src/preview/layout.ts` 상수로만 참조하고 하드코딩하지 않는다.
- **`src/preview/` 안에서는 치수 단위로 `px`만 쓴다.** `%`, `rem`, `em`, `vw`, `vh`, 미디어쿼리 금지. 화면 크기에 반응하는 순간 미리보기와 내보낸 이미지가 어긋난다. `src/editor/`에는 이 제약이 적용되지 않는다.
- **`src/preview/` 컴포넌트는 `ScheduleDoc`(과 파생 값)만 props로 받는다.** 저장 함수, 상태 setter, 이벤트 핸들러를 넘기지 않는다. 유일한 예외는 Task 16의 스티커 조작 레이어이며, 그것도 별도 컴포넌트로 분리한다.
- **격자는 언제나 7열 × 6행 = 42칸이다.** 달에 따라 행 수가 달라지지 않는다.
- **주 시작 요일은 일요일.**
- **날짜 계산은 전부 UTC로 한다.** `new Date(Date.UTC(...))`, `getUTCDay()`, `getUTCDate()`를 쓴다. 로컬 시간대를 쓰면 UTC+9 환경에서 날짜가 하루 밀리는 버그가 조용히 생긴다.
- **문서 저장은 localStorage, 바이너리(폰트·이미지)는 IndexedDB.** localStorage 한도는 약 5MB인데 한글 폰트 하나가 2~10MB다.
- **테스트는 판정이 명확한 곳에만 건다.** 순수 함수와 저장 계층은 Vitest로 테스트한다. 렌더링과 이미지 내보내기는 자동 테스트를 만들지 않고 Task 18의 수동 체크리스트로 검증한다.
- **커밋은 각 태스크 끝에서 한다.** 커밋 메시지 본문 마지막 줄에 `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`를 넣는다.

### 스펙 대비 의도적 변경 1건

스펙 6.9절은 업로드 폰트를 `FontFace` API로 등록한다고 적었으나, **이 계획서는 `<style>` 엘리먼트에 data URL `@font-face`를 주입하는 방식을 쓴다.**

이유: `html-to-image`는 `document.styleSheets`를 순회해 `@font-face` 규칙을 찾아 결과 이미지에 임베딩한다. `FontFace` API로 추가한 폰트는 스타일시트에 존재하지 않으므로 **내보낸 이미지에서 폰트가 누락된다.** 화면에서는 멀쩡해 보이기 때문에 발견이 늦다. `<style>` 주입 방식은 화면 표시와 내보내기를 한 경로로 해결한다. (Task 14)

---

## File Structure

| 파일 | 책임 | 태스크 |
|---|---|---|
| `package.json`, `vite.config.ts`, `tsconfig*.json`, `index.html` | 빌드·테스트 설정 | 1 |
| `src/test/setup.ts` | Vitest 전역 설정 (fake-indexeddb) | 1 |
| `src/model/types.ts` | `ScheduleDoc`, `DayEntry`, `Sticker` 등 모든 도메인 타입 | 2 |
| `src/model/defaults.ts` | 빈 문서 생성 | 2 |
| `src/model/calendar.ts` | 년·월 → 42칸 격자 (순수 함수) | 3 |
| `src/model/storage.ts` | localStorage 문서 저장·불러오기·마이그레이션 | 4 |
| `src/model/copyMonth.ts` | 지난달 복사 (순수 함수) | 4 |
| `src/model/assets.ts` | IndexedDB 바이너리 저장 | 5 |
| `src/theme/themes.ts` | 색상 테마 프리셋 4종 | 6 |
| `src/preview/fitText.ts` | 폰트 크기 선택 (순수 함수) | 7 |
| `src/preview/AutoFitText.tsx` | 측정 + 자동 축소 컴포넌트 | 7 |
| `src/preview/layout.ts` | 4000×2250 레이아웃 상수 | 8 |
| `src/preview/ScheduleCanvas.tsx` | 미리보기 루트 (내보내기 대상 노드) | 8 |
| `src/editor/PreviewStage.tsx` | 미리보기를 화면 폭에 맞춰 축소하는 래퍼 | 8 |
| `src/preview/CalendarGrid.tsx`, `DayCell.tsx` | 격자와 날짜 칸 | 9 |
| `src/preview/Header.tsx`, `MemoBox.tsx`, `TodoBox.tsx`, `Footer.tsx` | 헤더 구성 요소와 하단 문구 | 10 |
| `src/state/useScheduleDoc.ts` | 문서 상태, 자동 저장, 월 전환, 지난달 복사 | 11 |
| `src/editor/EditorPanel.tsx`, `MonthPicker.tsx`, `DayEditor.tsx` | 월 선택과 날짜별 편집 | 12 |
| `src/editor/HeaderEditor.tsx`, `FooterEditor.tsx`, `ThemePicker.tsx` | 헤더·하단·테마 편집 | 13 |
| `src/theme/fonts.ts`, `src/editor/FontPicker.tsx` | 폰트 등록·업로드·선택 | 14 |
| `src/editor/BackgroundPicker.tsx` | 배경 이미지 업로드 | 15 |
| `src/preview/StickerLayer.tsx`, `src/editor/StickerManager.tsx` | 스티커 렌더링과 조작 | 16 |
| `src/export/exportImage.ts`, `src/editor/ExportPanel.tsx` | PNG 추출과 4단계 크기 | 17 |
| `src/App.tsx` | 전체 조립 | 8·12·18에서 점진적으로 확장 |

---

## Task 1: 프로젝트 스캐폴딩

빈 디렉터리에서 시작한다. `npm create vite`는 비어 있지 않은 디렉터리(이미 `docs/`, `.git/`, `.gitignore`가 있다)에서 대화형 프롬프트를 띄우므로 쓰지 않는다. 설정 파일을 직접 만든다.

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`
- Create: `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/vite-env.d.ts`
- Create: `src/test/setup.ts`
- Test: `src/test/smoke.test.ts`

**Interfaces:**
- Consumes: 없음 (첫 태스크)
- Produces: `npm run dev`, `npm run build`, `npm test`가 동작하는 프로젝트. 이후 모든 태스크가 이 위에서 돌아간다.

- [ ] **Step 1: `package.json` 작성**

아래 조합은 Node 24.13 / npm 11.6 환경에서 테스트·빌드가 모두 통과하고 `npm audit`이 0건인 것이 확인된 조합이다.

**Vite 8 / Vitest 4로 올리지 말 것.** Vite 8은 Node `^24.15.0` 이상을 요구하고, Vitest 4는 그 아래 Node에서 `Timeout waiting for worker to respond`로 테스트가 아예 뜨지 않는다. 빌드는 성공하므로 문제를 늦게 발견하게 된다. Node를 24.15 이상으로 올린 뒤라면 상향해도 된다.

```json
{
  "name": "weekplanner",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "html-to-image": "^1.11.13",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/react": "^16.0.1",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^5.1.1",
    "fake-indexeddb": "^6.0.0",
    "jsdom": "^26.1.0",
    "typescript": "^5.6.3",
    "vite": "^7.3.6",
    "vitest": "^3.2.7"
  }
}
```

- [ ] **Step 2: TypeScript 설정 작성**

설정 파일 하나 때문에 프로젝트 참조(`references`)를 두지 않는다. 참조된 프로젝트는 `composite: true`여야 하고 emit을 끌 수 없어서, `tsc -b`가 TS6306/TS6310으로 실패한다. `vite.config.ts`를 그냥 `include`에 넣는 편이 단순하고 안전하다.

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vitest/globals"]
  },
  "include": ["src", "vite.config.ts"]
}
```

- [ ] **Step 3: Vite + Vitest 설정 작성**

`base: './'`는 GitHub Pages 같은 하위 경로 배포에서 자산 경로가 깨지지 않게 한다.

`defineConfig`를 `vite`가 아니라 **`vitest/config`에서** 가져온다. Vitest 3부터 `test` 속성은 이쪽 `defineConfig`에만 있어서, `vite`에서 가져오면 타입 에러가 난다.

`vite.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

`src/test/setup.ts`:

```ts
import 'fake-indexeddb/auto'
```

- [ ] **Step 4: 엔트리 파일 작성**

`index.html`:

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>월간 스케줄표 만들기</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />
```

`src/index.css`:

```css
* { box-sizing: border-box; }
html, body, #root { margin: 0; padding: 0; height: 100%; }
body {
  font-family: system-ui, -apple-system, "Segoe UI", "Malgun Gothic", sans-serif;
  background: #f4f4f5;
  color: #18181b;
}
```

`src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

`src/App.tsx`:

```tsx
export default function App() {
  return <div style={{ padding: 24 }}>월간 스케줄표 만들기</div>
}
```

- [ ] **Step 5: 스모크 테스트 작성**

`src/test/smoke.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

describe('테스트 환경', () => {
  it('Vitest가 동작한다', () => {
    expect(1 + 1).toBe(2)
  })

  it('jsdom 환경이다', () => {
    expect(typeof document).toBe('object')
  })

  it('fake-indexeddb가 로드되어 있다', () => {
    expect(typeof indexedDB).toBe('object')
  })
})
```

- [ ] **Step 6: 의존성 설치**

Run: `npm install`
Expected: `node_modules/` 생성, 에러 없음

- [ ] **Step 7: 테스트 실행**

Run: `npm test`
Expected: PASS — 3 passed

- [ ] **Step 8: 빌드 확인**

Run: `npm run build`
Expected: 에러 없이 `dist/` 생성

- [ ] **Step 9: 커밋**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts index.html src
git commit -m "$(cat <<'EOF'
chore: Vite + React + TypeScript + Vitest 프로젝트 스캐폴딩

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: 도메인 타입과 빈 문서 생성

**Files:**
- Create: `src/model/types.ts`
- Create: `src/model/defaults.ts`
- Test: `src/model/defaults.test.ts`

**Interfaces:**
- Consumes: Task 1의 프로젝트 설정
- Produces:
  - `ScheduleDoc`, `DayEntry`, `Sticker`, `TodoItem`, `HeaderConfig` 타입 — 이후 모든 태스크가 이 타입을 쓴다
  - `createEmptyDoc(year: number, month: number): ScheduleDoc`
  - `createEmptyDayEntry(): DayEntry`
  - `DOC_VERSION: 1`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/model/defaults.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { createEmptyDayEntry, createEmptyDoc, DOC_VERSION } from './defaults'

describe('createEmptyDoc', () => {
  it('지정한 년·월을 갖는다', () => {
    const doc = createEmptyDoc(2026, 8)
    expect(doc.year).toBe(2026)
    expect(doc.month).toBe(8)
  })

  it('현재 문서 버전을 갖는다', () => {
    expect(createEmptyDoc(2026, 8).version).toBe(DOC_VERSION)
  })

  it('일정이 비어 있다', () => {
    expect(createEmptyDoc(2026, 8).days).toEqual({})
  })

  it('스티커가 비어 있다', () => {
    expect(createEmptyDoc(2026, 8).stickers).toEqual([])
  })

  it('헤더 기본값은 자동 제목 + 년월 표기 켜짐', () => {
    const { header } = createEmptyDoc(2026, 8)
    expect(header.titleMode).toBe('auto')
    expect(header.showYearMonth).toBe(true)
  })

  it('MEMO와 To Do List는 기본으로 꺼져 있다', () => {
    const { header } = createEmptyDoc(2026, 8)
    expect(header.memo.enabled).toBe(false)
    expect(header.todo.enabled).toBe(false)
  })

  it('호출할 때마다 독립된 객체를 만든다', () => {
    const a = createEmptyDoc(2026, 8)
    const b = createEmptyDoc(2026, 9)
    a.header.todo.items.push({ text: '오염', checked: false })
    expect(b.header.todo.items).toEqual([])
  })
})

describe('createEmptyDayEntry', () => {
  it('텍스트가 비어 있고 강조가 모두 없다', () => {
    expect(createEmptyDayEntry()).toEqual({
      text: '',
      dateColor: null,
      cellFill: null,
      marker: null,
    })
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npx vitest run src/model/defaults.test.ts`
Expected: FAIL — `Failed to resolve import "./defaults"`

- [ ] **Step 3: 타입 정의 작성**

`src/model/types.ts`:

```ts
/** 하루 칸의 내용. 날짜 숫자 외에 담기는 전부. */
export type DayEntry = {
  /** 일정 텍스트. 줄바꿈 허용. */
  text: string
  /** 날짜 숫자 색. null이면 요일 기본 규칙을 따른다. */
  dateColor: string | null
  /** 칸 배경 채우기 색. null이면 채우지 않는다. */
  cellFill: string | null
  /** 일정 텍스트 아래 형광펜 색. null이면 그리지 않는다. */
  marker: string | null
}

/** 캔버스 위에 자유 배치되는 이미지 요소. */
export type Sticker = {
  id: string
  /** IndexedDB 에셋 참조 키 */
  assetId: string
  /** 4000×2250 기준 절대 좌표 (좌상단) */
  x: number
  y: number
  /** 4000×2250 기준 폭. 높이는 원본 비율로 결정된다. */
  width: number
  /** 도 단위 회전 */
  rotation: number
  /** 스티커끼리의 쌓임 순서. 클수록 위. */
  z: number
}

export type TodoItem = {
  text: string
  checked: boolean
}

export type HeaderConfig = {
  /** auto = 월 이름을 크게(MAY), custom = 자유 입력 */
  titleMode: 'auto' | 'custom'
  customTitle: string
  /** "2026.08" 표기 여부 */
  showYearMonth: boolean
  memo: { enabled: boolean; text: string }
  todo: { enabled: boolean; items: TodoItem[] }
}

/** 한 달치 문서. 저장 단위이자 preview/의 유일한 입력. */
export type ScheduleDoc = {
  version: 1
  year: number
  /** 1-12 */
  month: number
  header: HeaderConfig
  /** 키는 "2026-08-03" 형식. 해당 월의 날짜만 담는다. */
  days: Record<string, DayEntry>
  footer: { enabled: boolean; text: string }
  themeId: string
  fontId: string
  /** IndexedDB 에셋 참조. null이면 테마 기본 배경. */
  backgroundAssetId: string | null
  stickers: Sticker[]
}
```

- [ ] **Step 4: 빈 문서 생성 함수 작성**

기본 테마·폰트 id는 문자열 리터럴로 둔다. Task 6과 14에서 실제 정의가 생기며, 그때 id가 일치하는지 확인한다.

`src/model/defaults.ts`:

```ts
import type { DayEntry, ScheduleDoc } from './types'

export const DOC_VERSION = 1 as const

/** Task 6에서 themes.ts가 이 id를 반드시 제공해야 한다. */
export const DEFAULT_THEME_ID = 'pink'
/** Task 14에서 fonts.ts가 이 id를 반드시 제공해야 한다. */
export const DEFAULT_FONT_ID = 'pretendard'

export function createEmptyDayEntry(): DayEntry {
  return { text: '', dateColor: null, cellFill: null, marker: null }
}

export function createEmptyDoc(year: number, month: number): ScheduleDoc {
  return {
    version: DOC_VERSION,
    year,
    month,
    header: {
      titleMode: 'auto',
      customTitle: '',
      showYearMonth: true,
      memo: { enabled: false, text: '' },
      todo: { enabled: false, items: [] },
    },
    days: {},
    footer: { enabled: false, text: '' },
    themeId: DEFAULT_THEME_ID,
    fontId: DEFAULT_FONT_ID,
    backgroundAssetId: null,
    stickers: [],
  }
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npx vitest run src/model/defaults.test.ts`
Expected: PASS — 8 passed

- [ ] **Step 6: 커밋**

```bash
git add src/model
git commit -m "$(cat <<'EOF'
feat: 도메인 타입과 빈 문서 생성 함수 추가

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: 달력 격자 생성

이 프로젝트에서 조용히 틀리면 가장 치명적인 부분이다. 테스트를 촘촘히 건다.

**Files:**
- Create: `src/model/calendar.ts`
- Test: `src/model/calendar.test.ts`

**Interfaces:**
- Consumes: 없음 (순수 함수, 타입 의존 없음)
- Produces:
  - `type GridCell = { date: string; day: number; dow: number; inMonth: boolean }`
  - `buildMonthGrid(year: number, month: number): GridCell[]` — 항상 길이 42
  - `monthKey(year: number, month: number): string` — `"2026-08"`
  - `dateKey(year: number, month: number, day: number): string` — `"2026-08-03"`
  - `parseMonthKey(key: string): { year: number; month: number } | null`
  - `previousMonth(year, month): { year: number; month: number }`
  - `MONTH_NAMES_EN: string[]` — 길이 12, `'JANUARY'` … `'DECEMBER'`
  - `GRID_CELL_COUNT: 42`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/model/calendar.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  buildMonthGrid,
  dateKey,
  GRID_CELL_COUNT,
  MONTH_NAMES_EN,
  monthKey,
  parseMonthKey,
  previousMonth,
} from './calendar'

describe('buildMonthGrid', () => {
  it('어떤 달이든 항상 42칸이다', () => {
    for (let m = 1; m <= 12; m++) {
      expect(buildMonthGrid(2026, m)).toHaveLength(GRID_CELL_COUNT)
    }
    // 6주가 필요한 달과 5주로 끝나는 달 모두
    expect(buildMonthGrid(2026, 8)).toHaveLength(42)
    expect(buildMonthGrid(2025, 5)).toHaveLength(42)
  })

  it('첫 칸은 항상 일요일, 마지막 칸은 항상 토요일', () => {
    const grid = buildMonthGrid(2026, 8)
    expect(grid[0].dow).toBe(0)
    expect(grid[41].dow).toBe(6)
  })

  it('요일이 7칸 주기로 순환한다', () => {
    const grid = buildMonthGrid(2026, 3)
    grid.forEach((cell, i) => expect(cell.dow).toBe(i % 7))
  })

  it('2026년 8월 — 1일은 토요일이므로 앞에 6칸이 7월로 채워진다', () => {
    const grid = buildMonthGrid(2026, 8)
    expect(grid.slice(0, 6).every((c) => !c.inMonth)).toBe(true)
    expect(grid[5].date).toBe('2026-07-31')
    expect(grid[6]).toEqual({ date: '2026-08-01', day: 1, dow: 6, inMonth: true })
  })

  it('2025년 5월 — 1일은 목요일이므로 앞에 4칸이 4월로 채워진다', () => {
    const grid = buildMonthGrid(2025, 5)
    expect(grid.slice(0, 4).every((c) => !c.inMonth)).toBe(true)
    expect(grid[0].date).toBe('2025-04-27')
    expect(grid[4]).toEqual({ date: '2025-05-01', day: 1, dow: 4, inMonth: true })
  })

  it('해당 월의 날짜 개수가 실제 일수와 같다', () => {
    expect(buildMonthGrid(2026, 8).filter((c) => c.inMonth)).toHaveLength(31)
    expect(buildMonthGrid(2026, 9).filter((c) => c.inMonth)).toHaveLength(30)
    expect(buildMonthGrid(2026, 2).filter((c) => c.inMonth)).toHaveLength(28)
  })

  it('윤년 2월은 29일이다', () => {
    expect(buildMonthGrid(2024, 2).filter((c) => c.inMonth)).toHaveLength(29)
    expect(buildMonthGrid(2000, 2).filter((c) => c.inMonth)).toHaveLength(29)
    expect(buildMonthGrid(1900, 2).filter((c) => c.inMonth)).toHaveLength(28)
  })

  it('연말 경계 — 12월 격자는 다음 해 1월로 이어진다', () => {
    const grid = buildMonthGrid(2026, 12)
    const after = grid.filter((c) => !c.inMonth && c.date > '2026-12-31')
    expect(after[0].date).toBe('2027-01-01')
  })

  it('연초 경계 — 1월 격자는 이전 해 12월에서 시작한다', () => {
    const grid = buildMonthGrid(2026, 1)
    expect(grid[0].date.startsWith('2025-12')).toBe(true)
  })

  it('날짜가 하루씩 빠짐없이 이어진다', () => {
    const grid = buildMonthGrid(2026, 8)
    for (let i = 1; i < grid.length; i++) {
      const prev = Date.parse(grid[i - 1].date + 'T00:00:00Z')
      const cur = Date.parse(grid[i].date + 'T00:00:00Z')
      expect(cur - prev).toBe(86_400_000)
    }
  })

  it('day 필드는 date의 일(day) 부분과 일치한다', () => {
    for (const cell of buildMonthGrid(2026, 8)) {
      expect(cell.day).toBe(Number(cell.date.slice(8, 10)))
    }
  })
})

describe('키 함수', () => {
  it('monthKey는 월을 두 자리로 채운다', () => {
    expect(monthKey(2026, 8)).toBe('2026-08')
    expect(monthKey(2026, 12)).toBe('2026-12')
  })

  it('dateKey는 월·일을 두 자리로 채운다', () => {
    expect(dateKey(2026, 8, 3)).toBe('2026-08-03')
    expect(dateKey(2026, 11, 25)).toBe('2026-11-25')
  })

  it('parseMonthKey는 monthKey의 역함수다', () => {
    expect(parseMonthKey('2026-08')).toEqual({ year: 2026, month: 8 })
  })

  it('parseMonthKey는 잘못된 입력에 null을 준다', () => {
    expect(parseMonthKey('2026-13')).toBeNull()
    expect(parseMonthKey('2026-00')).toBeNull()
    expect(parseMonthKey('쓰레기')).toBeNull()
    expect(parseMonthKey('2026-8')).toBeNull()
  })
})

describe('previousMonth', () => {
  it('같은 해 안에서 한 달 뺀다', () => {
    expect(previousMonth(2026, 8)).toEqual({ year: 2026, month: 7 })
  })

  it('1월의 이전 달은 전년도 12월이다', () => {
    expect(previousMonth(2026, 1)).toEqual({ year: 2025, month: 12 })
  })
})

describe('MONTH_NAMES_EN', () => {
  it('12개이고 1월은 JANUARY다', () => {
    expect(MONTH_NAMES_EN).toHaveLength(12)
    expect(MONTH_NAMES_EN[0]).toBe('JANUARY')
    expect(MONTH_NAMES_EN[11]).toBe('DECEMBER')
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npx vitest run src/model/calendar.test.ts`
Expected: FAIL — `Failed to resolve import "./calendar"`

- [ ] **Step 3: 구현 작성**

`src/model/calendar.ts`:

```ts
export const GRID_COLUMNS = 7
export const GRID_ROWS = 6
export const GRID_CELL_COUNT = GRID_COLUMNS * GRID_ROWS

export const MONTH_NAMES_EN = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
] as const satisfies readonly string[]

export type GridCell = {
  /** "2026-08-03" */
  date: string
  /** 1-31 */
  day: number
  /** 0=일 … 6=토 */
  dow: number
  /** 표시 중인 달에 속하는 날짜인지 */
  inMonth: boolean
}

const pad2 = (n: number) => String(n).padStart(2, '0')

export function monthKey(year: number, month: number): string {
  return `${year}-${pad2(month)}`
}

export function dateKey(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`
}

export function parseMonthKey(key: string): { year: number; month: number } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(key)
  if (!m) return null
  const year = Number(m[1])
  const month = Number(m[2])
  if (month < 1 || month > 12) return null
  return { year, month }
}

export function previousMonth(year: number, month: number): { year: number; month: number } {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 }
}

/**
 * 년·월을 항상 42칸(7×6)의 격자로 펼친다.
 * 첫 칸은 그 달 1일이 속한 주의 일요일, 이후 42일 연속.
 * 시간대 버그를 피하기 위해 전 구간 UTC로 계산한다.
 */
export function buildMonthGrid(year: number, month: number): GridCell[] {
  const first = new Date(Date.UTC(year, month - 1, 1))
  const start = new Date(first)
  start.setUTCDate(start.getUTCDate() - first.getUTCDay())

  const cells: GridCell[] = []
  for (let i = 0; i < GRID_CELL_COUNT; i++) {
    const d = new Date(start)
    d.setUTCDate(start.getUTCDate() + i)
    cells.push({
      date: `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`,
      day: d.getUTCDate(),
      dow: d.getUTCDay(),
      inMonth: d.getUTCFullYear() === year && d.getUTCMonth() === month - 1,
    })
  }
  return cells
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/model/calendar.test.ts`
Expected: PASS — 18 passed

- [ ] **Step 5: 커밋**

```bash
git add src/model/calendar.ts src/model/calendar.test.ts
git commit -m "$(cat <<'EOF'
feat: 년·월을 42칸 고정 격자로 펼치는 calendar 모듈 추가

달마다 행 수가 달라지지 않도록 항상 7x6으로 고정한다.
시간대 버그를 피하기 위해 전 구간 UTC로 계산한다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: 문서 저장과 지난달 복사

**Files:**
- Create: `src/model/storage.ts`
- Create: `src/model/copyMonth.ts`
- Test: `src/model/storage.test.ts`
- Test: `src/model/copyMonth.test.ts`

**Interfaces:**
- Consumes: `ScheduleDoc`(Task 2), `createEmptyDoc`(Task 2), `buildMonthGrid`·`monthKey`·`GRID_CELL_COUNT`(Task 3)
- Produces:
  - `saveDoc(doc: ScheduleDoc): { ok: true } | { ok: false; reason: 'quota' | 'unknown' }`
  - `loadDoc(year: number, month: number): ScheduleDoc | null`
  - `listSavedMonthKeys(): string[]` — 오름차순 정렬
  - `migrateDoc(raw: unknown): ScheduleDoc | null`
  - `DOC_KEY_PREFIX: 'weekplanner:doc:'`
  - `copyMonthDays(source: ScheduleDoc, targetYear: number, targetMonth: number): ScheduleDoc`

- [ ] **Step 1: 지난달 복사 테스트 작성**

`src/model/copyMonth.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { buildMonthGrid } from './calendar'
import { copyMonthDays } from './copyMonth'
import { createEmptyDoc } from './defaults'

describe('copyMonthDays', () => {
  it('격자 위치 기준으로 옮기므로 요일이 보존된다', () => {
    // 2026-07-15는 수요일. 7월 격자의 인덱스 17이고, 8월 격자의 인덱스 17은 8/12(수)다.
    // 원본 달 앞쪽 날짜를 고르면 안 된다. 대상 달 밖으로 밀려나 버려진다(아래 테스트 참고).
    const src = createEmptyDoc(2026, 7)
    const srcGrid = buildMonthGrid(2026, 7)
    const idx = srcGrid.findIndex((c) => c.date === '2026-07-15')
    src.days['2026-07-15'] = {
      text: '수요일 방송', dateColor: null, cellFill: null, marker: null,
    }

    const out = copyMonthDays(src, 2026, 8)
    const dstGrid = buildMonthGrid(2026, 8)
    const landed = dstGrid[idx]

    expect(landed.inMonth).toBe(true)
    expect(landed.dow).toBe(srcGrid[idx].dow)
    expect(out.days[landed.date]?.text).toBe('수요일 방송')
  })

  it('옮겨간 일정은 모두 원래와 같은 요일에 놓인다', () => {
    const src = createEmptyDoc(2026, 7)
    const srcGrid = buildMonthGrid(2026, 7)
    for (const cell of srcGrid.filter((c) => c.inMonth)) {
      src.days[cell.date] = {
        text: cell.date, dateColor: null, cellFill: null, marker: null,
      }
    }

    const out = copyMonthDays(src, 2026, 8)
    const dowOf = (date: string) => new Date(date + 'T00:00:00Z').getUTCDay()

    for (const [landedDate, entry] of Object.entries(out.days)) {
      // entry.text가 원본 날짜다
      expect(dowOf(landedDate)).toBe(dowOf(entry.text))
    }
  })

  it('원본 달 앞부분은 대상 달 밖으로 밀려나 버려질 수 있다', () => {
    // 주는 7일이고 달은 28~31일이라, 요일을 보존하는 복사는 구조적으로
    // 양 끝에서 며칠을 잃는다. 이것은 결함이 아니라 요일 보존의 대가다.
    const src = createEmptyDoc(2026, 7)
    src.days['2026-07-01'] = { text: '7월 1일', dateColor: null, cellFill: null, marker: null }
    src.days['2026-07-15'] = { text: '7월 15일', dateColor: null, cellFill: null, marker: null }

    const out = copyMonthDays(src, 2026, 8)

    // 7/1은 8월 격자에서 7/29 자리에 떨어지므로 버려진다
    expect(Object.values(out.days).map((e) => e.text)).toEqual(['7월 15일'])
  })

  it('대상 년·월이 바뀐다', () => {
    const out = copyMonthDays(createEmptyDoc(2026, 7), 2026, 8)
    expect(out.year).toBe(2026)
    expect(out.month).toBe(8)
  })

  it('헤더·테마·폰트·하단 문구·스티커를 그대로 가져온다', () => {
    const src = createEmptyDoc(2026, 7)
    src.header.titleMode = 'custom'
    src.header.customTitle = '몬몬 스케줄'
    src.footer = { enabled: true, text: '공지' }
    src.themeId = 'mint'
    src.fontId = 'user-1'
    src.backgroundAssetId = 'bg-1'
    src.stickers = [{ id: 's1', assetId: 'a1', x: 10, y: 20, width: 300, rotation: 5, z: 1 }]

    const out = copyMonthDays(src, 2026, 8)

    expect(out.header.customTitle).toBe('몬몬 스케줄')
    expect(out.footer).toEqual({ enabled: true, text: '공지' })
    expect(out.themeId).toBe('mint')
    expect(out.fontId).toBe('user-1')
    expect(out.backgroundAssetId).toBe('bg-1')
    expect(out.stickers).toEqual(src.stickers)
  })

  it('대상 달 밖으로 떨어지는 칸의 내용은 버린다', () => {
    // 2026-07 격자의 0번 칸은 6/28(일)로 7월이 아니다.
    // 7월 마지막 날들이 8월 격자에서 범위를 벗어나는 경우를 확인한다.
    const src = createEmptyDoc(2026, 7)
    const srcGrid = buildMonthGrid(2026, 7)
    for (const cell of srcGrid) {
      src.days[cell.date] = {
        text: `내용-${cell.date}`, dateColor: null, cellFill: null, marker: null,
      }
    }

    const out = copyMonthDays(src, 2026, 8)
    const dstGrid = buildMonthGrid(2026, 8)
    const allowed = new Set(dstGrid.filter((c) => c.inMonth).map((c) => c.date))

    for (const key of Object.keys(out.days)) {
      expect(allowed.has(key)).toBe(true)
    }
  })

  it('원본을 변경하지 않는다', () => {
    const src = createEmptyDoc(2026, 7)
    src.days['2026-07-01'] = { text: '원본', dateColor: null, cellFill: null, marker: null }
    const out = copyMonthDays(src, 2026, 8)
    out.header.customTitle = '변경됨'
    expect(src.year).toBe(7 - 7 + 2026)
    expect(src.month).toBe(7)
    expect(src.header.customTitle).toBe('')
    expect(src.days['2026-07-01'].text).toBe('원본')
  })

  it('빈 칸은 복사하지 않는다', () => {
    const src = createEmptyDoc(2026, 7)
    const out = copyMonthDays(src, 2026, 8)
    expect(out.days).toEqual({})
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npx vitest run src/model/copyMonth.test.ts`
Expected: FAIL — `Failed to resolve import "./copyMonth"`

- [ ] **Step 3: 지난달 복사 구현**

`src/model/copyMonth.ts`:

```ts
import { buildMonthGrid } from './calendar'
import type { ScheduleDoc } from './types'

/**
 * 이전 달 문서를 대상 년·월로 복제한다.
 *
 * 일정은 날짜가 아니라 **격자 위치** 기준으로 옮긴다. 두 격자 모두 42칸이고
 * 같은 요일 열에 정렬되어 있으므로, n번째 칸을 n번째 칸으로 옮기면 요일이
 * 자동으로 보존된다. 방송 일정은 "매주 화요일"처럼 요일에 묶이는 경우가
 * 대부분이라 이쪽이 날짜 기준 복사보다 유용하다.
 *
 * 대상 달 밖(앞뒤 달 영역)으로 떨어지는 내용은 버린다.
 */
export function copyMonthDays(
  source: ScheduleDoc,
  targetYear: number,
  targetMonth: number,
): ScheduleDoc {
  const srcGrid = buildMonthGrid(source.year, source.month)
  const dstGrid = buildMonthGrid(targetYear, targetMonth)

  const days: ScheduleDoc['days'] = {}
  for (let i = 0; i < srcGrid.length; i++) {
    const entry = source.days[srcGrid[i].date]
    if (!entry) continue
    const target = dstGrid[i]
    if (!target.inMonth) continue
    days[target.date] = { ...entry }
  }

  return {
    ...structuredClone(source),
    year: targetYear,
    month: targetMonth,
    days,
  }
}
```

- [ ] **Step 4: 지난달 복사 테스트 통과 확인**

Run: `npx vitest run src/model/copyMonth.test.ts`
Expected: PASS — 8 passed

- [ ] **Step 5: 저장 테스트 작성**

`src/model/storage.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createEmptyDoc } from './defaults'
import { DOC_KEY_PREFIX, listSavedMonthKeys, loadDoc, migrateDoc, saveDoc } from './storage'

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('saveDoc / loadDoc', () => {
  it('저장한 문서를 그대로 되돌려준다', () => {
    const doc = createEmptyDoc(2026, 8)
    doc.header.customTitle = '몬몬 8월 스케줄'
    doc.days['2026-08-03'] = {
      text: '발로란트\n21:00', dateColor: '#ff0000', cellFill: '#ffe2d3', marker: '#ffe680',
    }

    expect(saveDoc(doc)).toEqual({ ok: true })
    expect(loadDoc(2026, 8)).toEqual(doc)
  })

  it('저장된 적 없는 달은 null이다', () => {
    expect(loadDoc(2026, 9)).toBeNull()
  })

  it('같은 달을 다시 저장하면 덮어쓴다', () => {
    const a = createEmptyDoc(2026, 8)
    a.footer = { enabled: true, text: '첫 번째' }
    saveDoc(a)
    const b = createEmptyDoc(2026, 8)
    b.footer = { enabled: true, text: '두 번째' }
    saveDoc(b)
    expect(loadDoc(2026, 8)?.footer.text).toBe('두 번째')
  })

  it('용량 초과를 quota로 보고한다', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      const err = new Error('quota') as Error & { name: string }
      err.name = 'QuotaExceededError'
      throw err
    })
    expect(saveDoc(createEmptyDoc(2026, 8))).toEqual({ ok: false, reason: 'quota' })
  })

  it('손상된 JSON은 null로 처리하고 예외를 던지지 않는다', () => {
    localStorage.setItem(`${DOC_KEY_PREFIX}2026-08`, '{망가진')
    expect(loadDoc(2026, 8)).toBeNull()
  })
})

describe('listSavedMonthKeys', () => {
  it('저장된 달만 오름차순으로 준다', () => {
    saveDoc(createEmptyDoc(2026, 9))
    saveDoc(createEmptyDoc(2026, 8))
    saveDoc(createEmptyDoc(2025, 12))
    localStorage.setItem('무관한키', 'x')
    expect(listSavedMonthKeys()).toEqual(['2025-12', '2026-08', '2026-09'])
  })

  it('저장된 게 없으면 빈 배열이다', () => {
    expect(listSavedMonthKeys()).toEqual([])
  })
})

describe('migrateDoc', () => {
  it('현재 버전 문서를 그대로 통과시킨다', () => {
    const doc = createEmptyDoc(2026, 8)
    expect(migrateDoc(doc)).toEqual(doc)
  })

  it('필수 필드가 없으면 null이다', () => {
    expect(migrateDoc({ version: 1 })).toBeNull()
    expect(migrateDoc({ year: 2026, month: 8 })).toBeNull()
    expect(migrateDoc(null)).toBeNull()
    expect(migrateDoc('문자열')).toBeNull()
  })

  it('모르는 미래 버전은 null이다', () => {
    expect(migrateDoc({ ...createEmptyDoc(2026, 8), version: 99 })).toBeNull()
  })

  it('빠진 선택 필드를 기본값으로 채운다', () => {
    const partial = createEmptyDoc(2026, 8) as Record<string, unknown>
    delete partial.stickers
    delete partial.footer
    const out = migrateDoc(partial)
    expect(out?.stickers).toEqual([])
    expect(out?.footer).toEqual({ enabled: false, text: '' })
  })
})
```

- [ ] **Step 6: 저장 테스트가 실패하는지 확인**

Run: `npx vitest run src/model/storage.test.ts`
Expected: FAIL — `Failed to resolve import "./storage"`

- [ ] **Step 7: 저장 구현**

`src/model/storage.ts`:

```ts
import { monthKey } from './calendar'
import { createEmptyDoc, DOC_VERSION } from './defaults'
import type { ScheduleDoc } from './types'

export const DOC_KEY_PREFIX = 'weekplanner:doc:'

export type SaveResult = { ok: true } | { ok: false; reason: 'quota' | 'unknown' }

export function saveDoc(doc: ScheduleDoc): SaveResult {
  try {
    localStorage.setItem(`${DOC_KEY_PREFIX}${monthKey(doc.year, doc.month)}`, JSON.stringify(doc))
    return { ok: true }
  } catch (err) {
    const name = err instanceof Error ? err.name : ''
    // 브라우저마다 이름이 다르다. Firefox는 NS_ERROR_DOM_QUOTA_REACHED를 쓴다.
    const isQuota = name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED'
    return { ok: false, reason: isQuota ? 'quota' : 'unknown' }
  }
}

export function loadDoc(year: number, month: number): ScheduleDoc | null {
  const raw = localStorage.getItem(`${DOC_KEY_PREFIX}${monthKey(year, month)}`)
  if (raw === null) return null
  try {
    return migrateDoc(JSON.parse(raw))
  } catch {
    return null
  }
}

export function listSavedMonthKeys(): string[] {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(DOC_KEY_PREFIX)) keys.push(key.slice(DOC_KEY_PREFIX.length))
  }
  return keys.sort()
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

/**
 * 저장된 데이터를 현재 문서 형태로 맞춘다.
 * 되살릴 수 없으면 null을 준다. 호출부는 null을 "새 문서로 시작"으로 처리한다.
 */
export function migrateDoc(raw: unknown): ScheduleDoc | null {
  if (!isObject(raw)) return null
  if (raw.version !== DOC_VERSION) return null
  if (typeof raw.year !== 'number' || typeof raw.month !== 'number') return null
  if (!isObject(raw.header) || !isObject(raw.days)) return null

  const base = createEmptyDoc(raw.year, raw.month)
  return {
    ...base,
    ...(raw as unknown as ScheduleDoc),
    header: { ...base.header, ...(raw.header as ScheduleDoc['header']) },
    footer: isObject(raw.footer) ? (raw.footer as ScheduleDoc['footer']) : base.footer,
    stickers: Array.isArray(raw.stickers) ? (raw.stickers as ScheduleDoc['stickers']) : [],
  }
}
```

- [ ] **Step 8: 전체 테스트 통과 확인**

Run: `npm test`
Expected: PASS — 모든 테스트 통과

- [ ] **Step 9: 커밋**

```bash
git add src/model
git commit -m "$(cat <<'EOF'
feat: 문서 저장/불러오기와 지난달 복사 추가

지난달 복사는 날짜가 아니라 격자 위치 기준으로 옮겨 요일을 보존한다.
저장 실패는 예외 대신 결과 객체로 보고해 호출부가 안내를 띄울 수 있게 한다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: IndexedDB 에셋 저장소

폰트와 이미지는 localStorage에 넣을 수 없다. 별도 계층으로 분리한다.

**이 태스크에는 jsdom·fake-indexeddb 관련 함정이 두 개 있다. 둘 다 실제 구현에서 확인된 것이다.**

- **Blob을 IndexedDB에 직접 넣으면 안 된다.** fake-indexeddb의 structured clone이 Blob을 빈 객체(`{}`)로 만들어 버려서 왕복 검증이 아예 불가능해진다. 내부적으로는 `ArrayBuffer`로 풀어서 저장하고 읽을 때 Blob을 다시 만든다. 실제 브라우저에서도 IndexedDB의 Blob 지원은 편차가 있어 이쪽이 더 안전하다.
- **`blob.arrayBuffer()`와 `blob.text()`를 쓰면 안 된다.** jsdom의 Blob에는 두 메서드가 없다. `FileReader`는 브라우저와 jsdom 모두에서 동작하므로 전부 그쪽으로 통일한다.

**Files:**
- Create: `src/model/assets.ts`
- Test: `src/model/assets.test.ts`

**Interfaces:**
- Consumes: Task 1의 `fake-indexeddb` 설정
- Produces:
  - `type AssetKind = 'image' | 'font'`
  - `type AssetRecord = { id: string; kind: AssetKind; name: string; mime: string; blob: Blob }`
  - `putAsset(input: { kind: AssetKind; name: string; mime: string; blob: Blob }): Promise<string>` — 생성된 id 반환
  - `getAsset(id: string): Promise<AssetRecord | null>`
  - `deleteAsset(id: string): Promise<void>`
  - `listAssets(kind?: AssetKind): Promise<AssetRecord[]>`
  - `blobToDataUrl(blob: Blob): Promise<string>`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/model/assets.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { blobToDataUrl, deleteAsset, getAsset, listAssets, putAsset } from './assets'

const makeBlob = (text: string, mime = 'image/png') => new Blob([text], { type: mime })

beforeEach(async () => {
  for (const asset of await listAssets()) await deleteAsset(asset.id)
})

describe('assets', () => {
  it('저장한 에셋을 되돌려준다', async () => {
    const id = await putAsset({
      kind: 'image', name: '캐릭터.png', mime: 'image/png', blob: makeBlob('데이터'),
    })
    const got = await getAsset(id)
    expect(got?.name).toBe('캐릭터.png')
    expect(got?.kind).toBe('image')
    expect(await got!.blob.text()).toBe('데이터')
  })

  it('없는 id는 null이다', async () => {
    expect(await getAsset('없음')).toBeNull()
  })

  it('저장할 때마다 다른 id를 만든다', async () => {
    const a = await putAsset({ kind: 'image', name: 'a', mime: 'image/png', blob: makeBlob('a') })
    const b = await putAsset({ kind: 'image', name: 'b', mime: 'image/png', blob: makeBlob('b') })
    expect(a).not.toBe(b)
  })

  it('종류로 거를 수 있다', async () => {
    await putAsset({ kind: 'image', name: 'i', mime: 'image/png', blob: makeBlob('i') })
    await putAsset({ kind: 'font', name: 'f', mime: 'font/woff2', blob: makeBlob('f', 'font/woff2') })

    expect(await listAssets('image')).toHaveLength(1)
    expect(await listAssets('font')).toHaveLength(1)
    expect(await listAssets()).toHaveLength(2)
  })

  it('삭제하면 사라진다', async () => {
    const id = await putAsset({ kind: 'image', name: 'x', mime: 'image/png', blob: makeBlob('x') })
    await deleteAsset(id)
    expect(await getAsset(id)).toBeNull()
  })

  it('없는 id를 삭제해도 예외가 없다', async () => {
    await expect(deleteAsset('없음')).resolves.toBeUndefined()
  })
})

describe('blobToDataUrl', () => {
  it('data: URL을 만든다', async () => {
    const url = await blobToDataUrl(makeBlob('안녕', 'text/plain'))
    expect(url.startsWith('data:text/plain;base64,')).toBe(true)
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npx vitest run src/model/assets.test.ts`
Expected: FAIL — `Failed to resolve import "./assets"`

- [ ] **Step 3: 구현 작성**

`src/model/assets.ts`:

```ts
const DB_NAME = 'weekplanner'
const DB_VERSION = 1
const STORE = 'assets'

export type AssetKind = 'image' | 'font'

export type AssetRecord = {
  id: string
  kind: AssetKind
  name: string
  mime: string
  blob: Blob
}

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('kind', 'kind', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode)
        const req = fn(tx.objectStore(STORE))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      }),
  )
}

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export async function putAsset(input: Omit<AssetRecord, 'id'>): Promise<string> {
  const record: AssetRecord = { id: newId(), ...input }
  await run('readwrite', (store) => store.put(record))
  return record.id
}

export async function getAsset(id: string): Promise<AssetRecord | null> {
  const result = await run<AssetRecord | undefined>('readonly', (store) => store.get(id))
  return result ?? null
}

export async function deleteAsset(id: string): Promise<void> {
  await run('readwrite', (store) => store.delete(id))
}

export async function listAssets(kind?: AssetKind): Promise<AssetRecord[]> {
  const all = await run<AssetRecord[]>('readonly', (store) => store.getAll())
  return kind ? all.filter((a) => a.kind === kind) : all
}

/** html-to-image가 외부 요청 없이 임베딩할 수 있도록 data: URL로 바꾼다. */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/model/assets.test.ts`
Expected: PASS — 7 passed

- [ ] **Step 5: 커밋**

```bash
git add src/model/assets.ts src/model/assets.test.ts
git commit -m "$(cat <<'EOF'
feat: IndexedDB 기반 에셋 저장소 추가

한글 폰트 하나가 2~10MB라 localStorage(약 5MB)에 넣을 수 없다.
폰트와 이미지는 IndexedDB에, 문서는 localStorage에 분리 보관한다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: 색상 테마 프리셋

**Files:**
- Create: `src/theme/themes.ts`
- Test: `src/theme/themes.test.ts`

**Interfaces:**
- Consumes: `DEFAULT_THEME_ID`(Task 2)
- Produces:
  - `type Theme` — 아래 Step 3의 필드 전부
  - `THEMES: Theme[]` — 길이 4
  - `getTheme(id: string): Theme` — 없는 id면 기본 테마
  - `ACCENT_COUNT: 6`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/theme/themes.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { DEFAULT_THEME_ID } from '../model/defaults'
import { ACCENT_COUNT, getTheme, THEMES } from './themes'

const HEX = /^#[0-9a-f]{6}$/i

describe('THEMES', () => {
  it('4종을 제공한다', () => {
    expect(THEMES).toHaveLength(4)
  })

  it('id가 중복되지 않는다', () => {
    expect(new Set(THEMES.map((t) => t.id)).size).toBe(THEMES.length)
  })

  it('기본 테마 id가 실제로 존재한다', () => {
    expect(THEMES.some((t) => t.id === DEFAULT_THEME_ID)).toBe(true)
  })

  it('모든 테마가 강조 팔레트 6색을 갖는다', () => {
    for (const theme of THEMES) {
      expect(theme.accents).toHaveLength(ACCENT_COUNT)
      for (const color of theme.accents) expect(color).toMatch(HEX)
    }
  })

  it('모든 색상 필드가 유효한 hex다', () => {
    const colorFields = [
      'pageBackground', 'borderColor', 'headerText', 'cellBackground', 'cellBorder',
      'bodyText', 'outsideMonthText', 'sundayText', 'saturdayText',
      'dowHeaderBackground', 'dowHeaderText',
    ] as const
    for (const theme of THEMES) {
      for (const field of colorFields) {
        expect(theme[field], `${theme.id}.${field}`).toMatch(HEX)
      }
    }
  })

  it('모든 테마에 이름이 있다', () => {
    for (const theme of THEMES) expect(theme.name.length).toBeGreaterThan(0)
  })
})

describe('getTheme', () => {
  it('id로 찾는다', () => {
    expect(getTheme('mint').id).toBe('mint')
  })

  it('없는 id면 기본 테마를 준다', () => {
    expect(getTheme('없는테마').id).toBe(DEFAULT_THEME_ID)
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npx vitest run src/theme/themes.test.ts`
Expected: FAIL — `Failed to resolve import "./themes"`

- [ ] **Step 3: 구현 작성**

`patternCss`는 CSS `background-image` 값이 그대로 들어간다. 배경 위에 얹히는 옅은 무늬용이며, 무늬가 없으면 `'none'`이다.

`src/theme/themes.ts`:

```ts
import { DEFAULT_THEME_ID } from '../model/defaults'

export const ACCENT_COUNT = 6

export type Theme = {
  id: string
  name: string
  /** 캔버스 전체 바탕 */
  pageBackground: string
  /** background-image 값. 무늬가 없으면 'none' */
  patternCss: string
  /** 격자와 캔버스 테두리 */
  borderColor: string
  /** 제목·년월 글자색 */
  headerText: string
  /** 날짜 칸 바탕 */
  cellBackground: string
  cellBorder: string
  /** 일정 텍스트 색 */
  bodyText: string
  /** 앞뒤 달 날짜의 흐린 색 */
  outsideMonthText: string
  sundayText: string
  saturdayText: string
  dowHeaderBackground: string
  dowHeaderText: string
  /** 칸 채우기·형광펜·날짜 색으로 고를 수 있는 색. 정확히 ACCENT_COUNT개. */
  accents: string[]
}

export const THEMES: Theme[] = [
  {
    id: 'pink',
    name: '핑크',
    pageBackground: '#f9c9d4',
    patternCss:
      'repeating-linear-gradient(45deg, rgba(255,255,255,0.28) 0 4px, transparent 4px 40px)',
    borderColor: '#5b3a42',
    headerText: '#5b3a42',
    cellBackground: '#fdf4f6',
    cellBorder: '#5b3a42',
    bodyText: '#5b3a42',
    outsideMonthText: '#c9a7b0',
    sundayText: '#e2445c',
    saturdayText: '#4a7bd0',
    dowHeaderBackground: '#f7a8bd',
    dowHeaderText: '#ffffff',
    accents: ['#ffd6e0', '#ffe9a8', '#c9ecc3', '#c5ddf7', '#e3d0f5', '#ffd2b3'],
  },
  {
    id: 'cream',
    name: '크림',
    pageBackground: '#f5eddf',
    patternCss: 'none',
    borderColor: '#4a4238',
    headerText: '#3d362c',
    cellBackground: '#fffdf8',
    cellBorder: '#4a4238',
    bodyText: '#3d362c',
    outsideMonthText: '#bcb2a2',
    sundayText: '#c94f3d',
    saturdayText: '#4a6fa5',
    dowHeaderBackground: '#e3d5bd',
    dowHeaderText: '#3d362c',
    accents: ['#ffe0b8', '#fff2b8', '#d9ecc6', '#c9e0ec', '#e6d5ef', '#f7cfc4'],
  },
  {
    id: 'mint',
    name: '민트',
    pageBackground: '#cfeee6',
    patternCss:
      'repeating-linear-gradient(0deg, rgba(255,255,255,0.3) 0 3px, transparent 3px 36px)',
    borderColor: '#2f5b53',
    headerText: '#2f5b53',
    cellBackground: '#f6fffc',
    cellBorder: '#2f5b53',
    bodyText: '#2f5b53',
    outsideMonthText: '#a5c6bf',
    sundayText: '#d9534f',
    saturdayText: '#3f7bb5',
    dowHeaderBackground: '#8fd3c3',
    dowHeaderText: '#1f4a42',
    accents: ['#c5f0e3', '#fff3bf', '#ffd6d6', '#cfe3ff', '#e6d9ff', '#ffe1c2'],
  },
  {
    id: 'dark',
    name: '다크',
    pageBackground: '#1f2130',
    patternCss: 'none',
    borderColor: '#5a5f7d',
    headerText: '#f2f3f8',
    cellBackground: '#2b2e42',
    cellBorder: '#4a4f6b',
    bodyText: '#e7e9f2',
    outsideMonthText: '#666b87',
    sundayText: '#ff8a8a',
    saturdayText: '#8ab6ff',
    dowHeaderBackground: '#3a3e58',
    dowHeaderText: '#f2f3f8',
    accents: ['#5c3f5e', '#5e563a', '#3a5a4c', '#3a4b6b', '#4b3f6b', '#6b4a3a'],
  },
]

export function getTheme(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES.find((t) => t.id === DEFAULT_THEME_ID)!
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/theme/themes.test.ts`
Expected: PASS — 8 passed

- [ ] **Step 5: 커밋**

```bash
git add src/theme
git commit -m "$(cat <<'EOF'
feat: 색상 테마 프리셋 4종(핑크/크림/민트/다크) 추가

테마 추가는 THEMES 배열에 객체 하나를 넣는 것으로 끝난다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: 텍스트 자동 맞춤

칸 크기는 절대 변하지 않는다. 글자가 칸에 맞춰 줄어든다. 크기를 고르는 로직은 순수 함수로 떼어내 테스트하고, DOM 측정만 컴포넌트에 남긴다.

**Files:**
- Create: `src/preview/fitText.ts`
- Create: `src/preview/AutoFitText.tsx`
- Test: `src/preview/fitText.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `type Measurement = { width: number; height: number }`
  - `type MeasureFn = (fontSize: number) => Measurement`
  - `chooseFontSize(opts: { measure: MeasureFn; maxWidth: number; maxHeight: number; baseSize: number; minSize: number }): { size: number; overflow: boolean }`
  - `AutoFitText` 컴포넌트 — props: `{ text: string; maxWidth: number; maxHeight: number; baseSize: number; minSize: number; lineHeight: number; color: string; markerColor: string | null; onOverflowChange?: (overflow: boolean) => void }`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/preview/fitText.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'
import { chooseFontSize, type MeasureFn } from './fitText'

/** 글자 하나가 fontSize×fontSize 정사각형이고, maxWidth 안에서 줄바꿈된다고 가정한 측정기. */
function fakeMeasure(charCount: number, boxWidth: number): MeasureFn {
  return (fontSize) => {
    const perLine = Math.max(1, Math.floor(boxWidth / fontSize))
    const lines = Math.ceil(charCount / perLine)
    return { width: Math.min(charCount, perLine) * fontSize, height: lines * fontSize }
  }
}

describe('chooseFontSize', () => {
  it('짧은 글은 기본 크기를 그대로 쓴다', () => {
    const result = chooseFontSize({
      measure: fakeMeasure(4, 500), maxWidth: 500, maxHeight: 150, baseSize: 44, minSize: 22,
    })
    expect(result.size).toBe(44)
    expect(result.overflow).toBe(false)
  })

  it('긴 글은 크기를 줄인다', () => {
    const result = chooseFontSize({
      measure: fakeMeasure(60, 500), maxWidth: 500, maxHeight: 150, baseSize: 44, minSize: 22,
    })
    expect(result.size).toBeLessThan(44)
    expect(result.size).toBeGreaterThanOrEqual(22)
  })

  it('고른 크기는 실제로 상자에 들어간다', () => {
    const measure = fakeMeasure(40, 500)
    const { size, overflow } = chooseFontSize({
      measure, maxWidth: 500, maxHeight: 150, baseSize: 44, minSize: 22,
    })
    if (!overflow) {
      const m = measure(size)
      expect(m.width).toBeLessThanOrEqual(500)
      expect(m.height).toBeLessThanOrEqual(150)
    }
  })

  it('한 단계 큰 크기는 넘친다 — 가능한 최대를 고른다', () => {
    const measure = fakeMeasure(40, 500)
    const { size, overflow } = chooseFontSize({
      measure, maxWidth: 500, maxHeight: 150, baseSize: 44, minSize: 22,
    })
    if (!overflow && size < 44) {
      const bigger = measure(size + 1)
      expect(bigger.width > 500 || bigger.height > 150).toBe(true)
    }
  })

  it('최소 크기로도 안 들어가면 overflow를 알리고 최소 크기를 준다', () => {
    const result = chooseFontSize({
      measure: fakeMeasure(2000, 500), maxWidth: 500, maxHeight: 150, baseSize: 44, minSize: 22,
    })
    expect(result.size).toBe(22)
    expect(result.overflow).toBe(true)
  })

  it('빈 글자는 기본 크기를 쓴다', () => {
    const result = chooseFontSize({
      measure: () => ({ width: 0, height: 0 }),
      maxWidth: 500, maxHeight: 150, baseSize: 44, minSize: 22,
    })
    expect(result.size).toBe(44)
    expect(result.overflow).toBe(false)
  })

  it('이진 탐색이므로 측정 횟수가 크기 범위보다 훨씬 적다', () => {
    const measure = vi.fn(fakeMeasure(60, 500))
    chooseFontSize({ measure, maxWidth: 500, maxHeight: 150, baseSize: 200, minSize: 10 })
    expect(measure.mock.calls.length).toBeLessThan(15)
  })

  it('baseSize와 minSize가 같으면 그 크기를 준다', () => {
    const result = chooseFontSize({
      measure: fakeMeasure(500, 500), maxWidth: 500, maxHeight: 150, baseSize: 30, minSize: 30,
    })
    expect(result.size).toBe(30)
    expect(result.overflow).toBe(true)
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npx vitest run src/preview/fitText.test.ts`
Expected: FAIL — `Failed to resolve import "./fitText"`

- [ ] **Step 3: 순수 함수 구현**

`src/preview/fitText.ts`:

```ts
export type Measurement = { width: number; height: number }
export type MeasureFn = (fontSize: number) => Measurement

export type FitOptions = {
  measure: MeasureFn
  maxWidth: number
  maxHeight: number
  baseSize: number
  minSize: number
}

export type FitResult = {
  /** 실제로 적용할 폰트 크기(px, 정수) */
  size: number
  /** 최소 크기로도 상자를 넘치는지 */
  overflow: boolean
}

/**
 * 상자에 들어가는 가장 큰 폰트 크기를 이진 탐색으로 찾는다.
 *
 * 크기가 커질수록 측정값도 커진다는 단조성을 가정한다. 텍스트 렌더링에서는
 * 항상 성립한다. 정수 크기만 다루므로 반복 횟수는 log2(baseSize - minSize)로
 * 묶인다 — 44~22 범위면 5회, 200~10 범위면 8회 안쪽이다.
 */
export function chooseFontSize(opts: FitOptions): FitResult {
  const { measure, maxWidth, maxHeight, baseSize, minSize } = opts
  const fits = (size: number) => {
    const m = measure(size)
    return m.width <= maxWidth && m.height <= maxHeight
  }

  if (fits(baseSize)) return { size: baseSize, overflow: false }
  if (baseSize <= minSize) return { size: minSize, overflow: true }
  if (!fits(minSize)) return { size: minSize, overflow: true }

  // minSize는 들어가고 baseSize는 안 들어간다. 그 사이 최대값을 찾는다.
  let lo = minSize // 들어감이 확인된 값
  let hi = baseSize // 안 들어감이 확인된 값
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2)
    if (fits(mid)) lo = mid
    else hi = mid
  }
  return { size: lo, overflow: false }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/preview/fitText.test.ts`
Expected: PASS — 8 passed

- [ ] **Step 5: AutoFitText 컴포넌트 작성**

**측정에 관한 함정이 하나 더 있다. 실제 구현에서 확인된 것이고, 증상이 엉뚱해서 잡기 어렵다.**

`scrollWidth`/`scrollHeight`는 **정수만 돌려준다.** 그런데 칸 폭은 `3800 / 7 - 28 = 514.857…`처럼 소수다. 측정용 probe에 `width: 514.857px`를 고정해두면 `scrollWidth`가 반올림되어 `515`로 나오고, `515 <= 514.857`이 **어떤 폰트 크기에서도 거짓**이 된다. 결과적으로 "무슨 크기를 써도 안 맞는다"로 판정되어 **모든 칸의 글자가 항상 최소 크기까지 줄어든다.** 화면에는 그냥 "글씨가 좀 작네"로 보여서 버그로 인식하기 어렵다.

두 가지를 같이 해야 한다.

- 상자 크기를 `Math.floor`로 내려서 비교한다.
- probe에 `width`를 고정하지 말고 `max-width`만 건다. `width`를 고정하면 `scrollWidth`가 항상 그 폭 이상이라 "실제 텍스트가 얼마나 넓은지"를 알 수 없다. absolute 요소는 shrink-to-fit이므로 `max-width`만 주면 콘텐츠 폭이 측정된다.

폰트가 로드되기 전에 측정하면 잘못된 크기가 나온다. 화면에서는 멀쩡해 보이는데 **내보낸 이미지에서만** 글자가 넘치거나 부자연스럽게 작아지는 형태로 드러나므로 발견이 늦다. `document.fonts.ready`와 `document.fonts.onloadingdone`을 모두 건다.

`src/preview/AutoFitText.tsx`:

```tsx
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { chooseFontSize } from './fitText'

export type AutoFitTextProps = {
  text: string
  maxWidth: number
  maxHeight: number
  baseSize: number
  minSize: number
  lineHeight: number
  color: string
  /** 형광펜 색. null이면 그리지 않는다. */
  markerColor: string | null
  onOverflowChange?: (overflow: boolean) => void
}

/**
 * 주어진 상자 안에 텍스트를 중앙 정렬로 채우되, 넘치면 폰트 크기를 줄인다.
 * 상자 크기는 절대 변하지 않는다.
 */
export function AutoFitText(props: AutoFitTextProps) {
  const { text, maxWidth, maxHeight, baseSize, minSize, lineHeight, color, markerColor } = props
  const probeRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState(baseSize)
  const [fontEpoch, setFontEpoch] = useState(0)

  // 폰트 로딩이 끝나면 다시 재게 만든다.
  useEffect(() => {
    let alive = true
    document.fonts.ready.then(() => {
      if (alive) setFontEpoch((n) => n + 1)
    })
    const onDone = () => setFontEpoch((n) => n + 1)
    document.fonts.addEventListener('loadingdone', onDone)
    return () => {
      alive = false
      document.fonts.removeEventListener('loadingdone', onDone)
    }
  }, [])

  useLayoutEffect(() => {
    const probe = probeRef.current
    if (!probe) return

    const result = chooseFontSize({
      measure: (fontSize) => {
        probe.style.fontSize = `${fontSize}px`
        return { width: probe.scrollWidth, height: probe.scrollHeight }
      },
      maxWidth,
      maxHeight,
      baseSize,
      minSize,
    })

    probe.style.fontSize = `${result.size}px`
    setSize(result.size)
    props.onOverflowChange?.(result.overflow)
    // props.onOverflowChange는 의도적으로 의존성에서 뺀다.
    // 부모가 인라인 함수를 넘기면 매 렌더마다 재측정이 돌기 때문이다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, maxWidth, maxHeight, baseSize, minSize, lineHeight, fontEpoch])

  const textStyle = {
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
    lineHeight,
    textAlign: 'center' as const,
  }

  return (
    <div
      style={{
        width: maxWidth,
        height: maxHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
        color,
      }}
    >
      {/* 측정용. 화면 밖에 두되 같은 폭 제약을 받게 한다. */}
      <div
        ref={probeRef}
        aria-hidden
        style={{
          ...textStyle,
          position: 'absolute',
          left: -99999,
          top: 0,
          width: maxWidth,
          visibility: 'hidden',
          pointerEvents: 'none',
        }}
      >
        {text}
      </div>

      <div style={{ ...textStyle, fontSize: size, width: maxWidth }}>
        {markerColor ? (
          <span
            style={{
              // 글자 아래쪽에만 색이 깔리는 형광펜 느낌
              backgroundImage: `linear-gradient(transparent 55%, ${markerColor} 55%)`,
              paddingInline: size * 0.08,
            }}
          >
            {text}
          </span>
        ) : (
          text
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: 타입 검사와 전체 테스트**

Run: `npx tsc -b && npm test`
Expected: 타입 에러 없음, 모든 테스트 통과

- [ ] **Step 7: 커밋**

```bash
git add src/preview
git commit -m "$(cat <<'EOF'
feat: 칸 크기를 유지한 채 글자를 맞추는 AutoFitText 추가

크기 선택은 순수 함수(chooseFontSize)로 분리해 테스트하고,
DOM 측정만 컴포넌트에 남긴다. 폰트 로딩 완료 후 반드시 재측정한다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

여기까지가 **모델·계산 계층**이다. Task 8부터는 화면에 그리기 시작한다.

## Task 8: 고정 캔버스와 축소 표시

이 태스크가 끝나면 브라우저에서 빈 캔버스가 화면 폭에 맞춰 보인다.

**Files:**
- Create: `src/preview/layout.ts`
- Create: `src/preview/ScheduleCanvas.tsx`
- Create: `src/editor/PreviewStage.tsx`
- Modify: `src/App.tsx`
- Test: `src/preview/layout.test.ts`

**Interfaces:**
- Consumes: `ScheduleDoc`(Task 2), `getTheme`(Task 6), `createEmptyDoc`(Task 2)
- Produces:
  - `layout.ts` 상수: `CANVAS_WIDTH` 4000, `CANVAS_HEIGHT` 2250, `OUTER_PADDING` 100, `HEADER_HEIGHT` 420, `DOW_ROW_HEIGHT` 90, `FOOTER_HEIGHT` 100, `GRID_WIDTH`, `GRID_HEIGHT`, `CELL_WIDTH`, `CELL_HEIGHT`, `CELL_PADDING`, `CELL_TEXT_BASE_SIZE` 44, `CELL_TEXT_MIN_SIZE` 22, `DATE_NUMBER_SIZE`
  - `ScheduleCanvas` — props `{ doc: ScheduleDoc }`, `forwardRef<HTMLDivElement>`. 내보내기 대상 노드다.
  - `PreviewStage` — props `{ children: ReactNode }`. 폭에 맞춰 축소한다.

- [ ] **Step 1: 레이아웃 상수 테스트 작성**

`src/preview/layout.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  CANVAS_HEIGHT, CANVAS_WIDTH, CELL_HEIGHT, CELL_WIDTH, DOW_ROW_HEIGHT,
  FOOTER_HEIGHT, GRID_HEIGHT, GRID_WIDTH, HEADER_HEIGHT, OUTER_PADDING,
} from './layout'

describe('레이아웃 상수', () => {
  it('캔버스는 4000×2250이다', () => {
    expect(CANVAS_WIDTH).toBe(4000)
    expect(CANVAS_HEIGHT).toBe(2250)
  })

  it('16:9 비율이다', () => {
    expect(CANVAS_WIDTH / CANVAS_HEIGHT).toBeCloseTo(16 / 9, 10)
  })

  it('세로 구성 요소의 합이 캔버스 높이와 정확히 같다', () => {
    const total = OUTER_PADDING * 2 + HEADER_HEIGHT + DOW_ROW_HEIGHT + GRID_HEIGHT + FOOTER_HEIGHT
    expect(total).toBe(CANVAS_HEIGHT)
  })

  it('가로 구성 요소의 합이 캔버스 폭과 정확히 같다', () => {
    expect(OUTER_PADDING * 2 + GRID_WIDTH).toBe(CANVAS_WIDTH)
  })

  it('칸 7개가 격자 폭을 채운다', () => {
    expect(CELL_WIDTH * 7).toBeCloseTo(GRID_WIDTH, 10)
  })

  it('칸 6줄이 격자 높이를 채운다', () => {
    expect(CELL_HEIGHT * 6).toBeCloseTo(GRID_HEIGHT, 10)
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npx vitest run src/preview/layout.test.ts`
Expected: FAIL — `Failed to resolve import "./layout"`

- [ ] **Step 3: 레이아웃 상수 작성**

**`box-sizing: border-box`인 요소의 테두리를 계산에서 빠뜨리지 말 것.** 실제 구현에서 두 번 걸렸다.

- 캔버스는 `border-box`에 테두리 10px + 패딩 100px이므로, 내용이 들어갈 공간은 `4000 - 20 - 200 = 3780`이다. 테두리를 빼먹고 3800으로 잡으면 오른쪽·아래 여백만 80px이 되어 좌우가 비대칭이 된다.
- 격자(`CalendarGrid`)도 테두리 5px씩을 가지므로, 격자 영역 상수는 **테두리를 포함한 바깥 크기**로 정의하고 컴포넌트에서 `border-box`로 써야 한다. `content-box`로 두면 실제 크기가 상수보다 가로세로 10px씩 커져서, 세로로는 flex가 격자를 눌러 압축하고 가로로는 캔버스를 넘어 잘린다.

`overflow: hidden` 때문에 화면상으로는 티가 잘 안 나므로, 렌더링 후 사방 여백이 모두 같은지 실측해서 확인하는 것이 확실하다.

`src/preview/layout.ts`:

```ts
import { GRID_COLUMNS, GRID_ROWS } from '../model/calendar'

/** 결과 이미지 원본 크기. 이 값을 다른 곳에 하드코딩하지 않는다. */
export const CANVAS_WIDTH = 4000
export const CANVAS_HEIGHT = 2250

export const OUTER_PADDING = 100
export const HEADER_HEIGHT = 420
export const DOW_ROW_HEIGHT = 90
export const FOOTER_HEIGHT = 100

export const GRID_WIDTH = CANVAS_WIDTH - OUTER_PADDING * 2 // 3800
export const GRID_HEIGHT =
  CANVAS_HEIGHT - OUTER_PADDING * 2 - HEADER_HEIGHT - DOW_ROW_HEIGHT - FOOTER_HEIGHT // 1440

export const CELL_WIDTH = GRID_WIDTH / GRID_COLUMNS // 542.857…
export const CELL_HEIGHT = GRID_HEIGHT / GRID_ROWS // 240

export const CELL_PADDING = 14
export const DATE_NUMBER_SIZE = 34
export const DATE_NUMBER_BLOCK = 46

/** 일정 텍스트가 쓸 수 있는 영역 */
export const CELL_TEXT_WIDTH = CELL_WIDTH - CELL_PADDING * 2
export const CELL_TEXT_HEIGHT = CELL_HEIGHT - CELL_PADDING * 2 - DATE_NUMBER_BLOCK

export const CELL_TEXT_BASE_SIZE = 44
export const CELL_TEXT_MIN_SIZE = 22
export const CELL_TEXT_LINE_HEIGHT = 1.25

export const BORDER_WIDTH = 5
export const CANVAS_BORDER_WIDTH = 10
export const CANVAS_BORDER_RADIUS = 40
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/preview/layout.test.ts`
Expected: PASS — 6 passed

- [ ] **Step 5: ScheduleCanvas 골격 작성**

지금은 배경과 테두리만 그린다. Task 9·10에서 내용이 채워진다.

`src/preview/ScheduleCanvas.tsx`:

```tsx
import { forwardRef } from 'react'
import type { ScheduleDoc } from '../model/types'
import { getTheme } from '../theme/themes'
import {
  CANVAS_BORDER_RADIUS, CANVAS_BORDER_WIDTH, CANVAS_HEIGHT, CANVAS_WIDTH, OUTER_PADDING,
} from './layout'

export type ScheduleCanvasProps = {
  doc: ScheduleDoc
}

/**
 * 미리보기 루트이자 이미지 내보내기 대상 노드.
 *
 * 이 트리 안에서는 px 이외의 단위를 쓰지 않는다. 화면 크기에 반응하는 순간
 * 미리보기와 내보낸 이미지가 어긋난다. 축소는 부모(PreviewStage)가 담당한다.
 */
export const ScheduleCanvas = forwardRef<HTMLDivElement, ScheduleCanvasProps>(
  function ScheduleCanvas({ doc }, ref) {
    const theme = getTheme(doc.themeId)

    return (
      <div
        ref={ref}
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          background: theme.pageBackground,
          backgroundImage: theme.patternCss,
          border: `${CANVAS_BORDER_WIDTH}px solid ${theme.borderColor}`,
          borderRadius: CANVAS_BORDER_RADIUS,
          padding: OUTER_PADDING,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
          color: theme.bodyText,
        }}
      />
    )
  },
)
```

- [ ] **Step 6: PreviewStage 작성**

**host의 높이를 measure한 배율로 계산하지 말 것.** 배율 변경 → 높이 변경 → 페이지 높이 변경 → 스크롤바 출현/소멸 → 폭 변경 → 배율 변경으로 이어지는 ResizeObserver 피드백 루프가 생긴다. 높이는 CSS `aspect-ratio`가 폭에서 유도하게 두고, 상태로는 레이아웃에 영향을 주지 않는 `transform`만 바꾼다.

**브라우저 자동화로 검증할 때 주의**: 탭이 `hidden` 상태면 Chrome이 `requestAnimationFrame`과 `ResizeObserver` 전달을 멈춘다. 그 상태에서는 창 크기 변경에 배율이 따라오는지 확인할 수 없고, 테스트 코드에서 rAF를 await하면 영영 풀리지 않는다. 라이브 리사이즈 확인은 사람이 보이는 창에서 해야 한다. 초기 측정 경로는 `useLayoutEffect`의 직접 호출이라 hidden 탭에서도 검증할 수 있다.

`src/editor/PreviewStage.tsx`:

```tsx
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../preview/layout'

export type PreviewStageProps = {
  children: ReactNode
}

/**
 * 4000×2250 캔버스를 화면 폭에 맞춰 축소해 보여준다.
 *
 * 축소는 이 래퍼가 담당하고 캔버스 자신은 원본 크기를 유지한다. 그래야
 * html-to-image가 캔버스 노드를 4000×2250 그대로 직렬화한다.
 */
export function PreviewStage({ children }: PreviewStageProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.1)

  useLayoutEffect(() => {
    const host = hostRef.current
    if (!host) return

    const update = () => setScale(host.clientWidth / CANVAS_WIDTH)
    update()

    const observer = new ResizeObserver(update)
    observer.observe(host)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    // ResizeObserver가 없는 환경(테스트 등)에서도 최소한 한 번은 맞춘다.
    const host = hostRef.current
    if (host && host.clientWidth > 0) setScale(host.clientWidth / CANVAS_WIDTH)
  }, [])

  return (
    <div ref={hostRef} style={{ width: '100%', height: CANVAS_HEIGHT * scale, overflow: 'hidden' }}>
      <div
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 7: App에 연결**

`src/App.tsx`:

```tsx
import { useRef } from 'react'
import { PreviewStage } from './editor/PreviewStage'
import { createEmptyDoc } from './model/defaults'
import { ScheduleCanvas } from './preview/ScheduleCanvas'

export default function App() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const doc = createEmptyDoc(2026, 8)

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20 }}>월간 스케줄표 만들기</h1>
      <PreviewStage>
        <ScheduleCanvas ref={canvasRef} doc={doc} />
      </PreviewStage>
    </div>
  )
}
```

- [ ] **Step 8: 개발 서버로 눈으로 확인**

Run: `npm run dev`
Expected: 브라우저에서 핑크색 바탕에 둥근 테두리를 가진 16:9 빈 캔버스가 보인다. 창 폭을 줄였다 늘리면 캔버스가 폭에 맞춰 따라 줄었다 늘어난다.

- [ ] **Step 9: 타입 검사와 전체 테스트**

Run: `npx tsc -b && npm test`
Expected: 타입 에러 없음, 모든 테스트 통과

- [ ] **Step 10: 커밋**

```bash
git add src/preview src/editor src/App.tsx
git commit -m "$(cat <<'EOF'
feat: 4000x2250 고정 캔버스와 화면 폭 축소 표시 추가

축소는 PreviewStage가 맡고 캔버스는 원본 크기를 유지한다.
그래야 내보내기가 4000x2250 그대로 직렬화된다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: 격자와 날짜 칸

**Files:**
- Create: `src/preview/DayCell.tsx`
- Create: `src/preview/CalendarGrid.tsx`
- Modify: `src/preview/ScheduleCanvas.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `GridCell`·`buildMonthGrid`(Task 3), `Theme`·`getTheme`(Task 6), `AutoFitText`(Task 7), `layout.ts` 상수(Task 8), `DayEntry`(Task 2)
- Produces:
  - `DayCell` — props `{ cell: GridCell; entry: DayEntry | undefined; theme: Theme }`
  - `CalendarGrid` — props `{ doc: ScheduleDoc; theme: Theme }`
  - `DOW_LABELS: readonly string[]` (`CalendarGrid.tsx`에서 export, 길이 7, `'SUN'` … `'SAT'`)
  - `dateNumberColor(cell: GridCell, entry: DayEntry | undefined, theme: Theme): string` (`DayCell.tsx`에서 export)

- [ ] **Step 1: 날짜 숫자 색 결정 테스트 작성**

강조 색이 요일 기본 규칙보다 우선한다는 규칙(스펙 6.4)을 여기서 못 박는다.

`src/preview/DayCell.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { GridCell } from '../model/calendar'
import type { DayEntry } from '../model/types'
import { getTheme } from '../theme/themes'
import { dateNumberColor } from './DayCell'

const theme = getTheme('pink')
const cell = (dow: number, inMonth = true): GridCell => ({
  date: '2026-08-03', day: 3, dow, inMonth,
})
const entry = (dateColor: string | null): DayEntry => ({
  text: '', dateColor, cellFill: null, marker: null,
})

describe('dateNumberColor', () => {
  it('일요일은 기본으로 일요일 색이다', () => {
    expect(dateNumberColor(cell(0), undefined, theme)).toBe(theme.sundayText)
  })

  it('토요일은 기본으로 토요일 색이다', () => {
    expect(dateNumberColor(cell(6), undefined, theme)).toBe(theme.saturdayText)
  })

  it('평일은 기본 본문 색이다', () => {
    expect(dateNumberColor(cell(3), undefined, theme)).toBe(theme.bodyText)
  })

  it('앞뒤 달 날짜는 흐린 색이며 요일 규칙보다 우선한다', () => {
    expect(dateNumberColor(cell(0, false), undefined, theme)).toBe(theme.outsideMonthText)
  })

  it('지정한 색이 요일 기본 규칙을 이긴다', () => {
    expect(dateNumberColor(cell(0), entry('#00ff00'), theme)).toBe('#00ff00')
  })

  it('색을 지정하지 않은 항목은 요일 규칙을 따른다', () => {
    expect(dateNumberColor(cell(0), entry(null), theme)).toBe(theme.sundayText)
  })

  it('앞뒤 달 칸은 지정 색이 있어도 흐린 색이다', () => {
    expect(dateNumberColor(cell(0, false), entry('#00ff00'), theme)).toBe(theme.outsideMonthText)
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npx vitest run src/preview/DayCell.test.ts`
Expected: FAIL — `Failed to resolve import "./DayCell"`

- [ ] **Step 3: DayCell 작성**

`src/preview/DayCell.tsx`:

```tsx
import type { GridCell } from '../model/calendar'
import type { DayEntry } from '../model/types'
import type { Theme } from '../theme/themes'
import { AutoFitText } from './AutoFitText'
import {
  BORDER_WIDTH, CELL_HEIGHT, CELL_PADDING, CELL_TEXT_BASE_SIZE, CELL_TEXT_HEIGHT,
  CELL_TEXT_LINE_HEIGHT, CELL_TEXT_MIN_SIZE, CELL_TEXT_WIDTH, CELL_WIDTH,
  DATE_NUMBER_BLOCK, DATE_NUMBER_SIZE,
} from './layout'

/**
 * 날짜 숫자 색을 정한다. 우선순위:
 * 1) 앞뒤 달 칸이면 무조건 흐린 색
 * 2) 항목에 지정한 색이 있으면 그 색 (요일 기본 규칙보다 우선)
 * 3) 일요일/토요일 기본 색
 * 4) 본문 색
 */
export function dateNumberColor(
  cell: GridCell,
  entry: DayEntry | undefined,
  theme: Theme,
): string {
  if (!cell.inMonth) return theme.outsideMonthText
  if (entry?.dateColor) return entry.dateColor
  if (cell.dow === 0) return theme.sundayText
  if (cell.dow === 6) return theme.saturdayText
  return theme.bodyText
}

export type DayCellProps = {
  cell: GridCell
  entry: DayEntry | undefined
  theme: Theme
}

export function DayCell({ cell, entry, theme }: DayCellProps) {
  const text = cell.inMonth ? (entry?.text ?? '') : ''

  return (
    <div
      style={{
        width: CELL_WIDTH,
        height: CELL_HEIGHT,
        boxSizing: 'border-box',
        borderRight: `${BORDER_WIDTH}px solid ${theme.cellBorder}`,
        borderBottom: `${BORDER_WIDTH}px solid ${theme.cellBorder}`,
        background: (cell.inMonth && entry?.cellFill) || theme.cellBackground,
        padding: CELL_PADDING,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: DATE_NUMBER_BLOCK,
          fontSize: DATE_NUMBER_SIZE,
          fontWeight: 800,
          lineHeight: 1,
          color: dateNumberColor(cell, entry, theme),
          flexShrink: 0,
        }}
      >
        {cell.day}
      </div>

      <AutoFitText
        text={text}
        maxWidth={CELL_TEXT_WIDTH}
        maxHeight={CELL_TEXT_HEIGHT}
        baseSize={CELL_TEXT_BASE_SIZE}
        minSize={CELL_TEXT_MIN_SIZE}
        lineHeight={CELL_TEXT_LINE_HEIGHT}
        color={cell.inMonth ? theme.bodyText : theme.outsideMonthText}
        markerColor={cell.inMonth ? (entry?.marker ?? null) : null}
      />
    </div>
  )
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/preview/DayCell.test.ts`
Expected: PASS — 7 passed

- [ ] **Step 5: CalendarGrid 작성**

`src/preview/CalendarGrid.tsx`:

```tsx
import { buildMonthGrid, GRID_COLUMNS } from '../model/calendar'
import type { ScheduleDoc } from '../model/types'
import type { Theme } from '../theme/themes'
import { DayCell } from './DayCell'
import { BORDER_WIDTH, DOW_ROW_HEIGHT, GRID_WIDTH } from './layout'

export const DOW_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const

export type CalendarGridProps = {
  doc: ScheduleDoc
  theme: Theme
}

export function CalendarGrid({ doc, theme }: CalendarGridProps) {
  const cells = buildMonthGrid(doc.year, doc.month)

  return (
    <div
      style={{
        width: GRID_WIDTH,
        border: `${BORDER_WIDTH}px solid ${theme.cellBorder}`,
        boxSizing: 'content-box',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', height: DOW_ROW_HEIGHT }}>
        {DOW_LABELS.map((label, index) => (
          <div
            key={label}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 40,
              fontWeight: 800,
              letterSpacing: 2,
              background: theme.dowHeaderBackground,
              color:
                index === 0
                  ? theme.sundayText
                  : index === 6
                    ? theme.saturdayText
                    : theme.dowHeaderText,
              borderRight:
                index === GRID_COLUMNS - 1 ? 'none' : `${BORDER_WIDTH}px solid ${theme.cellBorder}`,
              boxSizing: 'border-box',
            }}
          >
            {label}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID_COLUMNS}, 1fr)` }}>
        {cells.map((cell) => (
          <DayCell key={cell.date} cell={cell} entry={doc.days[cell.date]} theme={theme} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: ScheduleCanvas에 격자 연결**

`src/preview/ScheduleCanvas.tsx`의 반환 `<div>`를 자식이 있는 형태로 바꾼다. 헤더 자리는 Task 10에서 채우므로 지금은 높이만 확보한다.

```tsx
import { forwardRef } from 'react'
import type { ScheduleDoc } from '../model/types'
import { getTheme } from '../theme/themes'
import { CalendarGrid } from './CalendarGrid'
import {
  CANVAS_BORDER_RADIUS, CANVAS_BORDER_WIDTH, CANVAS_HEIGHT, CANVAS_WIDTH,
  FOOTER_HEIGHT, HEADER_HEIGHT, OUTER_PADDING,
} from './layout'

export type ScheduleCanvasProps = {
  doc: ScheduleDoc
}

/**
 * 미리보기 루트이자 이미지 내보내기 대상 노드.
 *
 * 이 트리 안에서는 px 이외의 단위를 쓰지 않는다. 화면 크기에 반응하는 순간
 * 미리보기와 내보낸 이미지가 어긋난다. 축소는 부모(PreviewStage)가 담당한다.
 */
export const ScheduleCanvas = forwardRef<HTMLDivElement, ScheduleCanvasProps>(
  function ScheduleCanvas({ doc }, ref) {
    const theme = getTheme(doc.themeId)

    return (
      <div
        ref={ref}
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          background: theme.pageBackground,
          backgroundImage: theme.patternCss,
          border: `${CANVAS_BORDER_WIDTH}px solid ${theme.borderColor}`,
          borderRadius: CANVAS_BORDER_RADIUS,
          padding: OUTER_PADDING,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
          color: theme.bodyText,
        }}
      >
        <div style={{ height: HEADER_HEIGHT, flexShrink: 0 }} />
        <CalendarGrid doc={doc} theme={theme} />
        <div style={{ height: FOOTER_HEIGHT, flexShrink: 0 }} />
      </div>
    )
  },
)
```

- [ ] **Step 7: App에서 눈으로 확인할 샘플 데이터 넣기**

`src/App.tsx`의 `doc` 생성 부분을 바꾼다.

```tsx
import { useRef } from 'react'
import { PreviewStage } from './editor/PreviewStage'
import { createEmptyDoc } from './model/defaults'
import { ScheduleCanvas } from './preview/ScheduleCanvas'

function sampleDoc() {
  const doc = createEmptyDoc(2026, 8)
  doc.days['2026-08-01'] = {
    text: '저챗\n20:00', dateColor: null, cellFill: null, marker: null,
  }
  doc.days['2026-08-03'] = {
    text: '발로란트 랭크 올리기 방송\n플래티넘 찍을 때까지 안 잠',
    dateColor: null, cellFill: null, marker: '#ffe680',
  }
  doc.days['2026-08-06'] = {
    text: '신작 게임', dateColor: '#e2445c', cellFill: '#ffd6e0', marker: null,
  }
  return doc
}

export default function App() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const doc = sampleDoc()

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20 }}>월간 스케줄표 만들기</h1>
      <PreviewStage>
        <ScheduleCanvas ref={canvasRef} doc={doc} />
      </PreviewStage>
    </div>
  )
}
```

- [ ] **Step 8: 눈으로 확인**

Run: `npm run dev`
Expected: 7열 × 6행 격자가 보인다. 확인할 것 —
- 2026년 8월 1일이 토요일 칸(SAT 열, 첫 줄)에 있다
- 앞뒤 달 날짜가 흐리게 보인다
- **8월 1일의 짧은 텍스트가 기본 크기(44px)로 나온다.** 짧은 글까지 작게 나오면 Task 7 Step 5의 반올림 함정에 걸린 것이다
- 8월 3일의 긴 텍스트가 자동으로 작아져 칸 안에 들어간다
- 8월 3일 텍스트에 노란 형광펜이 깔린다
- 8월 6일 칸이 분홍으로 채워지고 날짜 숫자가 빨갛다
- 일요일 날짜가 빨간색이다

`src/App.tsx`의 `createEmptyDoc(2026, 8)`을 `(2026, 2)`로 잠깐 바꿔 2월도 42칸 그대로인지 확인한 뒤 되돌린다.

- [ ] **Step 9: 타입 검사와 전체 테스트**

Run: `npx tsc -b && npm test`
Expected: 타입 에러 없음, 모든 테스트 통과

- [ ] **Step 10: 커밋**

```bash
git add src/preview src/App.tsx
git commit -m "$(cat <<'EOF'
feat: 달력 격자와 날짜 칸 렌더링 추가

날짜 숫자 색 우선순위(앞뒤 달 > 지정 색 > 요일 기본)를 순수 함수로 분리해
테스트한다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: 헤더와 하단 문구

**Files:**
- Create: `src/preview/Header.tsx`
- Create: `src/preview/MemoBox.tsx`
- Create: `src/preview/TodoBox.tsx`
- Create: `src/preview/Footer.tsx`
- Modify: `src/preview/ScheduleCanvas.tsx`
- Test: `src/preview/Header.test.ts`

**Interfaces:**
- Consumes: `HeaderConfig`·`ScheduleDoc`(Task 2), `MONTH_NAMES_EN`(Task 3), `Theme`(Task 6), `layout.ts`(Task 8)
- Produces:
  - `headerTitleText(header: HeaderConfig, month: number): string` (`Header.tsx`에서 export)
  - `Header` — props `{ header: HeaderConfig; year: number; month: number; theme: Theme }`
  - `MemoBox` — props `{ text: string; theme: Theme }`
  - `TodoBox` — props `{ items: TodoItem[]; theme: Theme }`
  - `Footer` — props `{ text: string; theme: Theme }`

- [ ] **Step 1: 제목 결정 테스트 작성**

`src/preview/Header.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { createEmptyDoc } from '../model/defaults'
import { headerTitleText } from './Header'

const header = (patch: Partial<ReturnType<typeof createEmptyDoc>['header']> = {}) => ({
  ...createEmptyDoc(2026, 8).header,
  ...patch,
})

describe('headerTitleText', () => {
  it('auto 모드는 영문 월 이름을 쓴다', () => {
    expect(headerTitleText(header({ titleMode: 'auto' }), 8)).toBe('AUGUST')
    expect(headerTitleText(header({ titleMode: 'auto' }), 5)).toBe('MAY')
  })

  it('custom 모드는 입력한 제목을 쓴다', () => {
    expect(headerTitleText(header({ titleMode: 'custom', customTitle: '몬몬 8월 스케줄' }), 8))
      .toBe('몬몬 8월 스케줄')
  })

  it('custom인데 비어 있으면 영문 월 이름으로 되돌아간다', () => {
    expect(headerTitleText(header({ titleMode: 'custom', customTitle: '' }), 8)).toBe('AUGUST')
    expect(headerTitleText(header({ titleMode: 'custom', customTitle: '   ' }), 8)).toBe('AUGUST')
  })

  it('custom 제목의 앞뒤 공백을 다듬는다', () => {
    expect(headerTitleText(header({ titleMode: 'custom', customTitle: '  제목  ' }), 8))
      .toBe('제목')
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npx vitest run src/preview/Header.test.ts`
Expected: FAIL — `Failed to resolve import "./Header"`

- [ ] **Step 3: MemoBox, TodoBox, Footer 작성**

`src/preview/MemoBox.tsx`:

```tsx
import type { Theme } from '../theme/themes'
import { BORDER_WIDTH } from './layout'

export type MemoBoxProps = {
  text: string
  theme: Theme
}

const MEMO_LINE_COUNT = 4

export function MemoBox({ text, theme }: MemoBoxProps) {
  return (
    <div style={{ width: 620, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 38, fontWeight: 800, color: theme.headerText }}>MEMO</div>
      <div style={{ position: 'relative', height: 190 }}>
        {Array.from({ length: MEMO_LINE_COUNT }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: (i + 1) * (190 / MEMO_LINE_COUNT) - BORDER_WIDTH,
              height: BORDER_WIDTH,
              background: theme.borderColor,
            }}
          />
        ))}
        <div
          style={{
            fontSize: 30,
            lineHeight: `${190 / MEMO_LINE_COUNT}px`,
            color: theme.bodyText,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflow: 'hidden',
            height: 190,
          }}
        >
          {text}
        </div>
      </div>
    </div>
  )
}
```

`src/preview/TodoBox.tsx`:

```tsx
import type { TodoItem } from '../model/types'
import type { Theme } from '../theme/themes'
import { BORDER_WIDTH } from './layout'

export type TodoBoxProps = {
  items: TodoItem[]
  theme: Theme
}

export function TodoBox({ items, theme }: TodoBoxProps) {
  return (
    <div
      style={{
        width: 900,
        height: 240,
        border: `${BORDER_WIDTH}px solid ${theme.borderColor}`,
        padding: 24,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <div style={{ fontSize: 38, fontWeight: 800, color: theme.headerText, marginBottom: 12 }}>
        To Do List
      </div>
      {items.map((item, index) => (
        <div
          key={index}
          style={{ display: 'flex', alignItems: 'center', gap: 14, height: 46, fontSize: 28 }}
        >
          <span
            style={{
              width: 28,
              height: 28,
              border: `${BORDER_WIDTH - 2}px solid ${theme.borderColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              lineHeight: 1,
              flexShrink: 0,
              color: theme.bodyText,
            }}
          >
            {item.checked ? 'V' : ''}
          </span>
          <span
            style={{
              color: theme.bodyText,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {item.text}
          </span>
        </div>
      ))}
    </div>
  )
}
```

`src/preview/Footer.tsx`:

```tsx
import type { Theme } from '../theme/themes'
import { FOOTER_HEIGHT } from './layout'

export type FooterProps = {
  text: string
  theme: Theme
}

export function Footer({ text, theme }: FooterProps) {
  return (
    <div
      style={{
        height: FOOTER_HEIGHT,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 30,
        color: theme.bodyText,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        flexShrink: 0,
      }}
    >
      {text}
    </div>
  )
}
```

- [ ] **Step 4: Header 작성**

`src/preview/Header.tsx`:

```tsx
import { MONTH_NAMES_EN } from '../model/calendar'
import type { HeaderConfig } from '../model/types'
import type { Theme } from '../theme/themes'
import { HEADER_HEIGHT } from './layout'
import { MemoBox } from './MemoBox'
import { TodoBox } from './TodoBox'

/**
 * 표시할 제목 문자열을 정한다.
 * custom 모드인데 내용이 비었으면 영문 월 이름으로 되돌아간다.
 * 그래야 제목이 통째로 사라지는 일이 없다.
 */
export function headerTitleText(header: HeaderConfig, month: number): string {
  if (header.titleMode === 'custom') {
    const trimmed = header.customTitle.trim()
    if (trimmed.length > 0) return trimmed
  }
  return MONTH_NAMES_EN[month - 1]
}

export type HeaderProps = {
  header: HeaderConfig
  year: number
  month: number
  theme: Theme
}

export function Header({ header, year, month, theme }: HeaderProps) {
  const title = headerTitleText(header, month)
  const titleSize = title.length <= 10 ? 170 : 110

  return (
    <div
      style={{
        height: HEADER_HEIGHT,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 60,
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {header.showYearMonth && (
          <div style={{ fontSize: 44, fontWeight: 600, color: theme.headerText, lineHeight: 1.2 }}>
            {year}.{String(month).padStart(2, '0')}
          </div>
        )}
        <div
          style={{
            fontSize: titleSize,
            fontWeight: 900,
            letterSpacing: -2,
            lineHeight: 1.05,
            color: theme.headerText,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {title}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 60, alignItems: 'flex-start', flexShrink: 0 }}>
        {header.memo.enabled && <MemoBox text={header.memo.text} theme={theme} />}
        {header.todo.enabled && <TodoBox items={header.todo.items} theme={theme} />}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npx vitest run src/preview/Header.test.ts`
Expected: PASS — 4 passed

- [ ] **Step 6: ScheduleCanvas에 연결**

`ScheduleCanvas.tsx`에서 자리만 잡아둔 두 `<div>`를 실제 컴포넌트로 교체한다.

import에 `Footer`, `Header`를 추가하고, `HEADER_HEIGHT`·`FOOTER_HEIGHT` import는 제거한다(더 이상 직접 쓰지 않는다). 본문은 이렇게 바뀐다.

```tsx
        <Header header={doc.header} year={doc.year} month={doc.month} theme={theme} />
        <CalendarGrid doc={doc} theme={theme} />
        {doc.footer.enabled ? (
          <Footer text={doc.footer.text} theme={theme} />
        ) : (
          <div style={{ height: FOOTER_HEIGHT, flexShrink: 0 }} />
        )}
```

`FOOTER_HEIGHT`는 하단 문구가 꺼졌을 때도 격자 위치가 변하지 않게 하려면 여전히 필요하다. import를 유지한다.

- [ ] **Step 7: App 샘플에 헤더 내용 추가**

`src/App.tsx`의 `sampleDoc()` 안, `return doc` 앞에 넣는다.

```tsx
  doc.header.memo = { enabled: true, text: '8월은 휴방이 많아요\n양해 부탁드립니다' }
  doc.header.todo = {
    enabled: true,
    items: [
      { text: '신작 게임 리스트 정리', checked: true },
      { text: '합방 일정 확정', checked: false },
      { text: '썸네일 새로 만들기', checked: false },
    ],
  }
  doc.footer = { enabled: true, text: '*방송 일정은 사정에 따라 변경될 수 있어요 :D' }
```

- [ ] **Step 8: 눈으로 확인**

Run: `npm run dev`
Expected: 왼쪽에 `2026.08`과 `AUGUST`, 오른쪽에 MEMO 줄노트와 To Do List 상자, 격자 아래 안내 문구가 보인다.

`titleMode`를 `'custom'`, `customTitle`을 `'몬몬 8월 스케줄'`로 바꿔 한글 제목도 잘리지 않는지 확인한 뒤 되돌린다.

- [ ] **Step 9: 타입 검사와 전체 테스트**

Run: `npx tsc -b && npm test`
Expected: 타입 에러 없음, 모든 테스트 통과

- [ ] **Step 10: 커밋**

```bash
git add src/preview src/App.tsx
git commit -m "$(cat <<'EOF'
feat: 헤더(제목/년월/MEMO/To Do)와 하단 문구 렌더링 추가

하단 문구를 꺼도 격자 위치가 변하지 않도록 높이를 유지한다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: 문서 상태와 자동 저장

`preview/`는 여기서 끝나고 `editor/`가 시작된다. 이 훅이 둘 사이의 유일한 접점이다.

**Files:**
- Create: `src/state/useScheduleDoc.ts`
- Modify: `src/App.tsx`
- Test: `src/state/useScheduleDoc.test.ts`

**Interfaces:**
- Consumes: `ScheduleDoc`·`createEmptyDoc`(Task 2), `previousMonth`(Task 3), `saveDoc`·`loadDoc`(Task 4), `copyMonthDays`(Task 4)
- Produces:
  - `useScheduleDoc(initialYear: number, initialMonth: number): ScheduleDocApi`
  - `type ScheduleDocApi = { doc: ScheduleDoc; setDoc: (updater: (prev: ScheduleDoc) => ScheduleDoc) => void; goToMonth: (year: number, month: number) => void; copyFromPreviousMonth: () => 'ok' | 'no-source'; saveError: 'quota' | 'unknown' | null }`
  - `AUTOSAVE_DELAY_MS: 400`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/state/useScheduleDoc.test.ts`:

```ts
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadDoc, saveDoc } from '../model/storage'
import { createEmptyDoc } from '../model/defaults'
import { AUTOSAVE_DELAY_MS, useScheduleDoc } from './useScheduleDoc'

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const flushAutosave = () => act(() => void vi.advanceTimersByTime(AUTOSAVE_DELAY_MS + 10))

describe('useScheduleDoc', () => {
  it('저장된 게 없으면 빈 문서로 시작한다', () => {
    const { result } = renderHook(() => useScheduleDoc(2026, 8))
    expect(result.current.doc.year).toBe(2026)
    expect(result.current.doc.month).toBe(8)
    expect(result.current.doc.days).toEqual({})
  })

  it('저장된 문서가 있으면 불러온다', () => {
    const saved = createEmptyDoc(2026, 8)
    saved.footer = { enabled: true, text: '저장됨' }
    saveDoc(saved)

    const { result } = renderHook(() => useScheduleDoc(2026, 8))
    expect(result.current.doc.footer.text).toBe('저장됨')
  })

  it('변경하면 잠시 뒤 자동 저장된다', () => {
    const { result } = renderHook(() => useScheduleDoc(2026, 8))

    act(() => {
      result.current.setDoc((prev) => ({
        ...prev, footer: { enabled: true, text: '자동저장' },
      }))
    })
    expect(loadDoc(2026, 8)).toBeNull()

    flushAutosave()
    expect(loadDoc(2026, 8)?.footer.text).toBe('자동저장')
  })

  it('월을 바꾸면 현재 작업을 즉시 저장하고 대상 월을 불러온다', () => {
    const { result } = renderHook(() => useScheduleDoc(2026, 8))

    act(() => {
      result.current.setDoc((prev) => ({ ...prev, footer: { enabled: true, text: '8월분' } }))
    })
    act(() => result.current.goToMonth(2026, 9))

    expect(loadDoc(2026, 8)?.footer.text).toBe('8월분')
    expect(result.current.doc.month).toBe(9)
    expect(result.current.doc.footer.text).toBe('')
  })

  it('돌아오면 아까 내용이 남아 있다', () => {
    const { result } = renderHook(() => useScheduleDoc(2026, 8))
    act(() => {
      result.current.setDoc((prev) => ({ ...prev, footer: { enabled: true, text: '8월분' } }))
    })
    act(() => result.current.goToMonth(2026, 9))
    act(() => result.current.goToMonth(2026, 8))
    expect(result.current.doc.footer.text).toBe('8월분')
  })

  it('지난달 복사는 이전 달 문서를 현재 달로 가져온다', () => {
    const july = createEmptyDoc(2026, 7)
    july.days['2026-07-01'] = { text: '수요일 방송', dateColor: null, cellFill: null, marker: null }
    saveDoc(july)

    const { result } = renderHook(() => useScheduleDoc(2026, 8))
    let outcome: 'ok' | 'no-source' = 'no-source'
    act(() => {
      outcome = result.current.copyFromPreviousMonth()
    })

    expect(outcome).toBe('ok')
    expect(Object.keys(result.current.doc.days).length).toBe(1)
    expect(result.current.doc.month).toBe(8)
  })

  it('이전 달 문서가 없으면 no-source를 주고 현재 문서를 건드리지 않는다', () => {
    const { result } = renderHook(() => useScheduleDoc(2026, 8))
    let outcome: 'ok' | 'no-source' = 'ok'
    act(() => {
      outcome = result.current.copyFromPreviousMonth()
    })
    expect(outcome).toBe('no-source')
    expect(result.current.doc.days).toEqual({})
  })

  it('저장 실패를 saveError로 알린다', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      const err = new Error('quota') as Error & { name: string }
      err.name = 'QuotaExceededError'
      throw err
    })

    const { result } = renderHook(() => useScheduleDoc(2026, 8))
    act(() => {
      result.current.setDoc((prev) => ({ ...prev, footer: { enabled: true, text: 'x' } }))
    })
    flushAutosave()

    expect(result.current.saveError).toBe('quota')
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npx vitest run src/state/useScheduleDoc.test.ts`
Expected: FAIL — `Failed to resolve import "./useScheduleDoc"`

- [ ] **Step 3: 구현 작성**

`src/state/useScheduleDoc.ts`:

```ts
import { useCallback, useEffect, useRef, useState } from 'react'
import { previousMonth } from '../model/calendar'
import { copyMonthDays } from '../model/copyMonth'
import { createEmptyDoc } from '../model/defaults'
import { loadDoc, saveDoc } from '../model/storage'
import type { ScheduleDoc } from '../model/types'

/** 타이핑 도중 매 글자마다 저장하지 않도록 두는 지연 */
export const AUTOSAVE_DELAY_MS = 400

export type SaveErrorReason = 'quota' | 'unknown'

export type ScheduleDocApi = {
  doc: ScheduleDoc
  setDoc: (updater: (prev: ScheduleDoc) => ScheduleDoc) => void
  goToMonth: (year: number, month: number) => void
  /** 이전 달 문서가 없으면 'no-source'를 주고 아무것도 바꾸지 않는다. */
  copyFromPreviousMonth: () => 'ok' | 'no-source'
  saveError: SaveErrorReason | null
}

function openMonth(year: number, month: number): ScheduleDoc {
  return loadDoc(year, month) ?? createEmptyDoc(year, month)
}

export function useScheduleDoc(initialYear: number, initialMonth: number): ScheduleDocApi {
  const [doc, setDocState] = useState<ScheduleDoc>(() => openMonth(initialYear, initialMonth))
  const [saveError, setSaveError] = useState<SaveErrorReason | null>(null)

  // 항상 최신 문서를 가리킨다. 월 전환 시 즉시 저장하는 데 쓴다.
  const docRef = useRef(doc)
  docRef.current = doc

  const dirtyRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const persist = useCallback((target: ScheduleDoc) => {
    const result = saveDoc(target)
    setSaveError(result.ok ? null : result.reason)
    dirtyRef.current = false
  }, [])

  const setDoc = useCallback((updater: (prev: ScheduleDoc) => ScheduleDoc) => {
    dirtyRef.current = true
    setDocState(updater)
  }, [])

  // 변경 후 잠시 조용하면 저장한다.
  useEffect(() => {
    if (!dirtyRef.current) return
    if (timerRef.current !== null) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => persist(docRef.current), AUTOSAVE_DELAY_MS)
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current)
    }
  }, [doc, persist])

  const goToMonth = useCallback(
    (year: number, month: number) => {
      if (timerRef.current !== null) clearTimeout(timerRef.current)
      // 전환 전에 반드시 저장한다. 안 그러면 지연 시간 안에 바꾼 내용이 사라진다.
      persist(docRef.current)
      setDocState(openMonth(year, month))
    },
    [persist],
  )

  const copyFromPreviousMonth = useCallback((): 'ok' | 'no-source' => {
    const current = docRef.current
    const prev = previousMonth(current.year, current.month)
    const source = loadDoc(prev.year, prev.month)
    if (!source) return 'no-source'
    setDoc(() => copyMonthDays(source, current.year, current.month))
    return 'ok'
  }, [setDoc])

  return { doc, setDoc, goToMonth, copyFromPreviousMonth, saveError }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/state/useScheduleDoc.test.ts`
Expected: PASS — 8 passed

- [ ] **Step 5: App을 훅 기반으로 전환**

샘플 데이터는 제거한다. 이제 실제 상태를 쓴다.

`src/App.tsx`:

```tsx
import { useRef } from 'react'
import { PreviewStage } from './editor/PreviewStage'
import { ScheduleCanvas } from './preview/ScheduleCanvas'
import { useScheduleDoc } from './state/useScheduleDoc'

const today = new Date()

export default function App() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const api = useScheduleDoc(today.getFullYear(), today.getMonth() + 1)

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20 }}>월간 스케줄표 만들기</h1>
      {api.saveError && (
        <p style={{ color: '#c0392b' }}>
          {api.saveError === 'quota'
            ? '저장 공간이 가득 찼습니다. 배경 이미지나 폰트를 정리해 주세요.'
            : '저장에 실패했습니다.'}
        </p>
      )}
      <PreviewStage>
        <ScheduleCanvas ref={canvasRef} doc={api.doc} />
      </PreviewStage>
    </div>
  )
}
```

- [ ] **Step 6: 눈으로 확인**

Run: `npm run dev`
Expected: 오늘 날짜가 속한 달의 빈 스케줄표가 보인다. 브라우저 콘솔에서 `localStorage`에 `weekplanner:doc:` 키가 아직 없는 것을 확인한다(아직 아무것도 안 고쳤으므로 저장이 일어나지 않는다).

- [ ] **Step 7: 타입 검사와 전체 테스트**

Run: `npx tsc -b && npm test`
Expected: 타입 에러 없음, 모든 테스트 통과

- [ ] **Step 8: 커밋**

```bash
git add src/state src/App.tsx
git commit -m "$(cat <<'EOF'
feat: 문서 상태 훅과 자동 저장 추가

월 전환 시에는 지연 저장을 기다리지 않고 즉시 저장한다.
그러지 않으면 지연 시간 안에 바꾼 내용이 사라진다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: 편집 패널 — 월 선택과 날짜별 편집

**Files:**
- Create: `src/editor/controls.ts`
- Create: `src/editor/MonthPicker.tsx`
- Create: `src/editor/DayEditor.tsx`
- Create: `src/editor/EditorPanel.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `ScheduleDocApi`(Task 11), `buildMonthGrid`·`MONTH_NAMES_EN`(Task 3), `createEmptyDayEntry`(Task 2), `getTheme`·`Theme`(Task 6)
- Produces:
  - `controls.ts`: `fieldLabelStyle`, `inputStyle`, `buttonStyle`, `sectionStyle`, `sectionTitleStyle` — 편집 UI 공통 스타일. 이후 태스크(13~17)의 모든 편집 컴포넌트가 이것을 쓴다
  - `updateDay(doc: ScheduleDoc, date: string, patch: Partial<DayEntry>): ScheduleDoc` (`controls.ts`에서 export)
  - `isLikelyOverflowing(text: string): boolean` (`controls.ts`에서 export) — 최소 폰트 크기로도 칸을 넘칠지 어림한다
  - `MonthPicker` — props `{ api: ScheduleDocApi }`
  - `DayEditor` — props `{ api: ScheduleDocApi }`
  - `EditorPanel` — props `{ api: ScheduleDocApi }`

- [ ] **Step 1: updateDay 테스트 작성**

`src/editor/controls.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { createEmptyDoc } from '../model/defaults'
import { isLikelyOverflowing, updateDay } from './controls'

describe('updateDay', () => {
  it('없던 날짜에 항목을 만든다', () => {
    const out = updateDay(createEmptyDoc(2026, 8), '2026-08-03', { text: '방송' })
    expect(out.days['2026-08-03']).toEqual({
      text: '방송', dateColor: null, cellFill: null, marker: null,
    })
  })

  it('기존 항목의 일부만 바꾼다', () => {
    let doc = updateDay(createEmptyDoc(2026, 8), '2026-08-03', { text: '방송' })
    doc = updateDay(doc, '2026-08-03', { marker: '#ffe680' })
    expect(doc.days['2026-08-03']).toEqual({
      text: '방송', dateColor: null, cellFill: null, marker: '#ffe680',
    })
  })

  it('내용이 전부 비면 항목을 지운다', () => {
    let doc = updateDay(createEmptyDoc(2026, 8), '2026-08-03', { text: '방송' })
    doc = updateDay(doc, '2026-08-03', { text: '' })
    expect(doc.days['2026-08-03']).toBeUndefined()
  })

  it('텍스트가 비어도 강조가 남아 있으면 항목을 유지한다', () => {
    let doc = updateDay(createEmptyDoc(2026, 8), '2026-08-03', { cellFill: '#ffd6e0' })
    doc = updateDay(doc, '2026-08-03', { text: '' })
    expect(doc.days['2026-08-03']?.cellFill).toBe('#ffd6e0')
  })

  it('원본을 변경하지 않는다', () => {
    const doc = createEmptyDoc(2026, 8)
    updateDay(doc, '2026-08-03', { text: '방송' })
    expect(doc.days).toEqual({})
  })

  it('다른 날짜는 건드리지 않는다', () => {
    let doc = updateDay(createEmptyDoc(2026, 8), '2026-08-03', { text: 'A' })
    doc = updateDay(doc, '2026-08-04', { text: 'B' })
    expect(doc.days['2026-08-03'].text).toBe('A')
    expect(doc.days['2026-08-04'].text).toBe('B')
  })
})

describe('isLikelyOverflowing', () => {
  it('짧은 글은 넘치지 않는다', () => {
    expect(isLikelyOverflowing('저챗')).toBe(false)
    expect(isLikelyOverflowing('발로란트 랭크\n21:00')).toBe(false)
  })

  it('빈 글은 넘치지 않는다', () => {
    expect(isLikelyOverflowing('')).toBe(false)
  })

  it('아주 긴 글은 넘친다고 본다', () => {
    expect(isLikelyOverflowing('가'.repeat(400))).toBe(true)
  })

  it('줄바꿈이 아주 많으면 넘친다고 본다', () => {
    expect(isLikelyOverflowing('가\n'.repeat(30))).toBe(true)
  })

  it('한도 언저리에서 단조롭게 판정한다', () => {
    const short = '가'.repeat(10)
    const long = '가'.repeat(1000)
    expect(isLikelyOverflowing(short)).toBe(false)
    expect(isLikelyOverflowing(long)).toBe(true)
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npx vitest run src/editor/controls.test.ts`
Expected: FAIL — `Failed to resolve import "./controls"`

- [ ] **Step 3: controls.ts 작성**

`src/editor/controls.ts`:

```ts
import type { CSSProperties } from 'react'
import { createEmptyDayEntry } from '../model/defaults'
import type { DayEntry, ScheduleDoc } from '../model/types'
import {
  CELL_TEXT_HEIGHT, CELL_TEXT_LINE_HEIGHT, CELL_TEXT_MIN_SIZE, CELL_TEXT_WIDTH,
} from '../preview/layout'

export const sectionStyle: CSSProperties = {
  border: '1px solid #d4d4d8',
  borderRadius: 8,
  padding: 16,
  marginBottom: 16,
  background: '#ffffff',
}

export const sectionTitleStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  marginBottom: 12,
}

export const fieldLabelStyle: CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  marginBottom: 4,
  color: '#3f3f46',
}

export const inputStyle: CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  border: '1px solid #d4d4d8',
  borderRadius: 6,
  fontSize: 14,
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

export const buttonStyle: CSSProperties = {
  padding: '6px 12px',
  border: '1px solid #d4d4d8',
  borderRadius: 6,
  background: '#fafafa',
  fontSize: 13,
  cursor: 'pointer',
}

/** 텍스트도 강조도 없으면 저장할 이유가 없는 항목 */
function isEmptyEntry(entry: DayEntry): boolean {
  return (
    entry.text.trim() === '' &&
    entry.dateColor === null &&
    entry.cellFill === null &&
    entry.marker === null
  )
}

/**
 * 하루 항목의 일부 필드를 바꾼 새 문서를 만든다.
 * 결과가 완전히 빈 항목이면 키 자체를 지운다. 저장 용량을 아끼고
 * "빈 문서인지" 판정을 단순하게 유지하기 위해서다.
 */
export function updateDay(
  doc: ScheduleDoc,
  date: string,
  patch: Partial<DayEntry>,
): ScheduleDoc {
  const next: DayEntry = { ...(doc.days[date] ?? createEmptyDayEntry()), ...patch }
  const days = { ...doc.days }
  if (isEmptyEntry(next)) delete days[date]
  else days[date] = next
  return { ...doc, days }
}

/**
 * 최소 폰트 크기로도 칸을 넘칠 것 같은지 어림한다.
 *
 * 정확한 판정은 AutoFitText가 DOM을 재서 한다. 하지만 그 결과를 편집 폼으로
 * 끌어오려면 preview/가 editor/의 콜백을 받아야 해서 두 계층의 경계가 무너진다.
 * 경고는 "글자를 좀 줄이세요" 신호일 뿐 정밀할 필요가 없으므로,
 * 레이아웃 상수만으로 계산하는 어림값을 쓴다.
 *
 * 한글은 폰트 크기와 글자 폭이 거의 같으므로 한 줄에 들어가는 글자 수를
 * CELL_TEXT_WIDTH / CELL_TEXT_MIN_SIZE로 본다. 라틴 문자는 이보다 좁아
 * 실제로는 더 들어가지만, 경고가 조금 이르게 뜨는 쪽이 안전하다.
 */
export function isLikelyOverflowing(text: string): boolean {
  if (text.trim() === '') return false

  const charsPerLine = Math.max(1, Math.floor(CELL_TEXT_WIDTH / CELL_TEXT_MIN_SIZE))
  const maxLines = Math.max(
    1,
    Math.floor(CELL_TEXT_HEIGHT / (CELL_TEXT_MIN_SIZE * CELL_TEXT_LINE_HEIGHT)),
  )

  const usedLines = text
    .split('\n')
    .reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / charsPerLine)), 0)

  return usedLines > maxLines
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/editor/controls.test.ts`
Expected: PASS — 11 passed

- [ ] **Step 5: MonthPicker 작성**

`src/editor/MonthPicker.tsx`:

```tsx
import { useState } from 'react'
import { MONTH_NAMES_EN } from '../model/calendar'
import type { ScheduleDocApi } from '../state/useScheduleDoc'
import { buttonStyle, fieldLabelStyle, inputStyle, sectionStyle, sectionTitleStyle } from './controls'

export type MonthPickerProps = {
  api: ScheduleDocApi
}

const YEAR_MIN = 2020
const YEAR_MAX = 2040

export function MonthPicker({ api }: MonthPickerProps) {
  const { doc, goToMonth, copyFromPreviousMonth } = api
  const [notice, setNotice] = useState('')

  const years = Array.from({ length: YEAR_MAX - YEAR_MIN + 1 }, (_, i) => YEAR_MIN + i)

  const handleCopy = () => {
    const outcome = copyFromPreviousMonth()
    setNotice(
      outcome === 'ok'
        ? '지난달 내용을 가져왔습니다.'
        : '지난달에 저장된 내용이 없습니다.',
    )
  }

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>년 · 월</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <label style={fieldLabelStyle} htmlFor="year-select">년</label>
          <select
            id="year-select"
            style={inputStyle}
            value={doc.year}
            onChange={(e) => goToMonth(Number(e.target.value), doc.month)}
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={fieldLabelStyle} htmlFor="month-select">월</label>
          <select
            id="month-select"
            style={inputStyle}
            value={doc.month}
            onChange={(e) => goToMonth(doc.year, Number(e.target.value))}
          >
            {MONTH_NAMES_EN.map((name, index) => (
              <option key={name} value={index + 1}>{index + 1}월</option>
            ))}
          </select>
        </div>
      </div>

      <button type="button" style={buttonStyle} onClick={handleCopy}>
        지난달 내용 가져오기
      </button>
      {notice && <p style={{ fontSize: 12, color: '#52525b', marginTop: 8 }}>{notice}</p>}
    </section>
  )
}
```

- [ ] **Step 6: DayEditor 작성**

강조 색은 테마 팔레트에서 고른다. `null`을 고르면 강조를 없앤다.

`src/editor/DayEditor.tsx`:

```tsx
import { buildMonthGrid } from '../model/calendar'
import type { DayEntry } from '../model/types'
import type { ScheduleDocApi } from '../state/useScheduleDoc'
import { getTheme } from '../theme/themes'
import {
  fieldLabelStyle, inputStyle, isLikelyOverflowing, sectionStyle, sectionTitleStyle, updateDay,
} from './controls'

export type DayEditorProps = {
  api: ScheduleDocApi
}

const DOW_KO = ['일', '월', '화', '수', '목', '금', '토'] as const

type SwatchRowProps = {
  label: string
  colors: string[]
  value: string | null
  onChange: (color: string | null) => void
}

function SwatchRow({ label, colors, value, onChange }: SwatchRowProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
      <span style={{ fontSize: 12, color: '#52525b', width: 56, flexShrink: 0 }}>{label}</span>
      <button
        type="button"
        aria-label={`${label} 없음`}
        onClick={() => onChange(null)}
        style={{
          width: 22, height: 22, borderRadius: 4, cursor: 'pointer',
          border: value === null ? '2px solid #18181b' : '1px solid #d4d4d8',
          background: '#ffffff', fontSize: 12, lineHeight: 1, padding: 0,
        }}
      >
        ×
      </button>
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={`${label} ${color}`}
          onClick={() => onChange(color)}
          style={{
            width: 22, height: 22, borderRadius: 4, cursor: 'pointer',
            border: value === color ? '2px solid #18181b' : '1px solid #d4d4d8',
            background: color, padding: 0,
          }}
        />
      ))}
    </div>
  )
}

export function DayEditor({ api }: DayEditorProps) {
  const { doc, setDoc } = api
  const theme = getTheme(doc.themeId)
  const cells = buildMonthGrid(doc.year, doc.month).filter((c) => c.inMonth)

  const patch = (date: string, next: Partial<DayEntry>) =>
    setDoc((prev) => updateDay(prev, date, next))

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>날짜별 일정</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {cells.map((cell) => {
          const entry = doc.days[cell.date]
          return (
            <div
              key={cell.date}
              style={{ borderTop: '1px solid #e4e4e7', paddingTop: 10 }}
            >
              <label style={fieldLabelStyle} htmlFor={`day-${cell.date}`}>
                {cell.day}일 ({DOW_KO[cell.dow]})
              </label>
              <textarea
                id={`day-${cell.date}`}
                style={{ ...inputStyle, minHeight: 52, resize: 'vertical' }}
                value={entry?.text ?? ''}
                placeholder="일정을 적어주세요"
                onChange={(e) => patch(cell.date, { text: e.target.value })}
              />
              {isLikelyOverflowing(entry?.text ?? '') && (
                <p style={{ fontSize: 12, color: '#c0392b', margin: '4px 0 0' }}>
                  글자가 너무 많아 칸에서 잘릴 수 있습니다.
                </p>
              )}
              <SwatchRow
                label="칸 배경"
                colors={theme.accents}
                value={entry?.cellFill ?? null}
                onChange={(color) => patch(cell.date, { cellFill: color })}
              />
              <SwatchRow
                label="형광펜"
                colors={theme.accents}
                value={entry?.marker ?? null}
                onChange={(color) => patch(cell.date, { marker: color })}
              />
              <SwatchRow
                label="날짜 색"
                colors={[theme.sundayText, theme.saturdayText, ...theme.accents.slice(0, 4)]}
                value={entry?.dateColor ?? null}
                onChange={(color) => patch(cell.date, { dateColor: color })}
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}
```

- [ ] **Step 7: EditorPanel 작성**

이후 태스크가 여기에 섹션을 추가한다.

`src/editor/EditorPanel.tsx`:

```tsx
import type { ScheduleDocApi } from '../state/useScheduleDoc'
import { DayEditor } from './DayEditor'
import { MonthPicker } from './MonthPicker'

export type EditorPanelProps = {
  api: ScheduleDocApi
}

export function EditorPanel({ api }: EditorPanelProps) {
  return (
    <div>
      <MonthPicker api={api} />
      <DayEditor api={api} />
    </div>
  )
}
```

- [ ] **Step 8: App을 2단 배치로 바꾸기**

넓은 화면은 좌우, 좁은 화면은 위아래로 흐른다. `editor/`에는 px 전용 제약이 없으므로 자유롭게 쓴다.

`src/App.tsx`:

```tsx
import { useRef } from 'react'
import { EditorPanel } from './editor/EditorPanel'
import { PreviewStage } from './editor/PreviewStage'
import { ScheduleCanvas } from './preview/ScheduleCanvas'
import { useScheduleDoc } from './state/useScheduleDoc'

const today = new Date()

export default function App() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const api = useScheduleDoc(today.getFullYear(), today.getMonth() + 1)

  return (
    <div style={{ padding: 16, maxWidth: 1600, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20 }}>월간 스케줄표 만들기</h1>
      {api.saveError && (
        <p style={{ color: '#c0392b' }}>
          {api.saveError === 'quota'
            ? '저장 공간이 가득 찼습니다. 배경 이미지나 폰트를 정리해 주세요.'
            : '저장에 실패했습니다.'}
        </p>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(320px, 420px)',
          gap: 20,
          alignItems: 'start',
        }}
      >
        <div style={{ position: 'sticky', top: 16 }}>
          <PreviewStage>
            <ScheduleCanvas ref={canvasRef} doc={api.doc} />
          </PreviewStage>
        </div>
        <div style={{ maxHeight: '90vh', overflowY: 'auto' }}>
          <EditorPanel api={api} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 9: 눈으로 확인**

Run: `npm run dev`
Expected: 오른쪽 패널에 그 달의 날짜가 모두 나열된다. 확인할 것 —
- 아무 날짜에 글을 쓰면 왼쪽 미리보기가 즉시 바뀐다
- 칸 배경·형광펜·날짜 색 스와치를 누르면 미리보기에 반영된다
- `×` 버튼을 누르면 강조가 사라진다
- 아주 긴 글(200자 이상)을 넣으면 입력창 아래에 "글자가 너무 많아 칸에서 잘릴 수 있습니다"가 뜬다
- 새로고침해도 입력한 내용이 남아 있다
- 월을 바꿨다 돌아오면 아까 내용이 그대로다
- 지난달 내용이 있는 상태에서 "지난달 내용 가져오기"를 누르면 요일이 맞게 옮겨진다

- [ ] **Step 10: 타입 검사와 전체 테스트**

Run: `npx tsc -b && npm test`
Expected: 타입 에러 없음, 모든 테스트 통과

- [ ] **Step 11: 커밋**

```bash
git add src/editor src/App.tsx
git commit -m "$(cat <<'EOF'
feat: 편집 패널(월 선택, 날짜별 일정·강조 입력) 추가

빈 항목은 키 자체를 지워 저장 용량을 아끼고 빈 문서 판정을 단순하게 둔다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: 헤더 · 하단 문구 · 테마 편집

**Files:**
- Create: `src/editor/HeaderEditor.tsx`
- Create: `src/editor/FooterEditor.tsx`
- Create: `src/editor/ThemePicker.tsx`
- Modify: `src/editor/EditorPanel.tsx`

**Interfaces:**
- Consumes: `ScheduleDocApi`(Task 11), `controls.ts` 스타일(Task 12), `THEMES`(Task 6)
- Produces:
  - `HeaderEditor` — props `{ api: ScheduleDocApi }`
  - `FooterEditor` — props `{ api: ScheduleDocApi }`
  - `ThemePicker` — props `{ api: ScheduleDocApi }`

이 태스크는 순수 로직이 없고 폼 배선만 있다. 자동 테스트 대신 Step 5의 눈 확인으로 검증한다.

- [ ] **Step 1: HeaderEditor 작성**

`src/editor/HeaderEditor.tsx`:

```tsx
import type { ScheduleDocApi } from '../state/useScheduleDoc'
import { buttonStyle, fieldLabelStyle, inputStyle, sectionStyle, sectionTitleStyle } from './controls'

export type HeaderEditorProps = {
  api: ScheduleDocApi
}

const MAX_TODO_ITEMS = 6

export function HeaderEditor({ api }: HeaderEditorProps) {
  const { doc, setDoc } = api
  const { header } = doc

  const patchHeader = (patch: Partial<typeof header>) =>
    setDoc((prev) => ({ ...prev, header: { ...prev.header, ...patch } }))

  const patchTodoItem = (index: number, patch: Partial<{ text: string; checked: boolean }>) =>
    setDoc((prev) => ({
      ...prev,
      header: {
        ...prev.header,
        todo: {
          ...prev.header.todo,
          items: prev.header.todo.items.map((item, i) =>
            i === index ? { ...item, ...patch } : item,
          ),
        },
      },
    }))

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>헤더</h2>

      <label style={fieldLabelStyle} htmlFor="title-mode">제목</label>
      <select
        id="title-mode"
        style={inputStyle}
        value={header.titleMode}
        onChange={(e) => patchHeader({ titleMode: e.target.value as 'auto' | 'custom' })}
      >
        <option value="auto">자동 (영문 월 이름)</option>
        <option value="custom">직접 입력</option>
      </select>

      {header.titleMode === 'custom' && (
        <input
          style={{ ...inputStyle, marginTop: 6 }}
          value={header.customTitle}
          placeholder="예: 몬몬 8월 스케줄"
          onChange={(e) => patchHeader({ customTitle: e.target.value })}
        />
      )}

      <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 13 }}>
        <input
          type="checkbox"
          checked={header.showYearMonth}
          onChange={(e) => patchHeader({ showYearMonth: e.target.checked })}
        />
        년·월 표기 ({doc.year}.{String(doc.month).padStart(2, '0')})
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 13 }}>
        <input
          type="checkbox"
          checked={header.memo.enabled}
          onChange={(e) => patchHeader({ memo: { ...header.memo, enabled: e.target.checked } })}
        />
        MEMO 표시
      </label>
      {header.memo.enabled && (
        <textarea
          style={{ ...inputStyle, minHeight: 64, marginTop: 6, resize: 'vertical' }}
          value={header.memo.text}
          placeholder="자유롭게 적어주세요"
          onChange={(e) => patchHeader({ memo: { ...header.memo, text: e.target.value } })}
        />
      )}

      <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 13 }}>
        <input
          type="checkbox"
          checked={header.todo.enabled}
          onChange={(e) => patchHeader({ todo: { ...header.todo, enabled: e.target.checked } })}
        />
        To Do List 표시
      </label>
      {header.todo.enabled && (
        <div style={{ marginTop: 6 }}>
          {header.todo.items.map((item, index) => (
            <div key={index} style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
              <input
                type="checkbox"
                checked={item.checked}
                onChange={(e) => patchTodoItem(index, { checked: e.target.checked })}
              />
              <input
                style={inputStyle}
                value={item.text}
                placeholder="할 일"
                onChange={(e) => patchTodoItem(index, { text: e.target.value })}
              />
              <button
                type="button"
                style={buttonStyle}
                onClick={() =>
                  patchHeader({
                    todo: {
                      ...header.todo,
                      items: header.todo.items.filter((_, i) => i !== index),
                    },
                  })
                }
              >
                삭제
              </button>
            </div>
          ))}
          {header.todo.items.length < MAX_TODO_ITEMS && (
            <button
              type="button"
              style={{ ...buttonStyle, marginTop: 8 }}
              onClick={() =>
                patchHeader({
                  todo: {
                    ...header.todo,
                    items: [...header.todo.items, { text: '', checked: false }],
                  },
                })
              }
            >
              항목 추가
            </button>
          )}
        </div>
      )}
    </section>
  )
}
```

- [ ] **Step 2: FooterEditor 작성**

`src/editor/FooterEditor.tsx`:

```tsx
import type { ScheduleDocApi } from '../state/useScheduleDoc'
import { inputStyle, sectionStyle, sectionTitleStyle } from './controls'

export type FooterEditorProps = {
  api: ScheduleDocApi
}

export function FooterEditor({ api }: FooterEditorProps) {
  const { doc, setDoc } = api

  const patchFooter = (patch: Partial<typeof doc.footer>) =>
    setDoc((prev) => ({ ...prev, footer: { ...prev.footer, ...patch } }))

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>하단 문구</h2>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
        <input
          type="checkbox"
          checked={doc.footer.enabled}
          onChange={(e) => patchFooter({ enabled: e.target.checked })}
        />
        표시
      </label>
      {doc.footer.enabled && (
        <input
          style={{ ...inputStyle, marginTop: 6 }}
          value={doc.footer.text}
          placeholder="*방송 시간은 변경될 수 있어요 :D"
          onChange={(e) => patchFooter({ text: e.target.value })}
        />
      )}
    </section>
  )
}
```

- [ ] **Step 3: ThemePicker 작성**

`src/editor/ThemePicker.tsx`:

```tsx
import type { ScheduleDocApi } from '../state/useScheduleDoc'
import { THEMES } from '../theme/themes'
import { sectionStyle, sectionTitleStyle } from './controls'

export type ThemePickerProps = {
  api: ScheduleDocApi
}

export function ThemePicker({ api }: ThemePickerProps) {
  const { doc, setDoc } = api

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>테마</h2>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {THEMES.map((theme) => (
          <button
            key={theme.id}
            type="button"
            onClick={() => setDoc((prev) => ({ ...prev, themeId: theme.id }))}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: 6,
              borderRadius: 8,
              cursor: 'pointer',
              background: '#ffffff',
              border:
                doc.themeId === theme.id ? '2px solid #18181b' : '1px solid #d4d4d8',
            }}
          >
            <span
              style={{
                width: 56,
                height: 32,
                borderRadius: 4,
                background: theme.pageBackground,
                border: `2px solid ${theme.borderColor}`,
              }}
            />
            <span style={{ fontSize: 12 }}>{theme.name}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 4: EditorPanel에 연결**

`src/editor/EditorPanel.tsx`:

```tsx
import type { ScheduleDocApi } from '../state/useScheduleDoc'
import { DayEditor } from './DayEditor'
import { FooterEditor } from './FooterEditor'
import { HeaderEditor } from './HeaderEditor'
import { MonthPicker } from './MonthPicker'
import { ThemePicker } from './ThemePicker'

export type EditorPanelProps = {
  api: ScheduleDocApi
}

export function EditorPanel({ api }: EditorPanelProps) {
  return (
    <div>
      <MonthPicker api={api} />
      <ThemePicker api={api} />
      <HeaderEditor api={api} />
      <DayEditor api={api} />
      <FooterEditor api={api} />
    </div>
  )
}
```

- [ ] **Step 5: 눈으로 확인**

Run: `npm run dev`
Expected: 확인할 것 —
- 테마 4종을 눌러 보면 미리보기 색이 전부 바뀐다. 테마를 바꾸면 날짜 편집의 스와치 색도 따라 바뀐다
- 제목을 "직접 입력"으로 바꾸고 한글을 넣으면 미리보기 제목이 바뀐다. 비우면 영문 월 이름으로 되돌아간다
- MEMO를 켜면 줄노트가 나타나고 입력한 글이 줄 위에 얹힌다
- To Do List를 켜고 항목을 3개 추가하면 미리보기에 체크박스와 함께 나온다. 6개를 채우면 "항목 추가" 버튼이 사라진다
- 하단 문구를 껐다 켜도 격자 위치가 움직이지 않는다
- 새로고침해도 모두 유지된다

- [ ] **Step 6: 타입 검사와 전체 테스트**

Run: `npx tsc -b && npm test`
Expected: 타입 에러 없음, 모든 테스트 통과

- [ ] **Step 7: 커밋**

```bash
git add src/editor
git commit -m "$(cat <<'EOF'
feat: 헤더·하단 문구·테마 편집 UI 추가

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 14: 폰트 — 내장 폰트와 파일 업로드

**이 태스크의 핵심 함정**: `html-to-image`는 `document.styleSheets`를 순회해 `@font-face` 규칙을 찾아 결과 이미지에 임베딩한다. `FontFace` API로 추가한 폰트는 스타일시트에 존재하지 않으므로 **내보낸 이미지에서만 폰트가 누락된다.** 화면에서는 멀쩡해 보이기 때문에 발견이 늦다. 그래서 `<style>` 엘리먼트에 data URL `@font-face`를 주입하는 방식을 쓴다.

**Files:**
- Create: `src/theme/fonts.ts`
- Create: `src/editor/FontPicker.tsx`
- Modify: `src/index.css`
- Modify: `src/preview/ScheduleCanvas.tsx`
- Modify: `src/editor/EditorPanel.tsx`
- Test: `src/theme/fonts.test.ts`

**Interfaces:**
- Consumes: `putAsset`·`getAsset`·`deleteAsset`·`listAssets`·`blobToDataUrl`(Task 5), `DEFAULT_FONT_ID`(Task 2)
- Produces:
  - `type FontOption = { id: string; label: string; family: string; source: 'builtin' | 'user'; assetId: string | null }`
  - `BUILTIN_FONTS: FontOption[]`
  - `fontFamilyFor(id: string, userFonts: FontOption[]): string`
  - `fontFaceRule(family: string, dataUrl: string, format: string): string`
  - `fontFormatFor(filename: string): string | null` — 지원하지 않는 확장자면 null
  - `registerFontFace(family: string, dataUrl: string, format: string): void`
  - `uploadUserFont(file: File): Promise<FontOption>`
  - `loadUserFonts(): Promise<FontOption[]>`
  - `removeUserFont(option: FontOption): Promise<void>`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/theme/fonts.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { DEFAULT_FONT_ID } from '../model/defaults'
import {
  BUILTIN_FONTS, fontFaceRule, fontFamilyFor, fontFormatFor, type FontOption,
} from './fonts'

const userFont: FontOption = {
  id: 'user-abc', label: '내 폰트', family: 'wp-user-abc', source: 'user', assetId: 'abc',
}

describe('BUILTIN_FONTS', () => {
  it('기본 폰트 id가 실제로 존재한다', () => {
    expect(BUILTIN_FONTS.some((f) => f.id === DEFAULT_FONT_ID)).toBe(true)
  })

  it('모든 내장 폰트는 source가 builtin이고 assetId가 없다', () => {
    for (const font of BUILTIN_FONTS) {
      expect(font.source).toBe('builtin')
      expect(font.assetId).toBeNull()
    }
  })
})

describe('fontFamilyFor', () => {
  it('내장 폰트 id로 family를 찾는다', () => {
    const builtin = BUILTIN_FONTS[0]
    expect(fontFamilyFor(builtin.id, [])).toBe(builtin.family)
  })

  it('업로드 폰트 id로 family를 찾는다', () => {
    expect(fontFamilyFor('user-abc', [userFont])).toBe('wp-user-abc')
  })

  it('없는 id면 기본 폰트 family로 되돌아간다', () => {
    const fallback = BUILTIN_FONTS.find((f) => f.id === DEFAULT_FONT_ID)!
    expect(fontFamilyFor('사라진폰트', [])).toBe(fallback.family)
  })

  it('삭제된 업로드 폰트를 가리켜도 기본으로 되돌아간다', () => {
    const fallback = BUILTIN_FONTS.find((f) => f.id === DEFAULT_FONT_ID)!
    expect(fontFamilyFor('user-abc', [])).toBe(fallback.family)
  })
})

describe('fontFormatFor', () => {
  it('지원 확장자를 CSS format 문자열로 바꾼다', () => {
    expect(fontFormatFor('내폰트.woff2')).toBe('woff2')
    expect(fontFormatFor('내폰트.woff')).toBe('woff')
    expect(fontFormatFor('내폰트.ttf')).toBe('truetype')
    expect(fontFormatFor('내폰트.otf')).toBe('opentype')
  })

  it('대소문자를 가리지 않는다', () => {
    expect(fontFormatFor('MyFont.TTF')).toBe('truetype')
  })

  it('지원하지 않는 확장자는 null이다', () => {
    expect(fontFormatFor('그림.png')).toBeNull()
    expect(fontFormatFor('확장자없음')).toBeNull()
  })
})

describe('fontFaceRule', () => {
  it('data URL을 담은 @font-face 규칙을 만든다', () => {
    const rule = fontFaceRule('wp-user-abc', 'data:font/woff2;base64,AAA', 'woff2')
    expect(rule).toContain("font-family: 'wp-user-abc'")
    expect(rule).toContain("url(data:font/woff2;base64,AAA) format('woff2')")
    expect(rule).toContain('font-display: block')
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npx vitest run src/theme/fonts.test.ts`
Expected: FAIL — `Failed to resolve import "./fonts"`

- [ ] **Step 3: Pretendard 설치와 경로 확인**

Run: `npm install pretendard`
Run: `ls node_modules/pretendard/dist/web/variable/`
Expected: `pretendardvariable.css`와 `woff2/` 디렉터리가 보인다.

경로가 다르면 `ls node_modules/pretendard/dist`로 실제 구조를 확인하고 다음 단계의 import 경로를 그에 맞춘다. 패키지 자체를 못 찾으면 이 폰트는 건너뛰고 `BUILTIN_FONTS`에서 `system` 항목만 남긴 뒤 `DEFAULT_FONT_ID`를 `'system'`으로 바꾼다(`src/model/defaults.ts`도 함께).

- [ ] **Step 4: `src/index.css` 맨 위에 폰트 import 추가**

```css
@import 'pretendard/dist/web/variable/pretendardvariable.css';
```

- [ ] **Step 5: 구현 작성**

`src/theme/fonts.ts`:

```ts
import {
  blobToDataUrl, deleteAsset, getAsset, listAssets, putAsset,
} from '../model/assets'
import { DEFAULT_FONT_ID } from '../model/defaults'

export type FontOption = {
  id: string
  label: string
  /** CSS font-family 값 */
  family: string
  source: 'builtin' | 'user'
  /** builtin이면 null */
  assetId: string | null
}

export const BUILTIN_FONTS: FontOption[] = [
  {
    id: 'pretendard',
    label: 'Pretendard',
    family: "'Pretendard Variable', Pretendard, sans-serif",
    source: 'builtin',
    assetId: null,
  },
  {
    id: 'system',
    label: '시스템 기본',
    family: "system-ui, -apple-system, 'Malgun Gothic', sans-serif",
    source: 'builtin',
    assetId: null,
  },
]

const FORMATS: Record<string, string> = {
  woff2: 'woff2',
  woff: 'woff',
  ttf: 'truetype',
  otf: 'opentype',
}

/** 파일 이름에서 CSS `format()` 문자열을 뽑는다. 지원하지 않으면 null. */
export function fontFormatFor(filename: string): string | null {
  const dot = filename.lastIndexOf('.')
  if (dot < 0) return null
  return FORMATS[filename.slice(dot + 1).toLowerCase()] ?? null
}

export function fontFamilyFor(id: string, userFonts: FontOption[]): string {
  const found = [...BUILTIN_FONTS, ...userFonts].find((f) => f.id === id)
  if (found) return found.family
  return BUILTIN_FONTS.find((f) => f.id === DEFAULT_FONT_ID)!.family
}

/**
 * data URL을 그대로 담은 @font-face 규칙.
 *
 * URL이 아니라 data URL을 쓰는 이유: html-to-image가 결과 이미지를 만들 때
 * 이 규칙을 그대로 복사해 넣기 때문에 외부 요청 없이 폰트가 임베딩된다.
 * font-display: block은 폰트가 준비되기 전 대체 글꼴로 잠깐 그려지는 것을 막는다.
 */
export function fontFaceRule(family: string, dataUrl: string, format: string): string {
  return `@font-face { font-family: '${family}'; src: url(${dataUrl}) format('${format}'); font-display: block; }`
}

const STYLE_ELEMENT_ID = 'weekplanner-user-fonts'

function styleElement(): HTMLStyleElement {
  const existing = document.getElementById(STYLE_ELEMENT_ID)
  if (existing) return existing as HTMLStyleElement
  const style = document.createElement('style')
  style.id = STYLE_ELEMENT_ID
  document.head.appendChild(style)
  return style
}

const registered = new Set<string>()

/**
 * 문서에 폰트를 등록한다.
 *
 * FontFace API 대신 <style> 주입을 쓴다. html-to-image는 document.styleSheets를
 * 순회해 @font-face를 찾으므로, FontFace API로 추가한 폰트는 화면에는 나오지만
 * 내보낸 이미지에서 누락된다.
 */
export function registerFontFace(family: string, dataUrl: string, format: string): void {
  if (registered.has(family)) return
  registered.add(family)
  styleElement().appendChild(document.createTextNode(fontFaceRule(family, dataUrl, format)))
}

const familyForAsset = (assetId: string) => `wp-user-${assetId}`
const idForAsset = (assetId: string) => `user-${assetId}`

export async function uploadUserFont(file: File): Promise<FontOption> {
  const format = fontFormatFor(file.name)
  if (!format) {
    throw new Error('지원하지 않는 폰트 형식입니다. ttf, otf, woff, woff2만 쓸 수 있습니다.')
  }

  const assetId = await putAsset({
    kind: 'font',
    name: file.name,
    mime: file.type || 'font/woff2',
    blob: file,
  })

  const family = familyForAsset(assetId)
  registerFontFace(family, await blobToDataUrl(file), format)

  return { id: idForAsset(assetId), label: file.name, family, source: 'user', assetId }
}

/** 저장된 업로드 폰트를 전부 문서에 등록하고 목록을 준다. */
export async function loadUserFonts(): Promise<FontOption[]> {
  const assets = await listAssets('font')
  const options: FontOption[] = []

  for (const asset of assets) {
    const format = fontFormatFor(asset.name)
    if (!format) continue
    const family = familyForAsset(asset.id)
    registerFontFace(family, await blobToDataUrl(asset.blob), format)
    options.push({
      id: idForAsset(asset.id), label: asset.name, family, source: 'user', assetId: asset.id,
    })
  }
  return options
}

export async function removeUserFont(option: FontOption): Promise<void> {
  if (!option.assetId) return
  if (await getAsset(option.assetId)) await deleteAsset(option.assetId)
  // 등록된 @font-face는 남지만 참조가 사라지므로 표시에 영향이 없다.
}
```

- [ ] **Step 6: 테스트 통과 확인**

Run: `npx vitest run src/theme/fonts.test.ts`
Expected: PASS — 10 passed

- [ ] **Step 7: FontPicker 작성**

업로드 폰트 목록은 여러 컴포넌트가 필요로 하므로 App이 들고 있다가 내려준다.

`src/editor/FontPicker.tsx`:

```tsx
import { useRef, useState } from 'react'
import type { ScheduleDocApi } from '../state/useScheduleDoc'
import { BUILTIN_FONTS, type FontOption, uploadUserFont } from '../theme/fonts'
import { buttonStyle, fieldLabelStyle, inputStyle, sectionStyle, sectionTitleStyle } from './controls'

export type FontPickerProps = {
  api: ScheduleDocApi
  userFonts: FontOption[]
  onUserFontsChange: (fonts: FontOption[]) => void
}

export function FontPicker({ api, userFonts, onUserFontsChange }: FontPickerProps) {
  const { doc, setDoc } = api
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setError('')
    try {
      const option = await uploadUserFont(file)
      onUserFontsChange([...userFonts, option])
      setDoc((prev) => ({ ...prev, fontId: option.id }))
    } catch (err) {
      setError(err instanceof Error ? err.message : '폰트를 등록하지 못했습니다.')
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>폰트</h2>

      <label style={fieldLabelStyle} htmlFor="font-select">사용할 폰트</label>
      <select
        id="font-select"
        style={inputStyle}
        value={doc.fontId}
        onChange={(e) => setDoc((prev) => ({ ...prev, fontId: e.target.value }))}
      >
        {[...BUILTIN_FONTS, ...userFonts].map((font) => (
          <option key={font.id} value={font.id}>{font.label}</option>
        ))}
      </select>

      <input
        ref={inputRef}
        type="file"
        accept=".ttf,.otf,.woff,.woff2"
        style={{ display: 'none' }}
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
      <button
        type="button"
        style={{ ...buttonStyle, marginTop: 8 }}
        onClick={() => inputRef.current?.click()}
      >
        폰트 파일 추가
      </button>
      <p style={{ fontSize: 12, color: '#71717a', marginTop: 6 }}>
        ttf, otf, woff, woff2 파일을 쓸 수 있습니다. 한 번 추가하면 계속 남습니다.
      </p>
      {error && <p style={{ fontSize: 12, color: '#c0392b', marginTop: 4 }}>{error}</p>}
    </section>
  )
}
```

- [ ] **Step 8: 캔버스에 폰트 적용**

`ScheduleCanvas`가 폰트 family를 알아야 한다. props에 `fontFamily`를 추가한다.

`src/preview/ScheduleCanvas.tsx`의 `ScheduleCanvasProps`를 바꾼다.

```tsx
export type ScheduleCanvasProps = {
  doc: ScheduleDoc
  /** 적용할 CSS font-family. App이 fontFamilyFor()로 계산해 넘긴다. */
  fontFamily: string
}
```

함수 시그니처를 `function ScheduleCanvas({ doc, fontFamily }, ref)`로 바꾸고, 루트 `<div>`의 style에 `fontFamily`를 추가한다.

```tsx
          color: theme.bodyText,
          fontFamily,
```

- [ ] **Step 9: EditorPanel과 App 배선**

`EditorPanel`이 폰트 목록을 통과시켜야 한다. `EditorPanelProps`에 `userFonts`, `onUserFontsChange`를 추가하고 `ThemePicker` 아래에 `FontPicker`를 넣는다.

```tsx
import type { ScheduleDocApi } from '../state/useScheduleDoc'
import type { FontOption } from '../theme/fonts'
import { DayEditor } from './DayEditor'
import { FontPicker } from './FontPicker'
import { FooterEditor } from './FooterEditor'
import { HeaderEditor } from './HeaderEditor'
import { MonthPicker } from './MonthPicker'
import { ThemePicker } from './ThemePicker'

export type EditorPanelProps = {
  api: ScheduleDocApi
  userFonts: FontOption[]
  onUserFontsChange: (fonts: FontOption[]) => void
}

export function EditorPanel({ api, userFonts, onUserFontsChange }: EditorPanelProps) {
  return (
    <div>
      <MonthPicker api={api} />
      <ThemePicker api={api} />
      <FontPicker api={api} userFonts={userFonts} onUserFontsChange={onUserFontsChange} />
      <HeaderEditor api={api} />
      <DayEditor api={api} />
      <FooterEditor api={api} />
    </div>
  )
}
```

`src/App.tsx`에서 폰트 목록을 들고 캔버스에 family를 계산해 넘긴다. 파일 상단 import에 `useEffect`, `useState`, `fontFamilyFor`, `loadUserFonts`, `FontOption`을 추가하고, 컴포넌트 본문 앞부분을 이렇게 바꾼다.

```tsx
  const canvasRef = useRef<HTMLDivElement>(null)
  const api = useScheduleDoc(today.getFullYear(), today.getMonth() + 1)
  const [userFonts, setUserFonts] = useState<FontOption[]>([])

  useEffect(() => {
    void loadUserFonts().then(setUserFonts)
  }, [])

  const fontFamily = fontFamilyFor(api.doc.fontId, userFonts)
```

`ScheduleCanvas`와 `EditorPanel` 사용부를 이렇게 바꾼다.

```tsx
          <ScheduleCanvas ref={canvasRef} doc={api.doc} fontFamily={fontFamily} />
```

```tsx
          <EditorPanel api={api} userFonts={userFonts} onUserFontsChange={setUserFonts} />
```

- [ ] **Step 10: 눈으로 확인**

Run: `npm run dev`
Expected: 확인할 것 —
- 폰트 드롭다운에 `Pretendard`와 `시스템 기본`이 있고, 바꾸면 미리보기 글꼴이 바뀐다
- 한글 폰트 파일(.ttf 또는 .woff2)을 추가하면 목록에 뜨고 즉시 적용된다
- 긴 텍스트가 든 칸이 폰트 변경 후에도 칸 안에 정확히 들어간다 (AutoFitText 재측정 확인)
- `.png` 파일을 고르면 "지원하지 않는 폰트 형식입니다" 메시지가 뜬다
- 새로고침해도 추가한 폰트가 목록에 남아 있고 적용도 유지된다

- [ ] **Step 11: 타입 검사와 전체 테스트**

Run: `npx tsc -b && npm test`
Expected: 타입 에러 없음, 모든 테스트 통과

- [ ] **Step 12: 커밋**

```bash
git add package.json package-lock.json src
git commit -m "$(cat <<'EOF'
feat: 내장 폰트와 폰트 파일 업로드 추가

FontFace API 대신 data URL @font-face를 <style>로 주입한다.
html-to-image는 document.styleSheets에서 @font-face를 찾으므로
FontFace API로 등록하면 내보낸 이미지에서만 폰트가 누락된다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 15: 배경 이미지 업로드

**Files:**
- Create: `src/model/imageResize.ts`
- Create: `src/state/useAssetUrl.ts`
- Create: `src/editor/BackgroundPicker.tsx`
- Modify: `src/preview/ScheduleCanvas.tsx`
- Modify: `src/editor/EditorPanel.tsx`
- Modify: `src/App.tsx`
- Test: `src/model/imageResize.test.ts`

**Interfaces:**
- Consumes: `putAsset`·`getAsset`·`deleteAsset`·`blobToDataUrl`(Task 5), `ScheduleDocApi`(Task 11)
- Produces:
  - `MAX_IMAGE_EDGE: 2000`
  - `fitWithin(width: number, height: number, maxEdge: number): { width: number; height: number }` (`imageResize.ts`)
  - `resizeImageBlob(blob: Blob, maxEdge?: number): Promise<Blob>` (`imageResize.ts`)
  - `useAssetUrl(assetId: string | null): string | null` — 에셋을 data URL로 읽어 준다
  - `BackgroundPicker` — props `{ api: ScheduleDocApi }`

- [ ] **Step 1: 실패하는 테스트 작성**

`resizeImageBlob`은 캔버스와 이미지 디코딩에 의존해 jsdom에서 검증이 불안정하다. 순수한 치수 계산만 테스트한다.

`src/model/imageResize.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { fitWithin, MAX_IMAGE_EDGE } from './imageResize'

describe('fitWithin', () => {
  it('한도보다 작으면 그대로 둔다', () => {
    expect(fitWithin(800, 600, 2000)).toEqual({ width: 800, height: 600 })
  })

  it('가로가 길면 가로를 한도에 맞춘다', () => {
    expect(fitWithin(4000, 2000, 2000)).toEqual({ width: 2000, height: 1000 })
  })

  it('세로가 길면 세로를 한도에 맞춘다', () => {
    expect(fitWithin(2000, 4000, 2000)).toEqual({ width: 1000, height: 2000 })
  })

  it('비율을 유지한다', () => {
    const out = fitWithin(3000, 1200, 2000)
    expect(out.width / out.height).toBeCloseTo(3000 / 1200, 6)
  })

  it('정수 픽셀을 준다', () => {
    const out = fitWithin(3333, 1111, 2000)
    expect(Number.isInteger(out.width)).toBe(true)
    expect(Number.isInteger(out.height)).toBe(true)
  })

  it('한 변이 0이어도 깨지지 않는다', () => {
    expect(fitWithin(0, 0, 2000)).toEqual({ width: 0, height: 0 })
  })

  it('기본 한도는 2000이다', () => {
    expect(MAX_IMAGE_EDGE).toBe(2000)
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npx vitest run src/model/imageResize.test.ts`
Expected: FAIL — `Failed to resolve import "./imageResize"`

- [ ] **Step 3: imageResize 작성**

`src/model/imageResize.ts`:

```ts
/** 업로드 이미지의 최대 변 길이. 원본을 그대로 두면 IndexedDB와 메모리를 크게 먹는다. */
export const MAX_IMAGE_EDGE = 2000

export function fitWithin(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } {
  const longest = Math.max(width, height)
  if (longest <= maxEdge || longest === 0) return { width, height }
  const ratio = maxEdge / longest
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) }
}

/** 너무 큰 이미지를 줄인다. 한도 안이면 원본 Blob을 그대로 돌려준다. */
export async function resizeImageBlob(blob: Blob, maxEdge = MAX_IMAGE_EDGE): Promise<Blob> {
  const url = URL.createObjectURL(blob)
  try {
    const image = new Image()
    image.src = url
    await image.decode()

    const target = fitWithin(image.naturalWidth, image.naturalHeight, maxEdge)
    if (target.width === image.naturalWidth && target.height === image.naturalHeight) return blob

    const canvas = document.createElement('canvas')
    canvas.width = target.width
    canvas.height = target.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return blob
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(image, 0, 0, target.width, target.height)

    const resized = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png'),
    )
    return resized ?? blob
  } finally {
    URL.revokeObjectURL(url)
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/model/imageResize.test.ts`
Expected: PASS — 7 passed

- [ ] **Step 5: useAssetUrl 작성**

`blob:` URL이 아니라 `data:` URL을 쓴다. `html-to-image`가 `blob:` URL을 내보내기 시점에 다시 읽지 못하는 경우가 있기 때문이다.

`src/state/useAssetUrl.ts`:

```ts
import { useEffect, useState } from 'react'
import { blobToDataUrl, getAsset } from '../model/assets'

const cache = new Map<string, string>()

/**
 * IndexedDB 에셋을 data URL로 읽어 준다.
 *
 * blob: URL 대신 data: URL을 쓰는 이유는 html-to-image가 내보내기 시점에
 * blob: URL을 다시 읽지 못하는 경우가 있어 결과 이미지에서 그림이 빠지기 때문이다.
 */
export function useAssetUrl(assetId: string | null): string | null {
  const [url, setUrl] = useState<string | null>(() =>
    assetId ? (cache.get(assetId) ?? null) : null,
  )

  useEffect(() => {
    if (!assetId) {
      setUrl(null)
      return
    }
    const cached = cache.get(assetId)
    if (cached) {
      setUrl(cached)
      return
    }

    let alive = true
    void getAsset(assetId).then(async (asset) => {
      if (!asset) {
        if (alive) setUrl(null)
        return
      }
      const dataUrl = await blobToDataUrl(asset.blob)
      cache.set(assetId, dataUrl)
      if (alive) setUrl(dataUrl)
    })
    return () => {
      alive = false
    }
  }, [assetId])

  return url
}
```

- [ ] **Step 6: BackgroundPicker 작성**

`src/editor/BackgroundPicker.tsx`:

```tsx
import { useRef, useState } from 'react'
import { deleteAsset, putAsset } from '../model/assets'
import { resizeImageBlob } from '../model/imageResize'
import type { ScheduleDocApi } from '../state/useScheduleDoc'
import { buttonStyle, sectionStyle, sectionTitleStyle } from './controls'

export type BackgroundPickerProps = {
  api: ScheduleDocApi
}

export function BackgroundPicker({ api }: BackgroundPickerProps) {
  const { doc, setDoc } = api
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setError('')
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 올릴 수 있습니다.')
      return
    }
    try {
      const blob = await resizeImageBlob(file)
      const assetId = await putAsset({
        kind: 'image', name: file.name, mime: 'image/png', blob,
      })
      const previous = doc.backgroundAssetId
      setDoc((prev) => ({ ...prev, backgroundAssetId: assetId }))
      if (previous) await deleteAsset(previous)
    } catch {
      setError('이미지를 불러오지 못했습니다.')
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleRemove = async () => {
    const previous = doc.backgroundAssetId
    setDoc((prev) => ({ ...prev, backgroundAssetId: null }))
    if (previous) await deleteAsset(previous)
  }

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>배경 이미지</h2>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" style={buttonStyle} onClick={() => inputRef.current?.click()}>
          {doc.backgroundAssetId ? '배경 바꾸기' : '배경 올리기'}
        </button>
        {doc.backgroundAssetId && (
          <button type="button" style={buttonStyle} onClick={() => void handleRemove()}>
            배경 없애기
          </button>
        )}
      </div>
      <p style={{ fontSize: 12, color: '#71717a', marginTop: 6 }}>
        16:9 이미지가 가장 잘 맞습니다. 너무 큰 이미지는 자동으로 줄입니다.
      </p>
      {error && <p style={{ fontSize: 12, color: '#c0392b', marginTop: 4 }}>{error}</p>}
    </section>
  )
}
```

- [ ] **Step 7: 캔버스에 배경 적용**

`ScheduleCanvasProps`에 `backgroundUrl`을 추가한다.

```tsx
export type ScheduleCanvasProps = {
  doc: ScheduleDoc
  /** 적용할 CSS font-family. App이 fontFamilyFor()로 계산해 넘긴다. */
  fontFamily: string
  /** 배경 이미지 data URL. null이면 테마 배경만 쓴다. */
  backgroundUrl: string | null
}
```

시그니처를 `function ScheduleCanvas({ doc, fontFamily, backgroundUrl }, ref)`로 바꾸고, 루트 `<div>`의 `backgroundImage` 줄을 다음으로 교체한다. 배경 이미지가 있으면 테마 무늬보다 위에 깔린다.

```tsx
          backgroundImage: backgroundUrl
            ? `url(${backgroundUrl})`
            : theme.patternCss,
          backgroundSize: backgroundUrl ? `${CANVAS_WIDTH}px ${CANVAS_HEIGHT}px` : undefined,
          backgroundRepeat: backgroundUrl ? 'no-repeat' : undefined,
```

- [ ] **Step 8: EditorPanel과 App 배선**

`EditorPanel.tsx`에서 `BackgroundPicker`를 import하고 `ThemePicker` 바로 아래에 `<BackgroundPicker api={api} />`를 넣는다.

`src/App.tsx`에서 `useAssetUrl`을 import하고, `fontFamily` 계산 아래에 한 줄 추가한다.

```tsx
  const backgroundUrl = useAssetUrl(api.doc.backgroundAssetId)
```

`ScheduleCanvas` 사용부에 prop을 추가한다.

```tsx
          <ScheduleCanvas
            ref={canvasRef}
            doc={api.doc}
            fontFamily={fontFamily}
            backgroundUrl={backgroundUrl}
          />
```

- [ ] **Step 9: 눈으로 확인**

Run: `npm run dev`
Expected: 확인할 것 —
- 이미지를 올리면 캔버스 전체 배경으로 깔린다
- "배경 없애기"를 누르면 테마 배경으로 돌아간다
- 큰 이미지(4000px 이상)를 올려도 느려지지 않는다
- 새로고침해도 배경이 유지된다
- 텍스트 파일을 고르면 "이미지 파일만 올릴 수 있습니다" 메시지가 뜬다

- [ ] **Step 10: 타입 검사와 전체 테스트**

Run: `npx tsc -b && npm test`
Expected: 타입 에러 없음, 모든 테스트 통과

- [ ] **Step 11: 커밋**

```bash
git add src
git commit -m "$(cat <<'EOF'
feat: 배경 이미지 업로드 추가

에셋은 blob: 대신 data: URL로 읽는다. html-to-image가 내보내기 시점에
blob: URL을 다시 읽지 못해 결과 이미지에서 그림이 빠지는 경우가 있다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 16: 스티커

**Files:**
- Create: `src/model/stickers.ts`
- Create: `src/preview/StickerLayer.tsx`
- Create: `src/editor/StickerManager.tsx`
- Modify: `src/preview/ScheduleCanvas.tsx`
- Modify: `src/editor/EditorPanel.tsx`
- Test: `src/model/stickers.test.ts`

**Interfaces:**
- Consumes: `Sticker`·`ScheduleDoc`(Task 2), `putAsset`·`deleteAsset`(Task 5), `resizeImageBlob`(Task 15), `useAssetUrl`(Task 15), `CANVAS_WIDTH`·`CANVAS_HEIGHT`(Task 8)
- Produces:
  - `STICKER_MIN_WIDTH: 60`, `STICKER_MAX_WIDTH: 2000`, `STICKER_DEFAULT_WIDTH: 400`
  - `createSticker(assetId: string, existing: Sticker[]): Sticker`
  - `updateSticker(doc: ScheduleDoc, id: string, patch: Partial<Sticker>): ScheduleDoc`
  - `removeSticker(doc: ScheduleDoc, id: string): ScheduleDoc`
  - `reorderSticker(doc: ScheduleDoc, id: string, direction: 'up' | 'down'): ScheduleDoc`
  - `clampStickerWidth(width: number): number`
  - `StickerLayer` — props `{ stickers: Sticker[] }`
  - `StickerManager` — props `{ api: ScheduleDocApi }`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/model/stickers.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { createEmptyDoc } from './defaults'
import {
  clampStickerWidth, createSticker, removeSticker, reorderSticker,
  STICKER_DEFAULT_WIDTH, STICKER_MAX_WIDTH, STICKER_MIN_WIDTH, updateSticker,
} from './stickers'
import type { Sticker } from './types'

const withStickers = (...stickers: Sticker[]) => ({
  ...createEmptyDoc(2026, 8),
  stickers,
})

const sticker = (id: string, z: number): Sticker => ({
  id, assetId: `asset-${id}`, x: 0, y: 0, width: 400, rotation: 0, z,
})

describe('createSticker', () => {
  it('기본 크기와 회전 0으로 만든다', () => {
    const created = createSticker('asset-1', [])
    expect(created.width).toBe(STICKER_DEFAULT_WIDTH)
    expect(created.rotation).toBe(0)
    expect(created.assetId).toBe('asset-1')
  })

  it('기존 스티커보다 위에 놓는다', () => {
    expect(createSticker('asset-2', [sticker('a', 3), sticker('b', 7)]).z).toBe(8)
  })

  it('첫 스티커의 z는 0이다', () => {
    expect(createSticker('asset-1', []).z).toBe(0)
  })

  it('id가 겹치지 않는다', () => {
    const a = createSticker('asset-1', [])
    const b = createSticker('asset-1', [a])
    expect(a.id).not.toBe(b.id)
  })
})

describe('clampStickerWidth', () => {
  it('범위 안이면 그대로 둔다', () => {
    expect(clampStickerWidth(400)).toBe(400)
  })

  it('최소·최대를 벗어나면 잘라 맞춘다', () => {
    expect(clampStickerWidth(1)).toBe(STICKER_MIN_WIDTH)
    expect(clampStickerWidth(999_999)).toBe(STICKER_MAX_WIDTH)
  })
})

describe('updateSticker', () => {
  it('해당 스티커만 바꾼다', () => {
    const doc = withStickers(sticker('a', 0), sticker('b', 1))
    const out = updateSticker(doc, 'a', { x: 500 })
    expect(out.stickers[0].x).toBe(500)
    expect(out.stickers[1].x).toBe(0)
  })

  it('폭은 범위 안으로 잘린다', () => {
    const out = updateSticker(withStickers(sticker('a', 0)), 'a', { width: 1 })
    expect(out.stickers[0].width).toBe(STICKER_MIN_WIDTH)
  })

  it('없는 id는 아무것도 바꾸지 않는다', () => {
    const doc = withStickers(sticker('a', 0))
    expect(updateSticker(doc, '없음', { x: 9 }).stickers).toEqual(doc.stickers)
  })

  it('원본을 변경하지 않는다', () => {
    const doc = withStickers(sticker('a', 0))
    updateSticker(doc, 'a', { x: 500 })
    expect(doc.stickers[0].x).toBe(0)
  })
})

describe('removeSticker', () => {
  it('해당 스티커를 지운다', () => {
    const out = removeSticker(withStickers(sticker('a', 0), sticker('b', 1)), 'a')
    expect(out.stickers.map((s) => s.id)).toEqual(['b'])
  })

  it('없는 id는 아무 일도 없다', () => {
    const doc = withStickers(sticker('a', 0))
    expect(removeSticker(doc, '없음').stickers).toHaveLength(1)
  })
})

describe('reorderSticker', () => {
  it('위로 보내면 z가 커진다', () => {
    const out = reorderSticker(withStickers(sticker('a', 0), sticker('b', 1)), 'a', 'up')
    const a = out.stickers.find((s) => s.id === 'a')!
    const b = out.stickers.find((s) => s.id === 'b')!
    expect(a.z).toBeGreaterThan(b.z)
  })

  it('아래로 보내면 z가 작아진다', () => {
    const out = reorderSticker(withStickers(sticker('a', 0), sticker('b', 1)), 'b', 'down')
    const a = out.stickers.find((s) => s.id === 'a')!
    const b = out.stickers.find((s) => s.id === 'b')!
    expect(b.z).toBeLessThan(a.z)
  })

  it('맨 위를 더 올려도 순서가 유지된다', () => {
    const out = reorderSticker(withStickers(sticker('a', 0), sticker('b', 1)), 'b', 'up')
    const sorted = [...out.stickers].sort((p, q) => p.z - q.z).map((s) => s.id)
    expect(sorted).toEqual(['a', 'b'])
  })

  it('스티커가 하나면 아무 일도 없다', () => {
    const out = reorderSticker(withStickers(sticker('a', 0)), 'a', 'up')
    expect(out.stickers).toHaveLength(1)
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npx vitest run src/model/stickers.test.ts`
Expected: FAIL — `Failed to resolve import "./stickers"`

- [ ] **Step 3: stickers.ts 작성**

`src/model/stickers.ts`:

```ts
import type { ScheduleDoc, Sticker } from './types'

/** 4000×2250 캔버스 기준 폭 */
export const STICKER_MIN_WIDTH = 60
export const STICKER_MAX_WIDTH = 2000
export const STICKER_DEFAULT_WIDTH = 400

export function clampStickerWidth(width: number): number {
  return Math.min(STICKER_MAX_WIDTH, Math.max(STICKER_MIN_WIDTH, Math.round(width)))
}

export function createSticker(assetId: string, existing: Sticker[]): Sticker {
  const topZ = existing.reduce((max, s) => Math.max(max, s.z), -1)
  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    assetId,
    // 캔버스 중앙 근처에 놓는다. 사용자가 곧바로 끌어 옮긴다.
    x: 1600,
    y: 900,
    width: STICKER_DEFAULT_WIDTH,
    rotation: 0,
    z: topZ + 1,
  }
}

export function updateSticker(
  doc: ScheduleDoc,
  id: string,
  patch: Partial<Sticker>,
): ScheduleDoc {
  return {
    ...doc,
    stickers: doc.stickers.map((s) => {
      if (s.id !== id) return s
      const next = { ...s, ...patch }
      return { ...next, width: clampStickerWidth(next.width) }
    }),
  }
}

export function removeSticker(doc: ScheduleDoc, id: string): ScheduleDoc {
  return { ...doc, stickers: doc.stickers.filter((s) => s.id !== id) }
}

/**
 * 이웃과 z를 맞바꿔 앞뒤 순서를 바꾼다.
 * 맨 끝이면 아무 일도 하지 않는다.
 */
export function reorderSticker(
  doc: ScheduleDoc,
  id: string,
  direction: 'up' | 'down',
): ScheduleDoc {
  const sorted = [...doc.stickers].sort((a, b) => a.z - b.z)
  const index = sorted.findIndex((s) => s.id === id)
  if (index < 0) return doc

  const swapWith = direction === 'up' ? index + 1 : index - 1
  if (swapWith < 0 || swapWith >= sorted.length) return doc

  const a = sorted[index]
  const b = sorted[swapWith]
  return {
    ...doc,
    stickers: doc.stickers.map((s) =>
      s.id === a.id ? { ...s, z: b.z } : s.id === b.id ? { ...s, z: a.z } : s,
    ),
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/model/stickers.test.ts`
Expected: PASS — 14 passed

- [ ] **Step 5: StickerLayer 작성**

`preview/`는 표시만 한다. 드래그 조작은 `editor/`가 맡는다.

`src/preview/StickerLayer.tsx`:

```tsx
import { useAssetUrl } from '../state/useAssetUrl'
import type { Sticker } from '../model/types'
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './layout'

function StickerImage({ sticker }: { sticker: Sticker }) {
  const url = useAssetUrl(sticker.assetId)
  if (!url) return null

  return (
    <img
      src={url}
      alt=""
      draggable={false}
      style={{
        position: 'absolute',
        left: sticker.x,
        top: sticker.y,
        width: sticker.width,
        height: 'auto',
        transform: `rotate(${sticker.rotation}deg)`,
        transformOrigin: 'center center',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    />
  )
}

export type StickerLayerProps = {
  stickers: Sticker[]
}

export function StickerLayer({ stickers }: StickerLayerProps) {
  const ordered = [...stickers].sort((a, b) => a.z - b.z)

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {ordered.map((sticker) => (
        <StickerImage key={sticker.id} sticker={sticker} />
      ))}
    </div>
  )
}
```

- [ ] **Step 6: 캔버스에 스티커 레이어 연결**

`ScheduleCanvas.tsx`에서 `StickerLayer`를 import하고, `Footer` 블록 **뒤**(닫는 `</div>` 직전)에 넣는다. 원본 PSD의 레이어 순서(격자 위, 타이틀 아래)를 따르되, 구현에서는 절대 위치 레이어로 격자 위에 얹는다.

```tsx
        <StickerLayer stickers={doc.stickers} />
```

- [ ] **Step 7: StickerManager 작성**

드래그는 캔버스 좌표계로 환산해야 한다. 화면에서 1 px 움직이면 캔버스에서는 `1 / scale` px 움직인다.

`src/editor/StickerManager.tsx`:

```tsx
import { useRef, useState } from 'react'
import { deleteAsset, putAsset } from '../model/assets'
import { resizeImageBlob } from '../model/imageResize'
import {
  createSticker, removeSticker, reorderSticker, STICKER_MAX_WIDTH, STICKER_MIN_WIDTH,
  updateSticker,
} from '../model/stickers'
import type { ScheduleDocApi } from '../state/useScheduleDoc'
import { buttonStyle, fieldLabelStyle, inputStyle, sectionStyle, sectionTitleStyle } from './controls'

export type StickerManagerProps = {
  api: ScheduleDocApi
}

export function StickerManager({ api }: StickerManagerProps) {
  const { doc, setDoc } = api
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')

  const ordered = [...doc.stickers].sort((a, b) => b.z - a.z)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setError('')
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 올릴 수 있습니다.')
      return
    }
    try {
      const blob = await resizeImageBlob(file)
      const assetId = await putAsset({
        kind: 'image', name: file.name, mime: 'image/png', blob,
      })
      setDoc((prev) => ({
        ...prev,
        stickers: [...prev.stickers, createSticker(assetId, prev.stickers)],
      }))
    } catch {
      setError('이미지를 불러오지 못했습니다.')
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleRemove = async (id: string, assetId: string) => {
    setDoc((prev) => removeSticker(prev, id))
    // 같은 에셋을 다른 스티커가 쓰고 있으면 지우지 않는다.
    const stillUsed = doc.stickers.some((s) => s.id !== id && s.assetId === assetId)
    if (!stillUsed) await deleteAsset(assetId)
  }

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>스티커</h2>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
      <button type="button" style={buttonStyle} onClick={() => inputRef.current?.click()}>
        스티커 추가
      </button>
      <p style={{ fontSize: 12, color: '#71717a', marginTop: 6 }}>
        배경이 투명한 PNG가 가장 잘 맞습니다. 추가한 뒤 미리보기에서 끌어 옮기세요.
      </p>
      {error && <p style={{ fontSize: 12, color: '#c0392b', marginTop: 4 }}>{error}</p>}

      {ordered.map((sticker, index) => (
        <div key={sticker.id} style={{ borderTop: '1px solid #e4e4e7', paddingTop: 10, marginTop: 10 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <button
              type="button"
              style={buttonStyle}
              disabled={index === 0}
              onClick={() => setDoc((prev) => reorderSticker(prev, sticker.id, 'up'))}
            >
              앞으로
            </button>
            <button
              type="button"
              style={buttonStyle}
              disabled={index === ordered.length - 1}
              onClick={() => setDoc((prev) => reorderSticker(prev, sticker.id, 'down'))}
            >
              뒤로
            </button>
            <button
              type="button"
              style={buttonStyle}
              onClick={() => void handleRemove(sticker.id, sticker.assetId)}
            >
              삭제
            </button>
          </div>

          <label style={fieldLabelStyle} htmlFor={`sticker-width-${sticker.id}`}>
            크기 {Math.round(sticker.width)}
          </label>
          <input
            id={`sticker-width-${sticker.id}`}
            type="range"
            min={STICKER_MIN_WIDTH}
            max={STICKER_MAX_WIDTH}
            value={sticker.width}
            style={{ ...inputStyle, padding: 0 }}
            onChange={(e) =>
              setDoc((prev) => updateSticker(prev, sticker.id, { width: Number(e.target.value) }))
            }
          />

          <label style={fieldLabelStyle} htmlFor={`sticker-rotation-${sticker.id}`}>
            회전 {Math.round(sticker.rotation)}°
          </label>
          <input
            id={`sticker-rotation-${sticker.id}`}
            type="range"
            min={-180}
            max={180}
            value={sticker.rotation}
            style={{ ...inputStyle, padding: 0 }}
            onChange={(e) =>
              setDoc((prev) =>
                updateSticker(prev, sticker.id, { rotation: Number(e.target.value) }),
              )
            }
          />
        </div>
      ))}
    </section>
  )
}
```

- [ ] **Step 8: 미리보기 위 드래그 조작 추가**

`PreviewStage`가 축소 배율을 알고 있으므로 여기에 얹는다. `PreviewStageProps`에 `onScaleChange`를 추가하고, `setScale(...)` 호출 뒤에 콜백을 부른다.

`src/editor/PreviewStage.tsx`의 props와 `update` 함수를 바꾼다.

```tsx
export type PreviewStageProps = {
  children: ReactNode
  /** 축소 배율이 바뀔 때 알린다. 드래그 좌표 환산에 필요하다. */
  onScaleChange?: (scale: number) => void
}
```

```tsx
export function PreviewStage({ children, onScaleChange }: PreviewStageProps) {
```

`useLayoutEffect` 안의 `update`를 바꾼다.

```tsx
    const update = () => {
      const next = host.clientWidth / CANVAS_WIDTH
      setScale(next)
      onScaleChange?.(next)
    }
```

의존성 배열은 `[onScaleChange]`로 바꾼다. App은 이 콜백을 `useCallback`으로 감싸 넘긴다.

그리고 드래그 오버레이를 새로 만든다. `src/editor/StickerDragLayer.tsx`:

```tsx
import { useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { updateSticker } from '../model/stickers'
import type { Sticker } from '../model/types'
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../preview/layout'
import type { ScheduleDocApi } from '../state/useScheduleDoc'

export type StickerDragLayerProps = {
  api: ScheduleDocApi
  /** 미리보기 축소 배율. 화면 이동량을 캔버스 좌표로 환산하는 데 쓴다. */
  scale: number
}

type DragState = {
  id: string
  pointerId: number
  startClientX: number
  startClientY: number
  startX: number
  startY: number
}

/**
 * 미리보기 위에 겹쳐 스티커를 끌어 옮기게 한다.
 *
 * preview/는 표시만 하고 조작은 editor/가 맡는다는 경계를 지키기 위해
 * 별도 오버레이로 분리했다.
 */
export function StickerDragLayer({ api, scale }: StickerDragLayerProps) {
  const { doc, setDoc } = api
  const dragRef = useRef<DragState | null>(null)

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>, sticker: Sticker) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      id: sticker.id,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: sticker.x,
      startY: sticker.y,
    }
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId || scale <= 0) return
    const dx = (event.clientX - drag.startClientX) / scale
    const dy = (event.clientY - drag.startClientY) / scale
    setDoc((prev) =>
      updateSticker(prev, drag.id, {
        x: Math.round(drag.startX + dx),
        y: Math.round(drag.startY + dy),
      }),
    )
  }

  const endDrag = () => {
    dragRef.current = null
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: CANVAS_WIDTH * scale,
        height: CANVAS_HEIGHT * scale,
        pointerEvents: 'none',
      }}
    >
      {doc.stickers.map((sticker) => (
        <div
          key={sticker.id}
          onPointerDown={(e) => onPointerDown(e, sticker)}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          style={{
            position: 'absolute',
            left: sticker.x * scale,
            top: sticker.y * scale,
            width: sticker.width * scale,
            // 원본 비율을 모르므로 정사각형 잡이 영역을 쓴다. 끌기에는 충분하다.
            height: sticker.width * scale,
            transform: `rotate(${sticker.rotation}deg)`,
            transformOrigin: 'center center',
            border: '1px dashed rgba(24,24,27,0.5)',
            cursor: 'move',
            pointerEvents: 'auto',
            touchAction: 'none',
          }}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 9: EditorPanel과 App 배선**

`EditorPanel.tsx`에서 `StickerManager`를 import하고 `BackgroundPicker` 아래에 `<StickerManager api={api} />`를 넣는다.

`src/App.tsx`에서 `useCallback`, `useState`, `StickerDragLayer`를 import하고 배율 상태를 든다.

```tsx
  const [previewScale, setPreviewScale] = useState(0)
  const handleScaleChange = useCallback((scale: number) => setPreviewScale(scale), [])
```

미리보기 영역을 `position: relative`인 래퍼로 감싸고 드래그 레이어를 얹는다.

```tsx
        <div style={{ position: 'sticky', top: 16 }}>
          <div style={{ position: 'relative' }}>
            <PreviewStage onScaleChange={handleScaleChange}>
              <ScheduleCanvas
                ref={canvasRef}
                doc={api.doc}
                fontFamily={fontFamily}
                backgroundUrl={backgroundUrl}
              />
            </PreviewStage>
            <StickerDragLayer api={api} scale={previewScale} />
          </div>
        </div>
```

- [ ] **Step 10: 눈으로 확인**

Run: `npm run dev`
Expected: 확인할 것 —
- 스티커를 추가하면 미리보기 중앙에 나타나고 점선 테두리가 보인다
- 끌어서 옮기면 따라온다. 창 폭을 바꿔도(배율이 달라져도) 정확히 따라온다
- 크기·회전 슬라이더가 즉시 반영된다
- 스티커 2개를 겹치고 "앞으로/뒤로"를 누르면 쌓임 순서가 바뀐다
- 삭제하면 사라지고, 새로고침해도 나머지는 그대로다

- [ ] **Step 11: 타입 검사와 전체 테스트**

Run: `npx tsc -b && npm test`
Expected: 타입 에러 없음, 모든 테스트 통과

- [ ] **Step 12: 커밋**

```bash
git add src
git commit -m "$(cat <<'EOF'
feat: 스티커 추가·드래그·크기·회전·순서 변경 지원

좌표는 4000x2250 기준 절대 px로 저장한다. 화면 픽셀로 저장하면
다른 크기의 화면에서 편집했을 때 위치가 어긋난다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 17: 이미지 내보내기

**Files:**
- Create: `src/export/exportImage.ts`
- Create: `src/editor/ExportPanel.tsx`
- Modify: `src/editor/EditorPanel.tsx`
- Modify: `src/App.tsx`
- Test: `src/export/exportImage.test.ts`

**Interfaces:**
- Consumes: `CANVAS_WIDTH`·`CANVAS_HEIGHT`(Task 8), `ScheduleDoc`(Task 2), `html-to-image`
- Produces:
  - `type ExportSizeKey = 'original' | '4k' | 'fhd' | 'hd'`
  - `EXPORT_SIZES: Record<ExportSizeKey, { label: string; suffix: string; width: number; height: number }>` — `label`은 버튼에 보이는 이름, `suffix`는 파일명에 들어가는 문자열
  - `exportFileName(year: number, month: number, key: ExportSizeKey): string`
  - `renderCanvasPng(node: HTMLElement): Promise<string>` — 4000×2250 data URL
  - `downscalePng(dataUrl: string, width: number, height: number): Promise<Blob>`
  - `exportSchedule(node: HTMLElement, doc: ScheduleDoc, key: ExportSizeKey): Promise<void>`

- [ ] **Step 1: 실패하는 테스트 작성**

`html-to-image`와 캔버스 디코딩은 jsdom에서 신뢰할 수 없다. 순수한 부분만 테스트하고 나머지는 Step 6의 수동 확인에 맡긴다.

`src/export/exportImage.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../preview/layout'
import { EXPORT_SIZES, type ExportSizeKey, exportFileName } from './exportImage'

describe('EXPORT_SIZES', () => {
  it('네 가지 크기를 제공한다', () => {
    expect(Object.keys(EXPORT_SIZES).sort()).toEqual(['4k', 'fhd', 'hd', 'original'])
  })

  it('원본은 캔버스 크기와 정확히 같다', () => {
    expect(EXPORT_SIZES.original.width).toBe(CANVAS_WIDTH)
    expect(EXPORT_SIZES.original.height).toBe(CANVAS_HEIGHT)
  })

  it('스펙에 적힌 크기와 일치한다', () => {
    expect(EXPORT_SIZES.original).toMatchObject({ width: 4000, height: 2250 })
    expect(EXPORT_SIZES['4k']).toMatchObject({ width: 3840, height: 2160 })
    expect(EXPORT_SIZES.fhd).toMatchObject({ width: 1920, height: 1080 })
    expect(EXPORT_SIZES.hd).toMatchObject({ width: 1280, height: 720 })
  })

  it('전부 16:9다', () => {
    for (const size of Object.values(EXPORT_SIZES)) {
      expect(size.width / size.height).toBeCloseTo(16 / 9, 10)
    }
  })

  it('모두 이름을 갖는다', () => {
    for (const size of Object.values(EXPORT_SIZES)) {
      expect(size.label.length).toBeGreaterThan(0)
    }
  })
})

describe('exportFileName', () => {
  it('년-월과 크기 이름을 담는다', () => {
    expect(exportFileName(2026, 8, 'original')).toBe('2026-08_스케줄_원본.png')
    expect(exportFileName(2026, 8, '4k')).toBe('2026-08_스케줄_4K.png')
    expect(exportFileName(2026, 8, 'fhd')).toBe('2026-08_스케줄_FHD.png')
    expect(exportFileName(2026, 8, 'hd')).toBe('2026-08_스케줄_HD.png')
  })

  it('월을 두 자리로 채운다', () => {
    expect(exportFileName(2026, 3, 'hd')).toBe('2026-03_스케줄_HD.png')
  })

  it('모든 크기 키가 이름을 만든다', () => {
    for (const key of Object.keys(EXPORT_SIZES) as ExportSizeKey[]) {
      expect(exportFileName(2026, 8, key).endsWith('.png')).toBe(true)
    }
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npx vitest run src/export/exportImage.test.ts`
Expected: FAIL — `Failed to resolve import "./exportImage"`

- [ ] **Step 3: 구현 작성**

`src/export/exportImage.ts`:

```ts
import { toPng } from 'html-to-image'
import type { ScheduleDoc } from '../model/types'
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../preview/layout'

export type ExportSizeKey = 'original' | '4k' | 'fhd' | 'hd'

export const EXPORT_SIZES: Record<
  ExportSizeKey,
  { label: string; suffix: string; width: number; height: number }
> = {
  original: { label: '원본', suffix: '원본', width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
  '4k': { label: '4K', suffix: '4K', width: 3840, height: 2160 },
  fhd: { label: 'Full HD', suffix: 'FHD', width: 1920, height: 1080 },
  hd: { label: 'HD', suffix: 'HD', width: 1280, height: 720 },
}

export function exportFileName(year: number, month: number, key: ExportSizeKey): string {
  const mm = String(month).padStart(2, '0')
  return `${year}-${mm}_스케줄_${EXPORT_SIZES[key].suffix}.png`
}

/**
 * 미리보기 노드를 4000×2250 PNG data URL로 만든다.
 *
 * 두 번 렌더링하고 두 번째 결과를 쓴다. html-to-image는 첫 호출에서 폰트나
 * 이미지가 아직 준비되지 않아 빠진 채로 그려지는 알려진 문제가 있다.
 * document.fonts.ready만으로는 부족한 브라우저가 있어 이중으로 막는다.
 */
export async function renderCanvasPng(node: HTMLElement): Promise<string> {
  await document.fonts.ready

  const options = {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    pixelRatio: 1,
    cacheBust: true,
    skipFonts: false,
  }

  await toPng(node, options)
  return toPng(node, options)
}

/** 원본 PNG를 지정 크기로 줄인다. 모두 같은 16:9라 비율은 그대로다. */
export async function downscalePng(
  dataUrl: string,
  width: number,
  height: number,
): Promise<Blob> {
  const image = new Image()
  image.src = dataUrl
  await image.decode()

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('캔버스를 만들 수 없습니다.')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(image, 0, 0, width, height)

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('이미지를 만들지 못했습니다.')
  return blob
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  // 클릭 직후 해제하면 일부 브라우저에서 다운로드가 취소된다.
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export async function exportSchedule(
  node: HTMLElement,
  doc: ScheduleDoc,
  key: ExportSizeKey,
): Promise<void> {
  const dataUrl = await renderCanvasPng(node)
  const size = EXPORT_SIZES[key]
  const blob = await downscalePng(dataUrl, size.width, size.height)
  triggerDownload(blob, exportFileName(doc.year, doc.month, key))
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/export/exportImage.test.ts`
Expected: PASS — 8 passed

- [ ] **Step 5: ExportPanel 작성**

내보내기는 1~3초 걸린다. 진행 표시를 띄우고 버튼을 잠그지 않으면 연타로 중복 실행된다.

`src/editor/ExportPanel.tsx`:

```tsx
import { useState, type RefObject } from 'react'
import {
  EXPORT_SIZES, type ExportSizeKey, exportSchedule,
} from '../export/exportImage'
import type { ScheduleDocApi } from '../state/useScheduleDoc'
import { buttonStyle, sectionStyle, sectionTitleStyle } from './controls'

export type ExportPanelProps = {
  api: ScheduleDocApi
  canvasRef: RefObject<HTMLDivElement>
}

export function ExportPanel({ api, canvasRef }: ExportPanelProps) {
  const [busy, setBusy] = useState<ExportSizeKey | null>(null)
  const [error, setError] = useState('')

  const handleExport = async (key: ExportSizeKey) => {
    const node = canvasRef.current
    if (!node) {
      setError('미리보기를 찾지 못했습니다. 새로고침 후 다시 시도해 주세요.')
      return
    }
    setError('')
    setBusy(key)
    try {
      await exportSchedule(node, api.doc, key)
    } catch (err) {
      setError(
        err instanceof Error
          ? `이미지를 만들지 못했습니다: ${err.message}`
          : '이미지를 만들지 못했습니다.',
      )
    } finally {
      setBusy(null)
    }
  }

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>이미지 저장</h2>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(Object.keys(EXPORT_SIZES) as ExportSizeKey[]).map((key) => {
          const size = EXPORT_SIZES[key]
          return (
            <button
              key={key}
              type="button"
              style={{ ...buttonStyle, opacity: busy ? 0.5 : 1 }}
              disabled={busy !== null}
              onClick={() => void handleExport(key)}
            >
              {busy === key ? '만드는 중…' : `${size.label} (${size.width}×${size.height})`}
            </button>
          )
        })}
      </div>
      <p style={{ fontSize: 12, color: '#71717a', marginTop: 8 }}>
        만드는 데 1~3초 걸립니다. 창을 닫지 말고 기다려 주세요.
      </p>
      {error && <p style={{ fontSize: 12, color: '#c0392b', marginTop: 4 }}>{error}</p>}
    </section>
  )
}
```

- [ ] **Step 6: EditorPanel과 App 배선**

`EditorPanelProps`에 `canvasRef: RefObject<HTMLDivElement>`를 추가하고, `MonthPicker` **위**에 `<ExportPanel api={api} canvasRef={canvasRef} />`를 넣는다. 가장 자주 쓰는 기능이라 맨 위에 둔다.

`src/App.tsx`의 `EditorPanel` 사용부에 `canvasRef={canvasRef}`를 추가한다.

- [ ] **Step 7: 눈으로 확인 — 이 태스크의 진짜 검증**

Run: `npm run dev`

일정 몇 개, 강조, 헤더 MEMO/ToDo, 업로드 폰트, 배경 이미지, 스티커를 모두 채운 상태에서 확인한다.

Expected:
- 네 버튼을 각각 눌러 파일이 받아진다. 파일명이 `2026-08_스케줄_원본.png` 형태다
- 받은 파일을 열어 **픽셀 크기가 정확히** 4000×2250 / 3840×2160 / 1920×1080 / 1280×720이다
- 결과 이미지의 글꼴이 화면과 같다. 특히 **업로드한 폰트가 반영되어 있다** (이게 이 태스크에서 가장 깨지기 쉬운 지점이다)
- 스티커 위치·크기·회전이 미리보기와 일치한다
- 배경 이미지가 빠지지 않았다
- 자동 축소된 긴 텍스트가 화면과 같은 크기로 나온다
- 만드는 동안 버튼이 잠기고 "만드는 중…"이 보인다

폰트가 빠졌다면 `registerFontFace`가 `<style>`에 규칙을 넣었는지 브라우저 개발자 도구의 Elements에서 `#weekplanner-user-fonts`를 찾아 확인한다.

- [ ] **Step 8: 타입 검사와 전체 테스트**

Run: `npx tsc -b && npm test`
Expected: 타입 에러 없음, 모든 테스트 통과

- [ ] **Step 9: 커밋**

```bash
git add src
git commit -m "$(cat <<'EOF'
feat: 4단계 크기 PNG 내보내기 추가

4000x2250으로 한 번만 렌더링한 뒤 캔버스에서 축소해 나머지를 만든다.
html-to-image는 첫 호출에서 폰트가 빠지는 알려진 문제가 있어
두 번 렌더링하고 두 번째 결과를 쓴다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 18: 마무리 — 데이터 정리, 문서, 배포

**Files:**
- Create: `src/editor/StorageStatus.tsx`
- Create: `docs/manual-checklist.md`
- Create: `README.md`
- Modify: `src/editor/EditorPanel.tsx`
- Modify: `src/model/assets.ts`
- Test: `src/model/assets.test.ts` (추가)

**Interfaces:**
- Consumes: `listAssets`·`deleteAsset`(Task 5), `listSavedMonthKeys`·`loadDoc`(Task 4), `ScheduleDocApi`(Task 11)
- Produces:
  - `collectUsedAssetIds(): Set<string>` (`assets.ts`)
  - `purgeUnusedAssets(): Promise<number>` (`assets.ts`) — 지운 개수 반환
  - `StorageStatus` — props `{ api: ScheduleDocApi }`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/model/assets.test.ts` 끝에 덧붙인다. 파일 상단 import에 `collectUsedAssetIds`, `purgeUnusedAssets`를 추가하고, `createEmptyDoc`과 `saveDoc`도 import한다.

```ts
describe('사용하지 않는 에셋 정리', () => {
  beforeEach(() => localStorage.clear())

  it('문서에서 참조 중인 에셋 id를 모은다', () => {
    const doc = createEmptyDoc(2026, 8)
    doc.backgroundAssetId = 'bg-1'
    doc.stickers = [
      { id: 's1', assetId: 'st-1', x: 0, y: 0, width: 400, rotation: 0, z: 0 },
      { id: 's2', assetId: 'st-2', x: 0, y: 0, width: 400, rotation: 0, z: 1 },
    ]
    doc.fontId = 'user-f1'
    saveDoc(doc)

    const used = collectUsedAssetIds()
    expect(used.has('bg-1')).toBe(true)
    expect(used.has('st-1')).toBe(true)
    expect(used.has('st-2')).toBe(true)
    expect(used.has('f1')).toBe(true)
  })

  it('여러 달의 참조를 모두 모은다', () => {
    const august = createEmptyDoc(2026, 8)
    august.backgroundAssetId = 'bg-8'
    saveDoc(august)
    const september = createEmptyDoc(2026, 9)
    september.backgroundAssetId = 'bg-9'
    saveDoc(september)

    const used = collectUsedAssetIds()
    expect(used.has('bg-8')).toBe(true)
    expect(used.has('bg-9')).toBe(true)
  })

  it('참조되지 않는 에셋만 지운다', async () => {
    const keepId = await putAsset({
      kind: 'image', name: 'keep', mime: 'image/png', blob: makeBlob('keep'),
    })
    const dropId = await putAsset({
      kind: 'image', name: 'drop', mime: 'image/png', blob: makeBlob('drop'),
    })

    const doc = createEmptyDoc(2026, 8)
    doc.backgroundAssetId = keepId
    saveDoc(doc)

    expect(await purgeUnusedAssets()).toBe(1)
    expect(await getAsset(keepId)).not.toBeNull()
    expect(await getAsset(dropId)).toBeNull()
  })

  it('지울 게 없으면 0을 준다', async () => {
    expect(await purgeUnusedAssets()).toBe(0)
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npx vitest run src/model/assets.test.ts`
Expected: FAIL — `collectUsedAssetIds is not a function` 또는 import 오류

- [ ] **Step 3: assets.ts에 정리 기능 추가**

`src/model/assets.ts` 끝에 덧붙인다. 파일 상단에 `import { listSavedMonthKeys } from './storage'`와 `import { DOC_KEY_PREFIX } from './storage'`를 추가한다.

```ts
/**
 * 저장된 모든 달의 문서를 훑어 참조 중인 에셋 id를 모은다.
 *
 * 폰트 id는 'user-<assetId>' 형태이므로 접두사를 떼어낸다(theme/fonts.ts 참고).
 * 내장 폰트 id는 이 형태가 아니므로 자연히 걸러진다.
 */
export function collectUsedAssetIds(): Set<string> {
  const used = new Set<string>()

  for (const key of listSavedMonthKeys()) {
    const raw = localStorage.getItem(`${DOC_KEY_PREFIX}${key}`)
    if (!raw) continue
    try {
      const doc = JSON.parse(raw) as {
        backgroundAssetId?: string | null
        stickers?: { assetId?: string }[]
        fontId?: string
      }
      if (doc.backgroundAssetId) used.add(doc.backgroundAssetId)
      for (const sticker of doc.stickers ?? []) {
        if (sticker.assetId) used.add(sticker.assetId)
      }
      if (doc.fontId?.startsWith('user-')) used.add(doc.fontId.slice('user-'.length))
    } catch {
      // 손상된 문서는 건너뛴다. 참조를 모르니 정리 대상에서 뺄 뿐이다.
    }
  }
  return used
}

/** 어떤 문서도 참조하지 않는 에셋을 지운다. 지운 개수를 준다. */
export async function purgeUnusedAssets(): Promise<number> {
  const used = collectUsedAssetIds()
  const all = await listAssets()
  const unused = all.filter((asset) => !used.has(asset.id))
  for (const asset of unused) await deleteAsset(asset.id)
  return unused.length
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/model/assets.test.ts`
Expected: PASS — 11 passed

- [ ] **Step 5: StorageStatus 작성**

저장 공간이 찼을 때 사용자가 스스로 풀 수 있는 길을 준다.

`src/editor/StorageStatus.tsx`:

```tsx
import { useState } from 'react'
import { listAssets, purgeUnusedAssets } from '../model/assets'
import type { ScheduleDocApi } from '../state/useScheduleDoc'
import { buttonStyle, sectionStyle, sectionTitleStyle } from './controls'

export type StorageStatusProps = {
  api: ScheduleDocApi
}

export function StorageStatus({ api }: StorageStatusProps) {
  const [notice, setNotice] = useState('')

  const handlePurge = async () => {
    const before = (await listAssets()).length
    const removed = await purgeUnusedAssets()
    setNotice(
      removed === 0
        ? `정리할 것이 없습니다. (보관 중 ${before}개)`
        : `사용하지 않는 파일 ${removed}개를 지웠습니다.`,
    )
  }

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>저장 공간</h2>
      {api.saveError === 'quota' && (
        <p style={{ fontSize: 13, color: '#c0392b', marginBottom: 8 }}>
          저장 공간이 가득 찼습니다. 아래 정리를 눌러 보세요.
        </p>
      )}
      <button type="button" style={buttonStyle} onClick={() => void handlePurge()}>
        사용하지 않는 이미지·폰트 정리
      </button>
      <p style={{ fontSize: 12, color: '#71717a', marginTop: 6 }}>
        어떤 달에서도 쓰지 않는 파일만 지웁니다. 지금 쓰는 것은 남습니다.
      </p>
      {notice && <p style={{ fontSize: 12, color: '#52525b', marginTop: 4 }}>{notice}</p>}
    </section>
  )
}
```

- [ ] **Step 6: EditorPanel에 연결**

`StorageStatus`를 import하고 패널 맨 아래(`FooterEditor` 다음)에 `<StorageStatus api={api} />`를 넣는다.

- [ ] **Step 7: 수동 검증 체크리스트 작성**

`docs/manual-checklist.md`:

```markdown
# 수동 검증 체크리스트

렌더링과 이미지 내보내기는 결과물이 이미지라 자동 판정이 어렵다.
스냅샷 테스트를 걸면 디자인을 고칠 때마다 깨져 오히려 방해가 되므로
이 목록으로 대신한다. 디자인이나 레이아웃을 고친 뒤에는 전부 다시 확인한다.

## 달력

- [ ] 6주가 필요한 달(예: 2026년 8월)과 5주로 끝나는 달(예: 2025년 5월) 모두 격자가 42칸이고 칸 크기가 같다
- [ ] 윤년 2월(2024-02)이 29일까지 나온다
- [ ] 1월과 12월에서 앞뒤 달 날짜가 연도를 넘어 올바르게 채워진다
- [ ] 앞뒤 달 날짜가 흐리게 보이고 편집 목록에는 나오지 않는다
- [ ] 일요일 날짜가 빨간색이다

## 텍스트

- [ ] 긴 일정 텍스트가 자동으로 작아져 칸 안에 들어간다
- [ ] **짧은 텍스트는 기본 크기 그대로 나온다** — 짧은 글까지 작아지면 측정 반올림 함정(Task 7)에 걸린 것이다
- [ ] 짧은 텍스트가 칸 중앙에 정렬된다
- [ ] 폰트를 바꾼 뒤에도 텍스트가 칸을 넘지 않는다 (재측정 확인)
- [ ] 아주 긴 텍스트를 넣어도 칸 크기와 격자 위치가 변하지 않는다
- [ ] 최소 크기로도 안 들어갈 만큼 긴 글에는 편집 폼에 경고가 뜬다

## 강조

- [ ] 칸 배경 채우기가 적용된다
- [ ] 형광펜이 글자 아래쪽에 깔린다
- [ ] 날짜 색을 지정하면 일요일 빨강보다 우선한다
- [ ] `×` 버튼으로 각 강조를 없앨 수 있다

## 헤더와 하단

- [ ] 자동 제목이 영문 월 이름으로 나온다
- [ ] 직접 입력 제목에 한글을 넣어도 잘리지 않는다
- [ ] 직접 입력을 비우면 영문 월 이름으로 되돌아간다
- [ ] MEMO를 켜면 줄노트가 나오고 글이 줄 위에 얹힌다
- [ ] To Do List 항목을 추가·삭제·체크할 수 있다
- [ ] 하단 문구를 껐다 켜도 격자 위치가 움직이지 않는다

## 테마·폰트·배경·스티커

- [ ] 테마 4종이 모두 적용되고 편집 패널의 스와치 색도 따라 바뀐다
- [ ] 폰트 파일(.ttf/.woff2)을 추가하면 즉시 적용된다
- [ ] `.png` 같은 잘못된 파일을 고르면 안내가 뜬다
- [ ] 배경 이미지를 올리고 없앨 수 있다
- [ ] 스티커를 끌어 옮기면 따라오고, 창 폭을 바꿔도 정확히 따라온다
- [ ] 스티커 크기·회전·앞뒤 순서가 반영된다

## 이미지 내보내기 (가장 중요)

- [ ] 네 가지 크기가 모두 받아진다
- [ ] 파일 크기가 정확히 4000×2250 / 3840×2160 / 1920×1080 / 1280×720이다
- [ ] 파일명이 `2026-08_스케줄_원본.png` 형태다
- [ ] **업로드한 폰트가 결과 이미지에 반영되어 있다**
- [ ] 배경 이미지가 결과에 들어 있다
- [ ] 스티커 위치·크기·회전이 미리보기와 일치한다
- [ ] 자동 축소된 텍스트가 화면과 같은 크기로 나온다
- [ ] 만드는 동안 버튼이 잠긴다

## 저장

- [ ] 새로고침해도 입력한 내용이 남아 있다
- [ ] 월을 바꿨다 돌아오면 내용이 그대로다
- [ ] 지난달 내용 가져오기가 요일을 보존한다
- [ ] "사용하지 않는 이미지·폰트 정리"가 지금 쓰는 파일은 남긴다
```

- [ ] **Step 8: README 작성**

`README.md`:

```markdown
# 월간 스케줄표 이미지 생성기

년·월을 고르고 일정을 채우면 4000×2250 스케줄표 이미지를 만들어 준다.
백엔드 없이 브라우저 안에서 전부 동작한다.

## 실행

    npm install
    npm run dev

## 테스트

    npm test

## 빌드

    npm run build

`dist/`에 정적 파일이 나온다. `base: './'`로 빌드하므로 GitHub Pages,
Vercel, Netlify 등 하위 경로 배포에도 그대로 올릴 수 있다.

## 구조

- `src/model/` — 도메인 타입, 달력 계산, 저장소. React를 모른다
- `src/preview/` — `ScheduleDoc` 하나만 받아 그리는 표시 계층
- `src/editor/` — 입력 UI
- `src/export/` — PNG 추출
- `src/state/` — 문서 상태와 자동 저장

### 지켜야 할 규칙

**`src/preview/` 안에서는 치수 단위로 `px`만 쓴다.** `%`, `rem`, `vw`,
미디어쿼리를 쓰지 않는다. 화면 크기에 반응하는 순간 미리보기와 내보낸
이미지가 어긋난다. 축소는 `editor/PreviewStage.tsx`가 담당한다.

**`src/preview/` 컴포넌트는 `ScheduleDoc`(과 파생 값)만 받는다.** 저장
함수나 상태 setter를 넘기지 않는다. 그래야 디자인을 갈아엎어도 `preview/`만
고치면 되고, 편집 UI를 바꿔도 결과물이 흔들리지 않는다.

**폰트는 `<style>`에 data URL `@font-face`로 등록한다.** `FontFace` API를
쓰면 화면에는 나오지만 내보낸 이미지에서 폰트가 빠진다. `html-to-image`가
`document.styleSheets`만 훑기 때문이다.

## 설계 문서

- 설계: `docs/superpowers/specs/2026-08-08-monthly-schedule-image-editor-design.md`
- 구현 계획: `docs/superpowers/plans/2026-08-08-monthly-schedule-image-editor.md`
- 수동 검증: `docs/manual-checklist.md`
```

- [ ] **Step 9: 전체 검증**

Run: `npx tsc -b && npm test && npm run build`
Expected: 타입 에러 없음, 모든 테스트 통과, `dist/` 생성

- [ ] **Step 10: 수동 체크리스트 전체 수행**

Run: `npm run dev`
Expected: `docs/manual-checklist.md`의 모든 항목을 실제로 확인한다. 실패하는 항목이 있으면 고친 뒤 다시 확인한다.

- [ ] **Step 11: 커밋**

```bash
git add src docs README.md
git commit -m "$(cat <<'EOF'
feat: 에셋 정리 기능과 수동 검증 체크리스트, README 추가

저장 공간이 찼을 때 사용자가 스스로 풀 수 있도록
어떤 문서도 참조하지 않는 이미지·폰트를 지우는 기능을 넣었다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## 완료 기준

전부 만족해야 완료다.

- `npm test`가 전부 통과한다
- `npx tsc -b`에 에러가 없다
- `npm run build`가 성공한다
- `docs/manual-checklist.md`의 모든 항목이 확인되었다
- 실제로 스케줄표를 하나 만들어 4000×2250 PNG를 받아 보았고, 업로드한 폰트와 스티커가 결과 이미지에 정확히 들어 있다
