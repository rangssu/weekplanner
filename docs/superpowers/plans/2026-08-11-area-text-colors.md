# 영역별 글자색 + 배경 밝기 자동 전환 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**전제:** [`2026-08-11-cell-click-editing.md`](2026-08-11-cell-click-editing.md)를 **먼저 끝낸다.** Task 7이 그 계획의 `CELL_AREA_*` 상수를, Task 10이 「꾸미기」 탭을 쓴다.

**Goal:** 글자색을 5영역(제목·목표·할 일·메모·달력)으로 나누고, 배경 이미지가 어두우면 글자를 밝게 자동으로 바꾼다.

**Architecture:** 밝기 계산은 React를 모르는 순수 함수(`model/luminance.ts`)와 Canvas를 읽는 얇은 층으로 나눈다. `App`이 계산 결과와 문서의 수동 설정을 합쳐 **이미 해석이 끝난 색 5개**를 `ScheduleCanvas`에 넘긴다. `preview/`는 아무것도 모른다.

**Tech Stack:** React 18 · TypeScript · Canvas 2D API · vitest · jsdom

## Global Constraints

- **`src/preview/` 안에서는 `px`만 쓴다.** `%`·`rem`·`vw`·미디어쿼리 금지.
- **`src/preview/` 컴포넌트는 `ScheduleDoc`만 받는다.** 이미 해석된 색을 props로 받는 것은 `fontFamily`·`backgroundUrl`과 같은 성격의 기존 예외다.
- **레이아웃 수치를 하드코딩하지 않는다.** 전부 `src/preview/layout.ts`에서 파생한다.
- **배경 이미지가 없으면 밝기를 계산하지 않는다.** 저장된 문서의 모습이 바뀌면 안 된다.
- **불투명도를 반드시 반영한다.** 빼먹으면 기능이 틀린다.
- 임계치는 **140 / 255**.
- 테스트: `npm test` (앞 계획 완료 시점의 개수가 기준선), 타입: `npx tsc -b`
- 주석과 UI 문구는 한국어로 쓴다.

---

### Task 1: 밝기 계산 순수 함수

**Files:**
- Create: `src/model/luminance.ts`
- Test: `src/model/luminance.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `LUMINANCE_THRESHOLD: number` (= 140)
  - `hexLuminance(hex: string): number`
  - `sampleLuminance(data: Uint8ClampedArray, width: number, height: number, maxSamples?: number): number`
  - `blendLuminance(imageLuma: number, overlayHex: string, opacity: number): number`
  - `pickTextTone(luma: number, threshold?: number): 'dark' | 'light'`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/model/luminance.test.ts`를 만든다.

```ts
import { describe, expect, it } from 'vitest'
import {
  LUMINANCE_THRESHOLD, blendLuminance, hexLuminance, pickTextTone, sampleLuminance,
} from './luminance'

/** width×height 크기의 단색 RGBA 버퍼를 만든다. */
function solid(width: number, height: number, r: number, g: number, b: number) {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = r
    data[i * 4 + 1] = g
    data[i * 4 + 2] = b
    data[i * 4 + 3] = 255
  }
  return data
}

describe('hexLuminance', () => {
  it('순백은 255다', () => {
    expect(hexLuminance('#ffffff')).toBeCloseTo(255, 5)
  })

  it('순흑은 0이다', () => {
    expect(hexLuminance('#000000')).toBeCloseTo(0, 5)
  })

  it('사람 눈이 초록을 가장 밝게 본다', () => {
    expect(hexLuminance('#00ff00')).toBeGreaterThan(hexLuminance('#ff0000'))
    expect(hexLuminance('#ff0000')).toBeGreaterThan(hexLuminance('#0000ff'))
  })

  it('공식 그대로다', () => {
    // 0.299*255 = 76.245
    expect(hexLuminance('#ff0000')).toBeCloseTo(76.245, 3)
  })

  it('형식이 틀리면 중간값을 준다', () => {
    expect(hexLuminance('rgba(0,0,0,0.5)')).toBe(128)
  })
})

describe('sampleLuminance', () => {
  it('단색 이미지는 그 색의 밝기를 준다', () => {
    expect(sampleLuminance(solid(40, 40, 255, 255, 255), 40, 40)).toBeCloseTo(255, 5)
    expect(sampleLuminance(solid(40, 40, 0, 0, 0), 40, 40)).toBeCloseTo(0, 5)
  })

  it('샘플 수를 줄여도 단색이면 값이 같다', () => {
    const data = solid(200, 200, 100, 100, 100)
    const full = sampleLuminance(data, 200, 200, 40000)
    const sparse = sampleLuminance(data, 200, 200, 100)
    expect(sparse).toBeCloseTo(full, 5)
  })

  it('반은 희고 반은 검으면 중간값이 나온다', () => {
    const width = 40
    const height = 40
    const data = new Uint8ClampedArray(width * height * 4)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        const v = y < height / 2 ? 255 : 0
        data[i] = v
        data[i + 1] = v
        data[i + 2] = v
        data[i + 3] = 255
      }
    }
    expect(sampleLuminance(data, width, height)).toBeCloseTo(127.5, 0)
  })

  it('빈 버퍼는 중간값을 준다', () => {
    expect(sampleLuminance(new Uint8ClampedArray(0), 0, 0)).toBe(128)
  })
})

describe('blendLuminance', () => {
  it('불투명도가 0이면 이미지 밝기 그대로다', () => {
    expect(blendLuminance(30, '#ffffff', 0)).toBeCloseTo(30, 5)
  })

  it('불투명도가 1이면 덮는 색의 밝기가 된다', () => {
    expect(blendLuminance(30, '#ffffff', 1)).toBeCloseTo(255, 5)
  })

  it('절반이면 중간이다', () => {
    expect(blendLuminance(0, '#ffffff', 0.5)).toBeCloseTo(127.5, 5)
  })
})

describe('pickTextTone', () => {
  it('임계치는 140이다', () => {
    expect(LUMINANCE_THRESHOLD).toBe(140)
  })

  it('임계치보다 밝으면 어두운 글자를 고른다', () => {
    expect(pickTextTone(141)).toBe('dark')
  })

  it('임계치와 같거나 어두우면 밝은 글자를 고른다', () => {
    expect(pickTextTone(140)).toBe('light')
    expect(pickTextTone(139)).toBe('light')
  })
})
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npm test -- src/model/luminance.test.ts`
Expected: FAIL — `./luminance` 모듈을 찾을 수 없음

- [ ] **Step 3: 구현한다**

`src/model/luminance.ts`를 만든다.

```ts
/**
 * 배경 밝기로 글자색을 고르는 계산. React도 DOM도 모른다.
 *
 * 밝기는 0~255다. 사람 눈이 색마다 다르게 느끼는 밝기를 반영한
 * 표준 가중치를 쓴다 — 같은 값의 초록이 파랑보다 훨씬 밝게 보인다.
 */

const R_WEIGHT = 0.299
const G_WEIGHT = 0.587
const B_WEIGHT = 0.114

/** 이보다 밝은 배경에는 어두운 글자를 얹는다. */
export const LUMINANCE_THRESHOLD = 140

/** 밝기를 알 수 없을 때 쓰는 중간값. 어느 쪽으로도 치우치지 않는다. */
const UNKNOWN_LUMINANCE = 128

const luma = (r: number, g: number, b: number): number =>
  R_WEIGHT * r + G_WEIGHT * g + B_WEIGHT * b

/**
 * `#rrggbb` 색의 밝기. 다른 형식이면 중간값을 준다.
 *
 * 테마 색은 전부 6자리 hex다(withAlpha도 같은 형식만 받는다).
 */
export function hexLuminance(hex: string): number {
  const match = /^#([0-9a-f]{6})$/i.exec(hex)
  if (match === null) return UNKNOWN_LUMINANCE
  const value = parseInt(match[1], 16)
  return luma((value >> 16) & 255, (value >> 8) & 255, value & 255)
}

/**
 * RGBA 버퍼의 평균 밝기.
 *
 * **전부 읽지 않는다.** 4000×2250 캔버스 전체는 900만 픽셀이라 배경을 바꿀
 * 때마다 눈에 띄게 멈춘다. 격자 간격을 벌려 최대 maxSamples개만 읽는다.
 * 평균을 내는 것이라 성긴 표본으로도 충분히 정확하다.
 */
export function sampleLuminance(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  maxSamples = 2000,
): number {
  const total = width * height
  if (total <= 0 || data.length < total * 4) return UNKNOWN_LUMINANCE

  const step = Math.max(1, Math.floor(Math.sqrt(total / maxSamples)))
  let sum = 0
  let count = 0
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4
      sum += luma(data[i], data[i + 1], data[i + 2])
      count++
    }
  }
  return count === 0 ? UNKNOWN_LUMINANCE : sum / count
}

/**
 * 배경 이미지 위에 반투명한 색이 덮일 때 **실제로 글자가 얹히는** 밝기.
 *
 * 이걸 빼먹으면 기능이 틀린다. 불투명도가 1이면 배경 이미지는 아예 안
 * 보이는데, 이미지 밝기로 글자색을 정하면 어두운 사진을 깔았다는 이유로
 * 흰 배경 위에 흰 글자가 나온다.
 */
export function blendLuminance(imageLuma: number, overlayHex: string, opacity: number): number {
  const clamped = Math.min(1, Math.max(0, opacity))
  return imageLuma * (1 - clamped) + hexLuminance(overlayHex) * clamped
}

/** 'dark'는 어두운 글자를 얹으라는 뜻이다. */
export function pickTextTone(
  luma: number,
  threshold: number = LUMINANCE_THRESHOLD,
): 'dark' | 'light' {
  return luma > threshold ? 'dark' : 'light'
}
```

- [ ] **Step 4: 통과를 확인한다**

Run: `npm test -- src/model/luminance.test.ts`
Expected: PASS (15개)

- [ ] **Step 5: 커밋**

```bash
git add src/model/luminance.ts src/model/luminance.test.ts
git commit -m "feat: 배경 밝기로 글자색을 고르는 순수 함수

blendLuminance가 핵심이다. 글자는 배경 이미지 위에 바로 얹히지 않고
사이에 알파가 들어간 테마 배경색이 있다. 이걸 빼먹으면 불투명도 1일 때
배경 이미지가 안 보이는데도 이미지 밝기로 글자색을 정해 흰 배경 위에
흰 글자가 나온다.

4000×2250은 900만 픽셀이라 전부 읽으면 멈춘다. 격자 간격을 벌려
최대 2000개만 읽는다."
```

---

### Task 2: 사이드바 상자 좌표를 layout.ts로

밝기를 재려면 상자 3개가 캔버스 어디에 있는지 알아야 한다. 그 계산이 지금 `Sidebar.tsx` 안에 지역 함수로 들어 있다.

**Files:**
- Modify: `src/preview/layout.ts`
- Modify: `src/preview/Sidebar.tsx`
- Test: `src/preview/layout.test.ts`

**Interfaces:**
- Consumes: 기존 `SIDEBAR_HEIGHT`·`SIDEBAR_WIDTH`·`GOALS_BOX_RATIO`·`TODO_BOX_RATIO`·`MEMO_BOX_RATIO`·`OUTER_PADDING`·`TITLE_ROW_HEIGHT`·`TITLE_GAP`
- Produces: `type BoxRect = { x: number; y: number; width: number; height: number }`, `sidebarBoxRects(enabled: [boolean, boolean, boolean]): [BoxRect | null, BoxRect | null, BoxRect | null]`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/preview/layout.test.ts`에 추가한다. `import`에 `sidebarBoxRects`를 더한다.

```ts
describe('사이드바 상자 좌표', () => {
  it('셋 다 켜면 세로 합이 사이드바 높이와 같다', () => {
    const rects = sidebarBoxRects([true, true, true])
    const total = rects.reduce((sum, r) => sum + (r?.height ?? 0), 0)
    expect(total).toBeLessThanOrEqual(SIDEBAR_HEIGHT)
    expect(total).toBeGreaterThan(SIDEBAR_HEIGHT - 3)
  })

  it('꺼진 상자는 null이다', () => {
    const rects = sidebarBoxRects([true, false, true])
    expect(rects[1]).toBeNull()
    expect(rects[0]).not.toBeNull()
    expect(rects[2]).not.toBeNull()
  })

  it('하나만 켜면 그것이 세로를 다 쓴다', () => {
    const rects = sidebarBoxRects([false, true, false])
    expect(rects[1]?.height).toBeGreaterThan(SIDEBAR_HEIGHT - 3)
  })

  it('아무것도 안 켜면 전부 null이다', () => {
    expect(sidebarBoxRects([false, false, false])).toEqual([null, null, null])
  })

  it('상자가 위에서부터 차례로 쌓인다', () => {
    const rects = sidebarBoxRects([true, true, true])
    expect(rects[1]!.y).toBeCloseTo(rects[0]!.y + rects[0]!.height, 5)
    expect(rects[2]!.y).toBeCloseTo(rects[1]!.y + rects[1]!.height, 5)
  })

  it('첫 상자가 제목 아래에서 시작한다', () => {
    const rects = sidebarBoxRects([true, true, true])
    expect(rects[0]!.y).toBe(OUTER_PADDING + TITLE_ROW_HEIGHT + TITLE_GAP)
    expect(rects[0]!.x).toBe(OUTER_PADDING)
    expect(rects[0]!.width).toBe(SIDEBAR_WIDTH)
  })
})
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npm test -- src/preview/layout.test.ts`
Expected: FAIL — `sidebarBoxRects`가 export되지 않음

- [ ] **Step 3: layout.ts에 옮긴다**

`src/preview/layout.ts`의 `MEMO_BOX_RATIO` 선언 아래에 넣는다.

```ts
export type BoxRect = { x: number; y: number; width: number; height: number }

/**
 * 사이드바 상자 3개가 캔버스에서 차지하는 자리. 꺼진 상자는 null이다.
 *
 * 켜진 상자끼리 세로를 나눠 갖는다. 하나만 켜면 그것이 다 쓴다.
 *
 * **Sidebar.tsx가 이 함수를 쓴다.** 배경 밝기를 재는 쪽이 같은 계산을 따로
 * 하면 두 번째 계산이 생겨 조용히 어긋나므로, 그리는 쪽과 재는 쪽이 하나를
 * 같이 쓴다.
 */
export function sidebarBoxRects(
  enabled: [boolean, boolean, boolean],
): [BoxRect | null, BoxRect | null, BoxRect | null] {
  const ratios = [GOALS_BOX_RATIO, TODO_BOX_RATIO, MEMO_BOX_RATIO]
  const shownRatioSum = ratios.reduce((sum, r, i) => sum + (enabled[i] ? r : 0), 0)

  const top = OUTER_PADDING + TITLE_ROW_HEIGHT + TITLE_GAP
  let y = top

  const rects = ratios.map((ratio, index) => {
    if (!enabled[index] || shownRatioSum === 0) return null
    // Sidebar가 flex로 쌓을 때와 같은 값이어야 하므로 내림도 그대로 맞춘다.
    const height = Math.floor((SIDEBAR_HEIGHT * ratio) / shownRatioSum)
    const rect: BoxRect = { x: OUTER_PADDING, y, width: SIDEBAR_WIDTH, height }
    y += height
    return rect
  })

  return rects as [BoxRect | null, BoxRect | null, BoxRect | null]
}
```

- [ ] **Step 4: Sidebar.tsx가 그것을 쓰게 한다**

`src/preview/Sidebar.tsx`의 `Sidebar` 함수 안에서 `ratios`·`shownRatioSum`·`heightOf` 세 줄을 지우고 다음으로 바꾼다. `import`에서 `GOALS_BOX_RATIO`·`TODO_BOX_RATIO`·`MEMO_BOX_RATIO`를 빼고 `sidebarBoxRects`를 넣는다.

```tsx
  const enabled: [boolean, boolean, boolean] = [
    header.goals.enabled, header.todo.enabled, header.memo.enabled,
  ]
  const shownCount = enabled.filter(Boolean).length
  // 상자 높이는 layout.ts가 정한다. 배경 밝기를 재는 쪽과 같은 값을 써야
  // 재는 자리와 그리는 자리가 어긋나지 않는다.
  const rects = sidebarBoxRects(enabled)
  const heightOf = (index: number) => rects[index]?.height ?? 0
```

`heightOf(0)`·`heightOf(1)`·`heightOf(2)`를 넘기는 기존 코드는 그대로 둔다.

- [ ] **Step 5: 통과를 확인한다**

Run: `npm test -- src/preview/layout.test.ts src/preview/Sidebar.test.ts`
Expected: PASS — 기존 Sidebar 테스트도 그대로 통과해야 한다

- [ ] **Step 6: 커밋**

```bash
git add src/preview/layout.ts src/preview/layout.test.ts src/preview/Sidebar.tsx
git commit -m "refactor: 사이드바 상자 좌표를 layout.ts로 옮긴다

배경 밝기를 상자마다 따로 재려면 상자가 캔버스 어디에 있는지 알아야
하는데, 켜진 상자끼리 비율을 재분배하는 계산이 Sidebar.tsx 안에
지역 함수로 있었다. 재는 쪽이 같은 계산을 따로 하면 조용히 어긋나므로
그리는 쪽과 재는 쪽이 하나를 같이 쓴다."
```

---

### Task 3: 테마에 자동 글자색 두 값

**Files:**
- Modify: `src/theme/themes.ts`
- Test: `src/theme/themes.test.ts` (없으면 새로 만든다)

**Interfaces:**
- Consumes: Task 1의 `hexLuminance`·`LUMINANCE_THRESHOLD`
- Produces: `Theme.autoTextOnLight: string`, `Theme.autoTextOnDark: string`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/theme/themes.test.ts`에 추가한다(파일이 없으면 만든다).

```ts
import { describe, expect, it } from 'vitest'
import { LUMINANCE_THRESHOLD, hexLuminance } from '../model/luminance'
import { THEMES } from './themes'

describe('자동 글자색', () => {
  it('모든 테마가 두 값을 갖는다', () => {
    for (const theme of THEMES) {
      expect(theme.autoTextOnLight, theme.id).toMatch(/^#[0-9a-f]{6}$/i)
      expect(theme.autoTextOnDark, theme.id).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it('두 값이 임계치를 사이에 두고 갈린다', () => {
    for (const theme of THEMES) {
      expect(hexLuminance(theme.autoTextOnLight), theme.id).toBeLessThan(LUMINANCE_THRESHOLD)
      expect(hexLuminance(theme.autoTextOnDark), theme.id).toBeGreaterThan(LUMINANCE_THRESHOLD)
    }
  })

  it('모든 테마가 제목과 본문 중 한쪽은 원래 색으로 버틴다', () => {
    // 원래 색이 밝은 배경과 어두운 배경 중 한쪽에서는 읽혀야 한다.
    // 양쪽 다 못 버티는 색(딱 임계치 근처의 회색)은 테마로 쓰지 않는다.
    for (const theme of THEMES) {
      for (const color of [theme.headerText, theme.bodyText]) {
        const luma = hexLuminance(color)
        expect(Math.abs(luma - LUMINANCE_THRESHOLD), `${theme.id} ${color}`)
          .toBeGreaterThan(20)
      }
    }
  })
})
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npm test -- src/theme/themes.test.ts`
Expected: FAIL — `autoTextOnLight`가 없음

- [ ] **Step 3: 구현한다**

`src/theme/themes.ts`의 `Theme` 타입에 더한다.

```ts
  /**
   * 배경 이미지가 밝을 때 얹을 어두운 글자색.
   *
   * 밝은 테마는 기존 bodyText와 같게 둔다 — 밝은 사진을 깔아도 지금과 같은
   * 모습이 나오고, 「배경이 없으면 테마 기본색」 규칙과도 이어진다.
   * 다크 테마는 bodyText가 이미 밝으므로 여기만 새로 정한다.
   */
  autoTextOnLight: string
  /** 배경 이미지가 어두울 때 얹을 밝은 글자색. */
  autoTextOnDark: string
```

각 테마 객체에 값을 더한다. 이 값들은 **원래 색이 그 배경에서 못 버틸 때만 쓰이는 대비책**이므로(Task 5), 테마 분위기를 유지하는 극값으로 잡는다.

```ts
// pink   (bodyText #5b3a42 · headerText #5b3a42)
autoTextOnLight: '#5b3a42',
autoTextOnDark: '#fff2f6',

// cream  (bodyText #3d362c · headerText #3d362c)
autoTextOnLight: '#3d362c',
autoTextOnDark: '#fdf8ef',

// mint   (bodyText #2f5b53 · headerText #2f5b53)
autoTextOnLight: '#2f5b53',
autoTextOnDark: '#f2fbf7',

// white  (bodyText #27272a · headerText #18181b)
autoTextOnLight: '#27272a',
autoTextOnDark: '#ffffff',

// dark   (bodyText #e7e9f2 · headerText #f2f3f8)
autoTextOnLight: '#1c1c1f',
autoTextOnDark: '#e7e9f2',
```

- [ ] **Step 4: 통과를 확인한다**

Run: `npm test -- src/theme/themes.test.ts`
Expected: PASS (3개)

- [ ] **Step 5: 커밋**

```bash
git add src/theme/themes.ts src/theme/themes.test.ts
git commit -m "feat: 테마마다 자동 글자색 두 값

한 값만 두면 다크 테마에서 깨진다. 「밝은 배경이면 기존 테마색」으로
하면 다크 테마의 bodyText가 이미 밝은 색이라 밝은 사진 위에 밝은
글자가 나온다. 양쪽 극이 다 필요하다.

밝은 테마 넷은 autoTextOnLight를 bodyText와 같게 둬서, 밝은 사진을
깔아도 지금과 같은 모습이 나오게 한다."
```

---

### Task 4: 문서에 영역별 설정 담기

**Files:**
- Modify: `src/model/types.ts`
- Modify: `src/model/defaults.ts`
- Modify: `src/model/storage.ts`
- Test: `src/model/storage.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `type TextColorArea = 'title' | 'goal' | 'todo' | 'memo' | 'calendar'`
  - `TEXT_COLOR_AREAS: readonly TextColorArea[]`
  - `type TextColorSetting = { mode: 'auto' | 'manual'; color: string | null }`
  - `ScheduleDoc.textColors?: Record<TextColorArea, TextColorSetting>`
  - `createEmptyTextColors(): Record<TextColorArea, TextColorSetting>`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/model/storage.test.ts`에 추가한다.

```ts
describe('글자색 마이그레이션', () => {
  it('textColors가 없는 예전 문서는 전 영역 auto로 채워진다', () => {
    const old = { ...createEmptyDoc(2026, 8) } as Record<string, unknown>
    delete old.textColors

    const migrated = migrateDoc(old)

    expect(migrated).not.toBeNull()
    for (const area of TEXT_COLOR_AREAS) {
      expect(migrated!.textColors![area]).toEqual({ mode: 'auto', color: null })
    }
  })

  it('저장된 수동 색을 그대로 읽는다', () => {
    const doc = createEmptyDoc(2026, 8)
    doc.textColors!.calendar = { mode: 'manual', color: '#ff0000' }

    const migrated = migrateDoc(JSON.parse(JSON.stringify(doc)))

    expect(migrated!.textColors!.calendar).toEqual({ mode: 'manual', color: '#ff0000' })
  })

  it('모르는 모드가 들어 있으면 auto로 떨어진다', () => {
    const doc = createEmptyDoc(2026, 8) as unknown as Record<string, unknown>
    ;(doc.textColors as Record<string, unknown>).memo = { mode: 'nonsense', color: 123 }

    const migrated = migrateDoc(JSON.parse(JSON.stringify(doc)))

    expect(migrated!.textColors!.memo).toEqual({ mode: 'auto', color: null })
  })
})
```

`import`에 `TEXT_COLOR_AREAS`를 더한다.

- [ ] **Step 2: 실패를 확인한다**

Run: `npm test -- src/model/storage.test.ts`
Expected: FAIL — `TEXT_COLOR_AREAS`가 없음

- [ ] **Step 3: 타입을 더한다**

`src/model/types.ts`에 넣는다.

```ts
/** 글자색을 따로 정할 수 있는 영역. */
export type TextColorArea = 'title' | 'goal' | 'todo' | 'memo' | 'calendar'

export const TEXT_COLOR_AREAS: readonly TextColorArea[] = [
  'title', 'goal', 'todo', 'memo', 'calendar',
]

export type TextColorSetting = {
  /**
   * 'auto'면 배경 이미지 밝기로 정한다. **배경 이미지가 없으면 계산하지
   * 않고 테마 기본색을 쓴다** — 계산하면 저장된 모든 문서의 모습이 바뀐다.
   */
  mode: 'auto' | 'manual'
  /** mode가 'manual'일 때만 의미가 있다. */
  color: string | null
}
```

`ScheduleDoc`에 필드를 더한다.

```ts
  /**
   * 영역별 글자색. extra·icon과 같이 **선택 필드**다.
   * migrateDoc이 없는 문서에 기본값을 채우므로, 필수로 선언하면 타입이
   * 런타임 값과 어긋난다.
   */
  textColors?: Record<TextColorArea, TextColorSetting>
```

- [ ] **Step 4: 기본값을 더한다**

`src/model/defaults.ts`에 넣고 `createEmptyDoc`의 반환 객체에 `textColors: createEmptyTextColors(),`를 더한다.

```ts
/** 전 영역 자동. 배경 이미지가 없으면 자동은 테마 기본색을 뜻한다. */
export function createEmptyTextColors(): Record<TextColorArea, TextColorSetting> {
  return Object.fromEntries(
    TEXT_COLOR_AREAS.map((area) => [area, { mode: 'auto' as const, color: null }]),
  ) as Record<TextColorArea, TextColorSetting>
}
```

- [ ] **Step 5: migrateDoc이 골라 담게 한다**

`src/model/storage.ts`에 도우미를 더하고 `migrateDoc`의 반환 객체에 `textColors: mergeTextColors(raw.textColors),`를 넣는다.

```ts
/**
 * 알려진 영역과 모드만 골라 담는다. 통째로 병합하면 없앤 영역의 흔적이
 * 계속 딸려 들어온다.
 */
function mergeTextColors(raw: unknown): Record<TextColorArea, TextColorSetting> {
  const base = createEmptyTextColors()
  if (!isObject(raw)) return base

  for (const area of TEXT_COLOR_AREAS) {
    const value = raw[area]
    if (!isObject(value)) continue
    if (value.mode !== 'manual') continue
    if (typeof value.color !== 'string') continue
    base[area] = { mode: 'manual', color: value.color }
  }
  return base
}
```

`import`에 `createEmptyTextColors`, `TEXT_COLOR_AREAS`, 타입 `TextColorArea`·`TextColorSetting`을 더한다.

- [ ] **Step 6: 통과를 확인한다**

Run: `npm test -- src/model/storage.test.ts && npx tsc -b`
Expected: PASS, 타입 오류 없음

- [ ] **Step 7: 커밋**

```bash
git add src/model/types.ts src/model/defaults.ts src/model/storage.ts src/model/storage.test.ts
git commit -m "feat: 문서에 영역별 글자색 설정을 담는다

extra·icon과 같이 선택 필드로 뒀다. migrateDoc이 없는 문서에 기본값을
채우므로 필수로 선언하면 타입이 런타임 값과 어긋난다.

migrateDoc은 알려진 영역과 모드만 골라 담는다. 통째로 병합하면 없앤
영역의 흔적이 계속 딸려 들어온다."
```

---

### Task 5: 색 해석 규칙

수동 설정 · 자동 계산 결과 · 테마 기본색을 합쳐 최종 색 5개를 만드는 순수 함수.

**Files:**
- Create: `src/model/textColors.ts`
- Test: `src/model/textColors.test.ts`

**Interfaces:**
- Consumes: Task 3의 `Theme.autoTextOnLight/OnDark`, Task 4의 타입들
- Produces:
  - `type AreaTones = Record<TextColorArea, 'dark' | 'light'> | null`
  - `type ResolvedTextColors = Record<TextColorArea, string>`
  - `themeTextColor(area: TextColorArea, theme: Theme): string`
  - `resolveTextColors(settings, theme, tones): ResolvedTextColors`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/model/textColors.test.ts`를 만든다.

```ts
import { describe, expect, it } from 'vitest'
import { getTheme } from '../theme/themes'
import { createEmptyTextColors } from './defaults'
import { resolveTextColors, themeTextColor } from './textColors'
import { TEXT_COLOR_AREAS } from './types'

const pink = getTheme('pink')
const dark = getTheme('dark')

describe('themeTextColor', () => {
  it('제목은 headerText, 나머지는 bodyText다', () => {
    expect(themeTextColor('title', pink)).toBe(pink.headerText)
    expect(themeTextColor('goal', pink)).toBe(pink.bodyText)
    expect(themeTextColor('calendar', pink)).toBe(pink.bodyText)
  })
})

describe('resolveTextColors', () => {
  it('배경 밝기를 모르면 전 영역이 테마 기본색이다', () => {
    const resolved = resolveTextColors(createEmptyTextColors(), pink, null)

    expect(resolved.title).toBe(pink.headerText)
    for (const area of TEXT_COLOR_AREAS) {
      expect(resolved[area], area).toBe(themeTextColor(area, pink))
    }
  })

  it('어두운 배경에서는 밝은 글자를 고른다', () => {
    const tones = Object.fromEntries(
      TEXT_COLOR_AREAS.map((area) => [area, 'light' as const]),
    ) as Record<(typeof TEXT_COLOR_AREAS)[number], 'dark' | 'light'>

    const resolved = resolveTextColors(createEmptyTextColors(), pink, tones)

    expect(resolved.calendar).toBe(pink.autoTextOnDark)
  })

  it('다크 테마에 밝은 배경이면 어두운 글자를 고른다', () => {
    const tones = Object.fromEntries(
      TEXT_COLOR_AREAS.map((area) => [area, 'dark' as const]),
    ) as Record<(typeof TEXT_COLOR_AREAS)[number], 'dark' | 'light'>

    const resolved = resolveTextColors(createEmptyTextColors(), dark, tones)

    expect(resolved.calendar).toBe(dark.autoTextOnLight)
    // 다크 테마의 bodyText는 밝으므로 그대로 쓰면 안 된다.
    expect(resolved.calendar).not.toBe(dark.bodyText)
  })

  it('밝은 배경에서 원래 색이 어두우면 그대로 쓴다', () => {
    // 밝은 사진을 깔아도 지금과 같은 모습이 나와야 한다.
    const tones = Object.fromEntries(
      TEXT_COLOR_AREAS.map((area) => [area, 'dark' as const]),
    ) as Record<(typeof TEXT_COLOR_AREAS)[number], 'dark' | 'light'>

    const resolved = resolveTextColors(createEmptyTextColors(), pink, tones)

    expect(resolved.calendar).toBe(pink.bodyText)
    expect(resolved.title).toBe(pink.headerText)
  })

  it('제목과 본문 색이 다른 테마에서 각자 제 색을 지킨다', () => {
    // 화이트 테마는 제목 #18181b, 본문 #27272a로 갈린다. 극값 하나로
    // 밀어붙이면 제목 색이 조용히 바뀐다.
    const white = getTheme('white')
    const tones = Object.fromEntries(
      TEXT_COLOR_AREAS.map((area) => [area, 'dark' as const]),
    ) as Record<(typeof TEXT_COLOR_AREAS)[number], 'dark' | 'light'>

    const resolved = resolveTextColors(createEmptyTextColors(), white, tones)

    expect(resolved.title).toBe(white.headerText)
    expect(resolved.calendar).toBe(white.bodyText)
    expect(resolved.title).not.toBe(resolved.calendar)
  })

  it('어두운 배경에서 다크 테마는 원래 색을 그대로 쓴다', () => {
    const tones = Object.fromEntries(
      TEXT_COLOR_AREAS.map((area) => [area, 'light' as const]),
    ) as Record<(typeof TEXT_COLOR_AREAS)[number], 'dark' | 'light'>

    const resolved = resolveTextColors(createEmptyTextColors(), dark, tones)

    expect(resolved.calendar).toBe(dark.bodyText)
    expect(resolved.title).toBe(dark.headerText)
  })

  it('직접 고른 색이 자동을 이긴다', () => {
    const settings = createEmptyTextColors()
    settings.memo = { mode: 'manual', color: '#123456' }
    const tones = Object.fromEntries(
      TEXT_COLOR_AREAS.map((area) => [area, 'light' as const]),
    ) as Record<(typeof TEXT_COLOR_AREAS)[number], 'dark' | 'light'>

    const resolved = resolveTextColors(settings, pink, tones)

    expect(resolved.memo).toBe('#123456')
    expect(resolved.goal).toBe(pink.autoTextOnDark)
  })

  it('수동인데 색이 비어 있으면 테마 기본색으로 떨어진다', () => {
    const settings = createEmptyTextColors()
    settings.memo = { mode: 'manual', color: null }

    const resolved = resolveTextColors(settings, pink, null)

    expect(resolved.memo).toBe(pink.bodyText)
  })

  it('설정이 아예 없어도 동작한다', () => {
    const resolved = resolveTextColors(undefined, pink, null)
    expect(resolved.calendar).toBe(pink.bodyText)
  })
})
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npm test -- src/model/textColors.test.ts`
Expected: FAIL — `./textColors` 모듈을 찾을 수 없음

- [ ] **Step 3: 구현한다**

`src/model/textColors.ts`를 만든다.

```ts
import type { Theme } from '../theme/themes'
import { createEmptyTextColors } from './defaults'
import { LUMINANCE_THRESHOLD, hexLuminance } from './luminance'
import { TEXT_COLOR_AREAS, type TextColorArea, type TextColorSetting } from './types'

/** 영역마다 어떤 글자를 얹어야 하는지. null이면 배경을 재지 못했다는 뜻. */
export type AreaTones = Record<TextColorArea, 'dark' | 'light'> | null

export type ResolvedTextColors = Record<TextColorArea, string>

/** 그 영역이 원래 쓰던 테마 색. */
export function themeTextColor(area: TextColorArea, theme: Theme): string {
  return area === 'title' ? theme.headerText : theme.bodyText
}

/**
 * 최종 글자색 5개를 정한다.
 *
 * - 직접 고른 색이 있으면 그것이 이긴다
 * - 자동인데 배경 밝기를 모르면(배경 이미지가 없거나 못 읽었으면) 테마 기본색
 * - 자동이고 배경 밝기를 알면: **원래 색이 그 배경에서 읽히면 그대로 쓰고,
 *   안 읽힐 때만 테마의 극값으로 바꾼다**
 *
 * 두 번째 줄이 중요하다. 배경이 없을 때도 계산하면 저장된 모든 문서의 모습이
 * 바뀐다.
 *
 * 세 번째 줄도 마찬가지다. 극값 하나로 밀어붙이면 headerText와 bodyText가
 * 갈라지는 테마(화이트는 #18181b / #27272a)에서 밝은 사진을 깔았을 때
 * 제목 색이 조용히 바뀐다. 원래 색을 먼저 시험하면 읽히는 한 그대로 남는다.
 */
export function resolveTextColors(
  settings: Record<TextColorArea, TextColorSetting> | undefined,
  theme: Theme,
  tones: AreaTones,
): ResolvedTextColors {
  const source = settings ?? createEmptyTextColors()

  return Object.fromEntries(
    TEXT_COLOR_AREAS.map((area) => {
      const setting = source[area]
      if (setting?.mode === 'manual' && setting.color !== null) {
        return [area, setting.color]
      }

      const own = themeTextColor(area, theme)
      if (tones === null) return [area, own]

      const ownLuma = hexLuminance(own)
      if (tones[area] === 'dark') {
        // 밝은 배경 — 어두운 글자가 필요하다.
        return [area, ownLuma < LUMINANCE_THRESHOLD ? own : theme.autoTextOnLight]
      }
      // 어두운 배경 — 밝은 글자가 필요하다.
      return [area, ownLuma >= LUMINANCE_THRESHOLD ? own : theme.autoTextOnDark]
    }),
  ) as ResolvedTextColors
}
```

- [ ] **Step 4: 통과를 확인한다**

Run: `npm test -- src/model/textColors.test.ts`
Expected: PASS (7개)

- [ ] **Step 5: 커밋**

```bash
git add src/model/textColors.ts src/model/textColors.test.ts
git commit -m "feat: 영역별 최종 글자색을 정하는 규칙

직접 고른 색 > 배경 밝기로 고른 색 > 테마 기본색 순서다.

배경 이미지가 없으면 계산하지 않고 테마 기본색을 쓴다. 계산하면
핑크 테마의 #5b3a42가 밝기 계산 결과로 대체되면서 저장된 모든 문서의
모습이 바뀐다."
```

---

### Task 6: 배경 이미지 영역 밝기 재기

Canvas를 읽는 얇은 층. 순수 계산은 Task 1이 다 했다.

**Files:**
- Create: `src/model/imageLuminance.ts`
- Test: `src/model/imageLuminance.test.ts`

**Interfaces:**
- Consumes: Task 1의 `sampleLuminance`, `layout.ts`의 `CANVAS_WIDTH`·`CANVAS_HEIGHT`
- Produces: `measureRegions(dataUrl: string, regions: Record<string, BoxRect>): Promise<Record<string, number> | null>`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/model/imageLuminance.test.ts`를 만든다. jsdom은 이미지 디코딩과 canvas 2D를 못 하므로 **실패 폴백만** 검증한다. 실제 측정은 수동 검증 항목이다.

```ts
import { describe, expect, it, vi } from 'vitest'
import { measureRegions } from './imageLuminance'

const region = { title: { x: 0, y: 0, width: 100, height: 100 } }

describe('measureRegions', () => {
  it('이미지를 못 읽으면 null을 준다', async () => {
    // jsdom은 이미지 디코딩을 하지 않아 onload가 오지 않는다.
    // 손상된 파일을 올린 것과 같은 경로다.
    const result = await measureRegions('data:image/png;base64,보나마나틀린값', region)
    expect(result).toBeNull()
  })

  it('빈 문자열이면 곧바로 null이다', async () => {
    expect(await measureRegions('', region)).toBeNull()
  })

  it('getImageData가 던져도 null로 떨어진다', async () => {
    const spy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    const result = await measureRegions('data:image/png;base64,AAAA', region)
    expect(result).toBeNull()
    spy.mockRestore()
  })
})
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npm test -- src/model/imageLuminance.test.ts`
Expected: FAIL — `./imageLuminance` 모듈을 찾을 수 없음

- [ ] **Step 3: 구현한다**

`src/model/imageLuminance.ts`를 만든다.

```ts
import { CANVAS_HEIGHT, CANVAS_WIDTH, type BoxRect } from '../preview/layout'
import { sampleLuminance } from './luminance'

/** 이미지 로딩이 이만큼 걸리면 포기한다. 폴백이 있으므로 기다릴 이유가 없다. */
const LOAD_TIMEOUT_MS = 5000

function loadImage(dataUrl: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image()
    const timer = setTimeout(() => resolve(null), LOAD_TIMEOUT_MS)
    image.onload = () => {
      clearTimeout(timer)
      resolve(image)
    }
    image.onerror = () => {
      clearTimeout(timer)
      resolve(null)
    }
    image.src = dataUrl
  })
}

/**
 * 배경 이미지의 영역별 평균 밝기. 못 읽으면 null이다.
 *
 * 영역은 **캔버스 좌표**(4000×2250)로 준다. 배경은 backgroundSize로 캔버스를
 * 꽉 채우므로 이미지 크기에 비례 변환하면 된다.
 *
 * **CORS 걱정은 없다.** 배경은 IndexedDB에 담긴 사용자 업로드 파일이고
 * useAssetUrl이 data URL로 바꿔 준다. 외부 URL도 프리셋도 없어 캔버스가
 * 오염될 경로가 없다. 실패는 손상된 파일이나 디코딩 실패다.
 */
export async function measureRegions(
  dataUrl: string,
  regions: Record<string, BoxRect>,
): Promise<Record<string, number> | null> {
  if (dataUrl === '') return null

  const image = await loadImage(dataUrl)
  if (image === null) return null

  const width = image.naturalWidth || image.width
  const height = image.naturalHeight || image.height
  if (width <= 0 || height <= 0) return null

  try {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (context === null) return null
    context.drawImage(image, 0, 0)

    const scaleX = width / CANVAS_WIDTH
    const scaleY = height / CANVAS_HEIGHT
    const result: Record<string, number> = {}

    for (const [key, rect] of Object.entries(regions)) {
      const x = Math.max(0, Math.floor(rect.x * scaleX))
      const y = Math.max(0, Math.floor(rect.y * scaleY))
      const w = Math.max(1, Math.min(width - x, Math.floor(rect.width * scaleX)))
      const h = Math.max(1, Math.min(height - y, Math.floor(rect.height * scaleY)))
      const data = context.getImageData(x, y, w, h)
      result[key] = sampleLuminance(data.data, w, h)
    }
    return result
  } catch {
    // 디코딩 실패나 손상된 파일. 부르는 쪽이 테마 기본색으로 떨어진다.
    return null
  }
}
```

- [ ] **Step 4: 통과를 확인한다**

Run: `npm test -- src/model/imageLuminance.test.ts`
Expected: PASS (3개)

- [ ] **Step 5: 커밋**

```bash
git add src/model/imageLuminance.ts src/model/imageLuminance.test.ts
git commit -m "feat: 배경 이미지의 영역별 밝기를 잰다

영역은 캔버스 좌표로 받아 이미지 크기에 비례 변환한다. 배경이
backgroundSize로 캔버스를 꽉 채우므로 선형 변환이면 된다.

CORS 걱정은 없다. 배경은 IndexedDB의 업로드 파일이고 useAssetUrl이
data URL로 바꿔 준다. 실패는 손상된 파일이나 디코딩 실패이고
그때는 null을 줘서 테마 기본색으로 떨어진다."
```

---

### Task 7: 자동 글자색 훅

**Files:**
- Create: `src/state/useAutoTextColors.ts`
- Test: `src/state/useAutoTextColors.test.ts`

**Interfaces:**
- Consumes: Task 1·2·6, 앞 계획의 `CELL_AREA_*`
- Produces: `useAutoTextColors(args): AreaTones`

인자:
```ts
{
  backgroundUrl: string | null
  theme: Theme
  boxesEnabled: [boolean, boolean, boolean]
  gridOpacity: number
  sidebarOpacity: number
}
```

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/state/useAutoTextColors.test.ts`를 만든다.

```ts
import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import * as imageLuminance from '../model/imageLuminance'
import { getTheme } from '../theme/themes'
import { useAutoTextColors } from './useAutoTextColors'

const base = {
  theme: getTheme('pink'),
  boxesEnabled: [true, true, true] as [boolean, boolean, boolean],
  gridOpacity: 1,
  sidebarOpacity: 1,
}

describe('useAutoTextColors', () => {
  it('배경이 없으면 null이다', () => {
    const { result } = renderHook(() => useAutoTextColors({ ...base, backgroundUrl: null }))
    expect(result.current).toBeNull()
  })

  it('밝기를 못 재면 null이다', async () => {
    vi.spyOn(imageLuminance, 'measureRegions').mockResolvedValue(null)

    const { result } = renderHook(() =>
      useAutoTextColors({ ...base, backgroundUrl: 'data:image/png;base64,AAAA' }),
    )

    await waitFor(() => expect(result.current).toBeNull())
  })

  it('불투명도가 1이면 어두운 사진이라도 테마 배경색 기준으로 판정한다', async () => {
    // 이 테스트가 이 기능의 핵심을 지킨다. 불투명도를 무시하면 배경 이미지가
    // 아예 안 보이는데도 어두운 사진이라는 이유로 밝은 글자를 고른다.
    vi.spyOn(imageLuminance, 'measureRegions').mockResolvedValue({
      title: 0, goal: 0, todo: 0, memo: 0, calendar: 0,
    })

    const { result } = renderHook(() =>
      useAutoTextColors({
        ...base,
        backgroundUrl: 'data:image/png;base64,AAAA',
        gridOpacity: 1,
        sidebarOpacity: 1,
      }),
    )

    // 핑크 테마의 cellBackground(#fdf4f6)는 밝다 → 어두운 글자.
    await waitFor(() => expect(result.current?.calendar).toBe('dark'))
    expect(result.current?.goal).toBe('dark')
  })

  it('불투명도가 0이면 이미지 밝기를 그대로 쓴다', async () => {
    vi.spyOn(imageLuminance, 'measureRegions').mockResolvedValue({
      title: 0, goal: 0, todo: 0, memo: 0, calendar: 0,
    })

    const { result } = renderHook(() =>
      useAutoTextColors({
        ...base,
        backgroundUrl: 'data:image/png;base64,AAAA',
        gridOpacity: 0,
        sidebarOpacity: 0,
      }),
    )

    await waitFor(() => expect(result.current?.calendar).toBe('light'))
  })

  it('제목은 배경 상자가 없어 불투명도를 안 탄다', async () => {
    vi.spyOn(imageLuminance, 'measureRegions').mockResolvedValue({
      title: 0, goal: 0, todo: 0, memo: 0, calendar: 0,
    })

    const { result } = renderHook(() =>
      useAutoTextColors({
        ...base,
        backgroundUrl: 'data:image/png;base64,AAAA',
        gridOpacity: 1,
        sidebarOpacity: 1,
      }),
    )

    // 사이드바·달력은 dark로 뒤집혀도 제목은 이미지 밝기(0) 그대로다.
    await waitFor(() => expect(result.current?.title).toBe('light'))
  })
})
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npm test -- src/state/useAutoTextColors.test.ts`
Expected: FAIL — `./useAutoTextColors` 모듈을 찾을 수 없음

- [ ] **Step 3: 구현한다**

`src/state/useAutoTextColors.ts`를 만든다.

```ts
import { useEffect, useMemo, useState } from 'react'
import { measureRegions } from '../model/imageLuminance'
import { blendLuminance, pickTextTone } from '../model/luminance'
import type { AreaTones } from '../model/textColors'
import { TEXT_COLOR_AREAS, type TextColorArea } from '../model/types'
import {
  CELL_AREA_HEIGHT, CELL_AREA_WIDTH, CELL_AREA_X, CELL_AREA_Y,
  OUTER_PADDING, SIDEBAR_WIDTH, TITLE_ROW_HEIGHT, sidebarBoxRects, type BoxRect,
} from '../preview/layout'
import type { Theme } from '../theme/themes'

export type UseAutoTextColorsArgs = {
  backgroundUrl: string | null
  theme: Theme
  boxesEnabled: [boolean, boolean, boolean]
  gridOpacity: number
  sidebarOpacity: number
}

/** 영역마다 배경 이미지의 어느 사각형을 재야 하는지. */
function regionsFor(boxesEnabled: [boolean, boolean, boolean]): Record<string, BoxRect> {
  const [goal, todo, memo] = sidebarBoxRects(boxesEnabled)
  const title: BoxRect = {
    x: OUTER_PADDING, y: OUTER_PADDING, width: SIDEBAR_WIDTH, height: TITLE_ROW_HEIGHT,
  }
  const calendar: BoxRect = {
    x: CELL_AREA_X, y: CELL_AREA_Y, width: CELL_AREA_WIDTH, height: CELL_AREA_HEIGHT,
  }
  // 꺼진 상자는 잴 자리가 없으므로 제목 자리로 대신한다. 그 영역은 어차피
  // 그려지지 않아 어떤 값이 나와도 화면에 영향이 없다.
  return { title, goal: goal ?? title, todo: todo ?? title, memo: memo ?? title, calendar }
}

/**
 * 배경 이미지 밝기로 영역별 글자 톤을 정한다. 배경이 없거나 못 읽으면 null.
 *
 * 이미지 샘플링은 배경이 바뀔 때만 돈다. 불투명도나 테마만 바뀌면 재지 않고
 * 합성만 다시 한다 — 4000×2250을 다시 읽으면 슬라이더를 끌 때마다 멈춘다.
 */
export function useAutoTextColors({
  backgroundUrl, theme, boxesEnabled, gridOpacity, sidebarOpacity,
}: UseAutoTextColorsArgs): AreaTones {
  const [raw, setRaw] = useState<Record<string, number> | null>(null)

  // 상자 on/off가 바뀌면 재는 자리가 달라지므로 다시 읽어야 한다.
  const enabledKey = boxesEnabled.join(',')

  useEffect(() => {
    if (backgroundUrl === null) {
      setRaw(null)
      return
    }
    let alive = true
    const enabled = enabledKey.split(',').map((v) => v === 'true') as [boolean, boolean, boolean]
    void measureRegions(backgroundUrl, regionsFor(enabled)).then((result) => {
      if (alive) setRaw(result)
    })
    return () => {
      alive = false
    }
  }, [backgroundUrl, enabledKey])

  return useMemo(() => {
    if (raw === null) return null

    const overlayFor = (area: TextColorArea): { hex: string; opacity: number } => {
      // 제목에는 배경 상자가 없다. 배경 이미지가 그대로 비치므로 덮는 것이 없다.
      if (area === 'title') return { hex: theme.cellBackground, opacity: 0 }
      if (area === 'calendar') return { hex: theme.cellBackground, opacity: gridOpacity }
      return { hex: theme.cellBackground, opacity: sidebarOpacity }
    }

    return Object.fromEntries(
      TEXT_COLOR_AREAS.map((area) => {
        const overlay = overlayFor(area)
        const effective = blendLuminance(raw[area] ?? 128, overlay.hex, overlay.opacity)
        return [area, pickTextTone(effective)]
      }),
    ) as NonNullable<AreaTones>
  }, [raw, theme, gridOpacity, sidebarOpacity])
}
```

- [ ] **Step 4: 통과를 확인한다**

Run: `npm test -- src/state/useAutoTextColors.test.ts`
Expected: PASS (5개)

- [ ] **Step 5: 커밋**

```bash
git add src/state/useAutoTextColors.ts src/state/useAutoTextColors.test.ts
git commit -m "feat: 배경 밝기로 영역별 글자 톤을 정하는 훅

불투명도를 반영한 실효 밝기로 판정한다. 불투명도가 1이면 배경 이미지가
아예 안 보이므로 어두운 사진이라도 테마 배경색 기준으로 판정해야 한다.
제목은 배경 상자가 없어 이미지가 그대로 비치므로 불투명도를 안 탄다.

이미지 샘플링은 배경이 바뀔 때만 돈다. 슬라이더를 끌 때마다
4000×2250을 다시 읽으면 멈춘다."
```

---

### Task 8: 미리보기에 색 적용

**Files:**
- Modify: `src/preview/ScheduleCanvas.tsx`
- Modify: `src/preview/TitleBar.tsx`
- Modify: `src/preview/Sidebar.tsx`
- Modify: `src/preview/SidebarBox.tsx`
- Modify: `src/preview/CalendarGrid.tsx`
- Modify: `src/preview/DayCell.tsx`
- Modify: `src/App.tsx`
- Test: `src/preview/DayCell.test.ts`

**Interfaces:**
- Consumes: Task 5의 `ResolvedTextColors`
- Produces: `ScheduleCanvas` props에 `textColors: ResolvedTextColors` 추가. `dateNumberColor(cell, entry, theme, calendarTextColor)` 시그니처 변경

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/preview/DayCell.test.ts`에 추가한다.

```ts
describe('dateNumberColor와 영역 글자색', () => {
  const theme = getTheme('pink')
  const weekday = { date: '2026-08-05', day: 5, dow: 3, inMonth: true }
  const sunday = { date: '2026-08-02', day: 2, dow: 0, inMonth: true }
  const saturday = { date: '2026-08-01', day: 1, dow: 6, inMonth: true }
  const outside = { date: '2026-07-31', day: 31, dow: 5, inMonth: false }

  it('평일 숫자는 영역 글자색을 따라간다', () => {
    expect(dateNumberColor(weekday, undefined, theme, '#ffffff')).toBe('#ffffff')
  })

  it('일요일 빨강은 덮지 않는다', () => {
    expect(dateNumberColor(sunday, undefined, theme, '#ffffff')).toBe(theme.sundayText)
  })

  it('토요일 파랑은 덮지 않는다', () => {
    expect(dateNumberColor(saturday, undefined, theme, '#ffffff')).toBe(theme.saturdayText)
  })

  it('날짜별로 고른 색은 덮지 않는다', () => {
    const entry = { text: '', dateColor: '#00ff00', cellFill: null, marker: null }
    expect(dateNumberColor(weekday, entry, theme, '#ffffff')).toBe('#00ff00')
  })

  it('앞뒤 달 흐린 색은 덮지 않는다', () => {
    expect(dateNumberColor(outside, undefined, theme, '#ffffff')).toBe(theme.outsideMonthText)
  })
})
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npm test -- src/preview/DayCell.test.ts`
Expected: FAIL — `dateNumberColor`가 인자 4개를 받지 않음

- [ ] **Step 3: DayCell을 고친다**

`src/preview/DayCell.tsx`의 `dateNumberColor`를 바꾼다.

```ts
/**
 * 날짜 숫자 색.
 *
 * 마지막 폴백만 영역 글자색으로 바뀐다. 앞의 네 줄은 그대로다 —
 * 일요일 빨강·토요일 파랑·날짜별 지정색을 덮으면 안 된다.
 *
 * 폴백을 안 바꾸면 어두운 사진 위에서 일정 글자는 밝아지는데 평일 숫자만
 * 어두운 채로 남아 안 보인다.
 */
export function dateNumberColor(
  cell: GridCell,
  entry: DayEntry | undefined,
  theme: Theme,
  calendarTextColor: string,
): string {
  if (!cell.inMonth) return theme.outsideMonthText
  if (entry?.dateColor) return entry.dateColor
  if (cell.dow === 0) return theme.sundayText
  if (cell.dow === 6) return theme.saturdayText
  return calendarTextColor
}
```

`DayCellProps`에 `textColor: string`을 더하고, 컴포넌트 안에서:
- `dateNumberColor(cell, entry, theme, textColor)`로 부른다
- 일정 텍스트의 `color={cell.inMonth ? theme.bodyText : theme.outsideMonthText}` 세 곳을 `color={cell.inMonth ? textColor : theme.outsideMonthText}`로 바꾼다
- 추가 문구의 `color={theme.bodyText}`를 `color={textColor}`로 바꾼다

- [ ] **Step 4: 위쪽 컴포넌트에 색을 흘린다**

`CalendarGrid.tsx`: props에 `textColor: string`을 더하고 `<DayCell ... textColor={textColor} />`로 넘긴다.

`SidebarBox.tsx`: props에 `textColor: string`을 더하고, 53줄의 상자 라벨 `color: theme.bodyText`를 `color: textColor`로 바꾼다. **65줄의 배지 글자는 그대로 둔다** — 자기 배경색 위에 있어 배경 이미지 밝기와 상관이 적다.

`Sidebar.tsx`: props에 `textColors: { goal: string; todo: string; memo: string }`을 더한다. 상자 3개에 각각 `textColor`를 넘기고, 본문 글자 `color: theme.bodyText` 네 곳(목표 줄, 체크박스의 `V`, 할 일 텍스트, 메모)을 해당 영역 색으로 바꾼다. **`Hint`의 `theme.outsideMonthText`는 그대로 둔다.**

`TitleBar.tsx`: props에 `textColor: string`을 더하고 51줄의 `color: theme.headerText`를 `color: textColor`로 바꾼다.

`ScheduleCanvas.tsx`: props에 `textColors: ResolvedTextColors`를 더하고 아래로 흘린다. 루트 div의 `color: theme.bodyText`는 그대로 둔다(상속 기본값).

**전환 효과**를 루트 div에 더한다.

```tsx
        // 불투명도 슬라이더를 임계치 근처에서 끌 때 글자색이 톡톡 튀는 것을
        // 눌러 준다. 내보내기 직전에는 exportImage가 이 전환을 끈다.
        transition: 'color 150ms linear',
```

- [ ] **Step 5: App에서 색을 계산해 넘긴다**

`src/App.tsx`에 더한다.

```tsx
import { resolveTextColors } from './model/textColors'
import { useAutoTextColors } from './state/useAutoTextColors'
import { getTheme } from './theme/themes'
```

```tsx
  const theme = getTheme(api.doc.themeId)
  const boxesEnabled: [boolean, boolean, boolean] = [
    api.doc.header.goals.enabled,
    api.doc.header.todo.enabled,
    api.doc.header.memo.enabled,
  ]
  const tones = useAutoTextColors({
    backgroundUrl,
    theme,
    boxesEnabled,
    gridOpacity: api.doc.gridOpacity,
    sidebarOpacity: api.doc.sidebarOpacity,
  })
  const textColors = resolveTextColors(api.doc.textColors, theme, tones)
```

`<ScheduleCanvas ... textColors={textColors} />`로 넘긴다.

- [ ] **Step 6: 전체 테스트와 타입 검사**

Run: `npm test && npx tsc -b`
Expected: 전부 PASS

- [ ] **Step 7: 커밋**

```bash
git add -A
git commit -m "feat: 영역별 글자색을 미리보기에 적용한다

App이 계산한 색 5개를 ScheduleCanvas가 받아 아래로 흘린다.
preview/는 계산을 모른다 — fontFamily·backgroundUrl과 같은 방식이다.

dateNumberColor는 마지막 폴백만 바꾼다. 일요일 빨강·토요일 파랑·
날짜별 지정색은 그대로다. 폴백을 안 바꾸면 어두운 사진 위에서
일정 글자만 밝아지고 평일 숫자는 안 보인다.

배지와 상자 힌트는 그대로 둔다. 배지는 자기 배경색 위에 있고
힌트는 비어 있을 때만 보이는 안내다."
```

---

### Task 9: 내보내기 직전 전환 끄기

**Files:**
- Modify: `src/export/exportImage.ts`
- Test: `src/export/exportImage.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces: 없음 (동작 변경)

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/export/exportImage.test.ts`에 추가한다.

```ts
describe('색 전환 끄기', () => {
  it('캡처하는 동안 transition이 꺼져 있고 끝나면 되돌아온다', async () => {
    const node = document.createElement('div')
    node.style.transition = 'color 150ms linear'

    let duringCapture = ''
    const spy = vi.spyOn(htmlToImage, 'toPng').mockImplementation(async () => {
      duringCapture = node.style.transition
      return 'data:image/png;base64,AAAA'
    })

    await exportSchedule(node, createEmptyDoc(2026, 8), 'original')

    expect(duringCapture).toBe('none')
    expect(node.style.transition).toBe('color 150ms linear')
    spy.mockRestore()
  })

  it('캡처가 실패해도 transition을 되돌린다', async () => {
    const node = document.createElement('div')
    node.style.transition = 'color 150ms linear'

    const spy = vi.spyOn(htmlToImage, 'toPng').mockRejectedValue(new Error('실패'))

    await expect(exportSchedule(node, createEmptyDoc(2026, 8), 'original')).rejects.toThrow()
    expect(node.style.transition).toBe('color 150ms linear')
    spy.mockRestore()
  })
})
```

기존 파일이 `html-to-image`를 어떻게 부르는지 보고 `import * as htmlToImage from 'html-to-image'` 형태로 spy를 걸 수 있게 맞춘다. 이미 다른 방식으로 모킹하고 있으면 그 방식을 따른다.

- [ ] **Step 2: 실패를 확인한다**

Run: `npm test -- src/export/exportImage.test.ts`
Expected: FAIL — 캡처 중 `transition`이 `'none'`이 아님

- [ ] **Step 3: 구현한다**

`src/export/exportImage.ts`에서 캡처를 감싼다.

```ts
/**
 * 캡처하는 동안 CSS 전환을 끈다.
 *
 * html-to-image는 캡처 시점의 getComputedStyle을 읽는다. 글자색 전환이
 * 진행 중이면 **중간 색이 PNG에 박힌다.** transition을 없애면 진행 중이던
 * 전환이 취소되고 목표 색이 곧바로 계산값이 되므로 그 경로가 사라진다.
 */
async function withoutTransition<T>(node: HTMLElement, run: () => Promise<T>): Promise<T> {
  const saved = node.style.transition
  node.style.transition = 'none'
  try {
    return await run()
  } finally {
    node.style.transition = saved
  }
}
```

`toPng(...)`를 부르는 자리를 `withoutTransition(node, () => toPng(...))`로 바꾼다.

- [ ] **Step 4: 통과를 확인한다**

Run: `npm test -- src/export/exportImage.test.ts`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/export/exportImage.ts src/export/exportImage.test.ts
git commit -m "fix: 내보내기 직전에 색 전환을 끈다

html-to-image는 캡처 시점의 computed style을 읽는다. 글자색 전환이
진행 중이면 중간 색이 PNG에 박힌다. 실제로 그 순간에 누를 확률은
낮지만 preview/가 화면에 보이는 것이 결과물 그 자체라는 규칙 위에
서 있으므로 확률에 기대지 않는다.

실패해도 finally로 되돌린다."
```

---

### Task 10: 글자색 편집 UI

**Files:**
- Create: `src/editor/TextColorPicker.tsx`
- Test: `src/editor/TextColorPicker.test.tsx`
- Modify: `src/editor/EditorPanel.tsx`

**Interfaces:**
- Consumes: Task 4의 타입, Task 5의 `themeTextColor`
- Produces: `TextColorPicker` props `{ api: ScheduleDocApi }`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/editor/TextColorPicker.test.tsx`를 만든다.

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { createEmptyDoc } from '../model/defaults'
import type { ScheduleDoc } from '../model/types'
import type { ScheduleDocApi } from '../state/useScheduleDoc'
import { TextColorPicker } from './TextColorPicker'

function makeApi(doc: ScheduleDoc, setDoc: ScheduleDocApi['setDoc'] = () => {}): ScheduleDocApi {
  return { doc, setDoc, goToMonth: () => {}, copyFromPreviousMonth: () => 'no-source', saveError: null }
}

describe('TextColorPicker', () => {
  it('영역 다섯 개를 보여준다', () => {
    render(createElement(TextColorPicker, { api: makeApi(createEmptyDoc(2026, 8)) }))

    for (const label of ['제목', '목표 상자', '할 일 상자', '메모 상자', '달력']) {
      expect(screen.getByText(label)).toBeTruthy()
    }
  })

  it('처음에는 전 영역이 자동이다', () => {
    render(createElement(TextColorPicker, { api: makeApi(createEmptyDoc(2026, 8)) }))

    expect(screen.getAllByRole('button', { name: /자동으로 되돌리기$/ })
      .every((b) => (b as HTMLButtonElement).disabled)).toBe(true)
  })

  it('색을 고르면 그 영역만 수동이 된다', () => {
    const doc = createEmptyDoc(2026, 8)
    const setDoc = vi.fn()
    render(createElement(TextColorPicker, { api: makeApi(doc, setDoc) }))

    fireEvent.change(screen.getByLabelText('달력 글자색'), { target: { value: '#123456' } })

    const updater = setDoc.mock.calls[0][0] as (prev: ScheduleDoc) => ScheduleDoc
    const next = updater(doc)
    expect(next.textColors!.calendar).toEqual({ mode: 'manual', color: '#123456' })
    expect(next.textColors!.memo.mode).toBe('auto')
  })

  it('자동으로 되돌리면 색이 지워진다', () => {
    const doc = createEmptyDoc(2026, 8)
    doc.textColors!.memo = { mode: 'manual', color: '#123456' }
    const setDoc = vi.fn()
    render(createElement(TextColorPicker, { api: makeApi(doc, setDoc) }))

    fireEvent.click(screen.getByRole('button', { name: '메모 상자 자동으로 되돌리기' }))

    const updater = setDoc.mock.calls[0][0] as (prev: ScheduleDoc) => ScheduleDoc
    expect(updater(doc).textColors!.memo).toEqual({ mode: 'auto', color: null })
  })
})
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npm test -- src/editor/TextColorPicker.test.tsx`
Expected: FAIL — `./TextColorPicker` 모듈을 찾을 수 없음

- [ ] **Step 3: 구현한다**

`src/editor/TextColorPicker.tsx`를 만든다.

```tsx
import { createEmptyTextColors } from '../model/defaults'
import { themeTextColor } from '../model/textColors'
import { TEXT_COLOR_AREAS, type TextColorArea } from '../model/types'
import type { ScheduleDocApi } from '../state/useScheduleDoc'
import { getTheme } from '../theme/themes'
import { buttonStyle, sectionStyle, sectionTitleStyle } from './controls'

const AREA_LABELS: Record<TextColorArea, string> = {
  title: '제목',
  goal: '목표 상자',
  todo: '할 일 상자',
  memo: '메모 상자',
  calendar: '달력',
}

/**
 * 5영역을 한 자리에 모아 놓는다.
 *
 * 목표·할 일·메모가 「사이드바」 탭과 관련이 깊지만 여기 둔다 — 5영역을
 * 서로 비교하면서 정하는 일이라 흩어 놓으면 탭을 오가야 한다.
 */
export function TextColorPicker({ api }: { api: ScheduleDocApi }) {
  const { doc, setDoc } = api
  const theme = getTheme(doc.themeId)
  const settings = doc.textColors ?? createEmptyTextColors()

  const setArea = (area: TextColorArea, color: string | null) => {
    setDoc((prev) => {
      const base = prev.textColors ?? createEmptyTextColors()
      return {
        ...prev,
        textColors: {
          ...base,
          [area]: color === null
            ? { mode: 'auto' as const, color: null }
            : { mode: 'manual' as const, color },
        },
      }
    })
  }

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>글자색</h2>
      <p style={{ fontSize: 12, color: '#71717a', margin: '0 0 10px' }}>
        자동은 배경 이미지 밝기에 맞춰 고릅니다. 배경 이미지가 없으면 테마 색을 씁니다.
      </p>

      {TEXT_COLOR_AREAS.map((area) => {
        const setting = settings[area]
        const isAuto = setting.mode !== 'manual' || setting.color === null
        const shown = isAuto ? themeTextColor(area, theme) : setting.color!

        return (
          <div
            key={area}
            style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}
          >
            <span style={{ fontSize: 13, width: 72, flexShrink: 0 }}>{AREA_LABELS[area]}</span>
            <input
              type="color"
              aria-label={`${AREA_LABELS[area]} 글자색`}
              value={shown}
              onChange={(e) => setArea(area, e.target.value)}
              style={{
                width: 34, height: 28, padding: 0, border: '1px solid #d4d4d8',
                borderRadius: 5, background: '#ffffff', cursor: 'pointer',
                transition: 'background-color 150ms linear',
              }}
            />
            <span style={{ fontSize: 12, color: isAuto ? '#16a34a' : '#71717a' }}>
              {isAuto ? '자동' : '직접'}
            </span>
            <button
              type="button"
              aria-label={`${AREA_LABELS[area]} 자동으로 되돌리기`}
              disabled={isAuto}
              onClick={() => setArea(area, null)}
              style={{ ...buttonStyle, fontSize: 12, marginLeft: 'auto', opacity: isAuto ? 0.4 : 1 }}
            >
              자동으로
            </button>
          </div>
        )
      })}
    </section>
  )
}
```

- [ ] **Step 4: 「꾸미기」 탭에 넣는다**

`src/editor/EditorPanel.tsx`의 `decorate` 탭에서 `<ThemePicker />` 다음에 `<TextColorPicker api={api} />`를 넣고 import를 더한다.

- [ ] **Step 5: 통과를 확인한다**

Run: `npm test -- src/editor/TextColorPicker.test.tsx && npm test && npx tsc -b`
Expected: 전부 PASS

- [ ] **Step 6: 화면에서 확인한다**

Run: `npm run dev`

1. 「꾸미기」 탭에 「글자색」이 있고 영역 다섯 개가 보이는가
2. **어두운 배경 사진**을 올리면 글자가 밝아지는가
3. **밝은 배경 사진**을 올리면 글자가 지금과 같은 색인가
4. **불투명도를 1로 올리면 글자색이 테마 기준으로 돌아오는가** — 이 기능의 핵심이다
5. 한 영역을 직접 색으로 바꾼 뒤 배경을 갈아도 그 영역만 유지되는가
6. 배경 이미지가 없는 지난 달을 열면 모습이 그대로인가

- [ ] **Step 7: 커밋**

```bash
git add -A
git commit -m "feat: 글자색 고르는 칸을 꾸미기 탭에 넣는다

5영역을 한 자리에 모았다. 목표·할 일·메모가 사이드바 탭과 관련이
깊지만, 서로 비교하면서 정하는 일이라 흩어 놓으면 탭을 오가야 한다."
```

---

### Task 11: 문서 갱신

**Files:**
- Modify: `docs/manual-checklist.md`
- Modify: `docs/현재-상태.md`
- Modify: `README.md`

- [ ] **Step 1: 수동 검증 항목을 더한다**

`docs/manual-checklist.md`에 추가한다.

```markdown
## 영역별 글자색

- [ ] 어두운 사진과 밝은 사진을 각각 올려 5영역이 알맞게 바뀌는지
- [ ] **불투명도를 1로 올리면 글자색이 테마 기준으로 돌아오는지** — 이 기능의
      핵심이다. 배경 이미지가 안 보이는데 이미지 밝기로 정하면 틀린다
- [ ] 왼쪽이 어둡고 오른쪽이 밝은 사진에서 사이드바와 달력이 따로 판정되는지
- [ ] 배경 이미지가 없는 저장된 지난 달을 열어 **모습이 그대로인지**
- [ ] 손상된 파일을 올렸을 때 테마 기본색으로 떨어지는지
- [ ] 한 영역을 직접 색으로 바꾼 뒤 배경을 갈아도 그 영역만 유지되는지
- [ ] **배경을 바꾸자마자 곧바로 내보내기를 눌러 중간 색이 안 박히는지**
- [ ] 불투명도 슬라이더를 임계치 근처에서 천천히 끌어 색이 부드럽게 넘어가는지
- [ ] 다크 테마에 밝은 사진을 깔면 글자가 어두워지는지
```

- [ ] **Step 2: 현재 상태 문서를 고친다**

`docs/현재-상태.md`의 **1.4 꾸미기** 표에 행을 더한다.

```markdown
| 글자색 | 5영역(제목·목표·할 일·메모·달력) 각각 자동/직접. 자동은 배경 이미지 밝기로 고른다 |
```

그 아래 설명을 더한다.

```markdown
**배경 이미지가 없으면 자동은 계산하지 않고 테마 기본색을 쓴다.** 계산하면
저장된 모든 문서의 모습이 바뀐다.

밝기는 **불투명도를 반영한 실효 밝기**로 판정한다 — 글자는 배경 이미지 위에
바로 얹히지 않고 사이에 알파가 들어간 테마 배경색이 있다. 불투명도가 1이면
배경 이미지는 아예 안 보인다.

영역마다 배경 이미지의 **그 자리만** 잰다. 왼쪽이 어둡고 오른쪽이 밝은
사진에서도 사이드바와 달력이 따로 판정된다.
```

**2.2 데이터 모델**의 `ScheduleDoc`에 `textColors` 줄을 더한다.

**3.1 의도적으로 남겨둔 것** 표에 더한다.

```markdown
| 밑줄·체크박스 테두리는 안 바뀐다 | `theme.cellBorder`다. 선까지 따라가게 하면 「글자색」이 아니라 「테마 자동 반전」이 되어 범위가 훨씬 커진다 |
| 배지·요일 헤더·상자 힌트 제외 | 앞의 둘은 자기 배경색 위에 있고, 힌트는 비어 있을 때만 보이는 안내다 |
| 칸 배경 채우기가 반영 안 됨 | 영역 평균이라 `cellFill`을 칠한 칸 하나하나는 계산에 안 들어간다 |
```

**5장 함정** 표에 더한다.

```markdown
| 캔버스의 CSS 전환 | 전환 중에 캡처하면 중간 색이 PNG에 박힌다. `exportImage.ts`가 캡처 전후로 `transition`을 껐다 켠다 |
```

- [ ] **Step 3: README를 고친다**

「만든 것」 목록에 더한다.

```markdown
- 영역별 글자색 5종 — 배경 이미지 밝기에 맞춰 자동 전환, 직접 지정도 가능
```

- [ ] **Step 4: 커밋**

```bash
git add docs/ README.md
git commit -m "docs: 영역별 글자색을 문서에 반영

불투명도를 1로 올렸을 때 테마 기준으로 돌아오는지가 수동 검증의
핵심 항목이다. 이걸 빼먹으면 기능이 조용히 틀린다.

캔버스 CSS 전환을 함정 목록에 더했다."
```

---

## 완료 기준

- [ ] `npm test` 전부 통과
- [ ] `npx tsc -b` 오류 없음
- [ ] `npm run build` 성공
- [ ] `docs/manual-checklist.md`의 새 항목을 사람이 직접 확인 — 특히 **불투명도 1일 때**와 **배경 없는 지난 달**
- [ ] 배경 이미지가 없는 예전 문서를 열었을 때 모습이 한 픽셀도 안 바뀜
