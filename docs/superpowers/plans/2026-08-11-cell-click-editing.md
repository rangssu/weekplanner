# 달력 칸 클릭 편집 + 패널 탭 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 편집 패널의 31일 목록을 없애고, 미리보기 달력 칸을 클릭해 그 날짜를 편집하게 만든다. 남은 설정 13개는 탭 3개로 접는다.

**Architecture:** 미리보기 위에 투명한 오버레이(`DayClickLayer`)를 깔아 클릭을 받는다. `preview/`는 표시만 하고 조작은 `editor/`가 맡는다는 기존 경계를 지키기 위해서다 — `StickerDragLayer`와 같은 방식이다. 고른 날짜의 폼(`SelectedDayEditor`)은 한 벌이고, 넓은 화면에서는 팝오버로, 좁은 화면에서는 바텀시트로 감싼다.

**Tech Stack:** React 18 · TypeScript · Vite 7 · vitest · @testing-library/react · jsdom

## Global Constraints

- **`src/preview/` 안에서는 `px`만 쓴다.** `%`·`rem`·`vw`·미디어쿼리 금지. `editor/`에는 이 제약이 없다.
- **`src/preview/` 컴포넌트는 `ScheduleDoc`만 받는다.** 저장 함수나 setter를 넘기지 않는다.
- **레이아웃 수치를 하드코딩하지 않는다.** 전부 `src/preview/layout.ts`에서 파생한다.
- 테스트 실행: `npm test` — 현재 **272개 전부 통과**가 기준선이다. 타입 검사: `npx tsc -b`
- 테스트 파일은 `.tsx`라도 JSX 대신 `createElement`를 쓴다 (기존 `DayEditor.test.tsx` 관례).
- 주석과 UI 문구는 한국어로 쓴다.
- 커밋 메시지는 한국어, 본문에 "왜"를 적는다.

---

### Task 1: 격자 영역 좌표 상수

날짜 칸 42개가 캔버스 어디에 놓이는지를 `layout.ts`에 파생 상수로 박는다. 오버레이와 팝오버가 이 값을 쓴다.

**Files:**
- Modify: `src/preview/layout.ts`
- Test: `src/preview/layout.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces: `CELL_AREA_X`, `CELL_AREA_Y`, `CELL_AREA_WIDTH`, `CELL_AREA_HEIGHT` (전부 `number`, 캔버스 좌표 px)

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/preview/layout.test.ts`의 `import` 목록에 `CELL_AREA_HEIGHT, CELL_AREA_WIDTH, CELL_AREA_X, CELL_AREA_Y`를 더하고, 파일 맨 아래에 다음 `describe`를 추가한다.

```ts
describe('날짜 칸 영역', () => {
  it('칸 영역의 가로가 칸 7개와 정확히 같다', () => {
    expect(CELL_AREA_WIDTH).toBeCloseTo(CELL_WIDTH * 7, 10)
  })

  it('칸 영역의 세로가 칸 6개와 정확히 같다', () => {
    expect(CELL_AREA_HEIGHT).toBeCloseTo(CELL_HEIGHT * 6, 10)
  })

  it('칸 영역의 오른쪽 끝이 격자 테두리만큼 안쪽에 있다', () => {
    expect(CELL_AREA_X + CELL_AREA_WIDTH + BORDER_WIDTH).toBeCloseTo(
      CANVAS_WIDTH - OUTER_PADDING,
      10,
    )
  })

  it('칸 영역의 아래쪽 끝이 격자 테두리만큼 안쪽에 있다', () => {
    expect(CELL_AREA_Y + CELL_AREA_HEIGHT + BORDER_WIDTH).toBeCloseTo(
      CANVAS_HEIGHT - OUTER_PADDING,
      10,
    )
  })

  it('칸 영역이 요일 행 아래에서 시작한다', () => {
    expect(CELL_AREA_Y).toBe(OUTER_PADDING + BORDER_WIDTH + DOW_ROW_HEIGHT)
  })
})
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npm test -- src/preview/layout.test.ts`
Expected: FAIL — `CELL_AREA_X` 등이 export되지 않아 타입/참조 오류

- [ ] **Step 3: 상수를 더한다**

`src/preview/layout.ts`에서 `CELL_TEXT_WIDTH` 정의보다 **위**, `CELL_PADDING` 선언 부근에 넣는다.

```ts
/**
 * 날짜 칸 42개가 차지하는 사각형. 캔버스 좌표 기준이다.
 *
 * 미리보기 위에 겹치는 오버레이(editor/DayClickLayer)가 격자와 정확히
 * 포개지려면 이 네 값만 있으면 된다. 안쪽 7×6 분할은 오버레이도 CSS 그리드로
 * 하므로 브라우저가 CalendarGrid와 똑같이 나눈다. 칸마다 좌표를 따로 계산하면
 * CalendarGrid와 따로 노는 두 번째 계산이 생겨 조용히 어긋난다.
 */
export const CELL_AREA_X = OUTER_PADDING + SIDEBAR_WIDTH + COLUMN_GAP + BORDER_WIDTH
export const CELL_AREA_Y = OUTER_PADDING + BORDER_WIDTH + DOW_ROW_HEIGHT
export const CELL_AREA_WIDTH = GRID_INNER_WIDTH
export const CELL_AREA_HEIGHT = GRID_INNER_HEIGHT - DOW_ROW_HEIGHT
```

- [ ] **Step 4: 통과를 확인한다**

Run: `npm test -- src/preview/layout.test.ts`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/preview/layout.ts src/preview/layout.test.ts
git commit -m "feat: 날짜 칸 영역 좌표를 layout.ts에서 파생한다

미리보기 위 오버레이가 격자와 포개지려면 격자 영역의 위치와 크기가
필요하다. 칸마다 좌표를 계산하면 CalendarGrid의 CSS 그리드와 따로
노는 두 번째 계산이 되므로, 영역 네 값만 두고 안쪽 분할은 브라우저에
맡긴다."
```

---

### Task 2: 화면 좌표와 팝오버 방향

팝오버를 어디에 띄울지 정하는 순수 함수들. 클릭 수신은 CSS 그리드가 하지만 팝오버 위치는 실제 좌표가 필요하다.

**Files:**
- Create: `src/editor/cellGeometry.ts`
- Test: `src/editor/cellGeometry.test.ts`

**Interfaces:**
- Consumes: Task 1의 `CELL_AREA_X / Y / WIDTH / HEIGHT`
- Produces:
  - `type ScreenRect = { x: number; y: number; width: number; height: number }`
  - `type PopoverPlacement = { horizontal: 'left' | 'right'; vertical: 'above' | 'below' }`
  - `cellScreenRect(index: number, scale: number): ScreenRect`
  - `popoverPlacement(index: number): PopoverPlacement`
  - `clampToRange(value: number, size: number, limit: number, margin?: number): number`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/editor/cellGeometry.test.ts`를 만든다.

```ts
import { describe, expect, it } from 'vitest'
import { GRID_CELL_COUNT, GRID_COLUMNS } from '../model/calendar'
import {
  CELL_AREA_HEIGHT, CELL_AREA_WIDTH, CELL_AREA_X, CELL_AREA_Y,
} from '../preview/layout'
import { cellScreenRect, clampToRange, popoverPlacement } from './cellGeometry'

describe('cellScreenRect', () => {
  it('배율 1에서 첫 칸이 칸 영역의 왼쪽 위 모서리에서 시작한다', () => {
    const rect = cellScreenRect(0, 1)
    expect(rect.x).toBeCloseTo(CELL_AREA_X, 10)
    expect(rect.y).toBeCloseTo(CELL_AREA_Y, 10)
  })

  it('마지막 칸의 오른쪽 아래가 칸 영역의 오른쪽 아래와 같다', () => {
    const rect = cellScreenRect(GRID_CELL_COUNT - 1, 1)
    expect(rect.x + rect.width).toBeCloseTo(CELL_AREA_X + CELL_AREA_WIDTH, 10)
    expect(rect.y + rect.height).toBeCloseTo(CELL_AREA_Y + CELL_AREA_HEIGHT, 10)
  })

  it('칸 42개가 겹치거나 벌어지지 않고 영역을 덮는다', () => {
    for (let i = 0; i < GRID_CELL_COUNT; i++) {
      const rect = cellScreenRect(i, 1)
      const col = i % GRID_COLUMNS
      if (col === GRID_COLUMNS - 1) continue
      const right = cellScreenRect(i + 1, 1)
      // 오른쪽 이웃의 왼쪽 모서리가 이 칸의 오른쪽 모서리와 같아야 한다.
      expect(right.x).toBeCloseTo(rect.x + rect.width, 10)
    }
  })

  it('배율을 곱하면 좌표와 크기가 같은 비율로 줄어든다', () => {
    const full = cellScreenRect(15, 1)
    const half = cellScreenRect(15, 0.5)
    expect(half.x).toBeCloseTo(full.x * 0.5, 10)
    expect(half.width).toBeCloseTo(full.width * 0.5, 10)
  })
})

describe('popoverPlacement', () => {
  it('왼쪽 다섯 열은 오른쪽으로 펼친다', () => {
    expect(popoverPlacement(0).horizontal).toBe('right')
    expect(popoverPlacement(4).horizontal).toBe('right')
  })

  it('오른쪽 두 열은 왼쪽으로 뒤집는다', () => {
    expect(popoverPlacement(5).horizontal).toBe('left')
    expect(popoverPlacement(6).horizontal).toBe('left')
  })

  it('위 세 행은 아래로 펼친다', () => {
    expect(popoverPlacement(0).vertical).toBe('below')
    expect(popoverPlacement(20).vertical).toBe('below')
  })

  it('아래 세 행은 위로 뒤집는다', () => {
    expect(popoverPlacement(21).vertical).toBe('above')
    expect(popoverPlacement(41).vertical).toBe('above')
  })

  it('오른쪽 아래 모서리는 양쪽 다 뒤집는다', () => {
    expect(popoverPlacement(41)).toEqual({ horizontal: 'left', vertical: 'above' })
  })
})

describe('clampToRange', () => {
  it('범위 안이면 그대로 둔다', () => {
    expect(clampToRange(100, 320, 1000)).toBe(100)
  })

  it('오른쪽으로 넘치면 안으로 민다', () => {
    expect(clampToRange(900, 320, 1000, 8)).toBe(1000 - 320 - 8)
  })

  it('왼쪽으로 넘치면 안으로 민다', () => {
    expect(clampToRange(-50, 320, 1000, 8)).toBe(8)
  })

  it('범위가 내용보다 좁으면 여백 위치에 붙인다', () => {
    expect(clampToRange(0, 320, 100, 8)).toBe(8)
  })
})
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npm test -- src/editor/cellGeometry.test.ts`
Expected: FAIL — `./cellGeometry` 모듈을 찾을 수 없음

- [ ] **Step 3: 구현한다**

`src/editor/cellGeometry.ts`를 만든다.

```ts
import { GRID_COLUMNS, GRID_ROWS } from '../model/calendar'
import {
  CELL_AREA_HEIGHT, CELL_AREA_WIDTH, CELL_AREA_X, CELL_AREA_Y,
} from '../preview/layout'

export type ScreenRect = { x: number; y: number; width: number; height: number }

export type PopoverPlacement = {
  /** 'right'면 칸 오른쪽에 붙여 오른쪽으로 펼친다. */
  horizontal: 'left' | 'right'
  /** 'below'면 칸 아래에 붙여 아래로 펼친다. */
  vertical: 'above' | 'below'
}

/**
 * 팝오버를 오른쪽으로 펼칠 여유가 없어지는 열. 팝오버 폭이 320px인데
 * 칸 하나는 미리보기가 1200px일 때 약 171px이라, 오른쪽에 두 칸 넘게
 * 남아야 들어간다.
 */
const FLIP_COLUMN = GRID_COLUMNS - 2
/** 팝오버 높이가 약 420px이라 아래쪽 세 행에서는 화면 밖으로 나간다. */
const FLIP_ROW = GRID_ROWS - 3

/**
 * 격자 index(0~41)의 칸이 화면에서 차지하는 사각형.
 *
 * 클릭을 받는 오버레이는 CSS 그리드라 좌표를 안 만든다. 이 함수는 팝오버를
 * 어디에 띄울지에만 쓴다 — 팝오버를 축소된 레이어 안에 넣고 역스케일하면
 * 좌표 계산은 사라지지만, CSS transform이 걸린 컨테이너 안에서 한글 IME
 * 후보창 위치가 틀어질 수 있어 그 방법을 쓰지 않는다.
 *
 * 그 대가로 CalendarGrid의 CSS 그리드와 따로 노는 두 번째 계산이 된다.
 * cellGeometry.test.ts가 칸 42개가 영역을 빈틈없이 덮는지 검사해 묶어 둔다.
 */
export function cellScreenRect(index: number, scale: number): ScreenRect {
  const col = index % GRID_COLUMNS
  const row = Math.floor(index / GRID_COLUMNS)
  const width = CELL_AREA_WIDTH / GRID_COLUMNS
  const height = CELL_AREA_HEIGHT / GRID_ROWS
  return {
    x: (CELL_AREA_X + col * width) * scale,
    y: (CELL_AREA_Y + row * height) * scale,
    width: width * scale,
    height: height * scale,
  }
}

/** 가장자리 칸에서 팝오버가 화면 밖으로 나가지 않게 펼치는 방향을 뒤집는다. */
export function popoverPlacement(index: number): PopoverPlacement {
  const col = index % GRID_COLUMNS
  const row = Math.floor(index / GRID_COLUMNS)
  return {
    horizontal: col >= FLIP_COLUMN ? 'left' : 'right',
    vertical: row >= FLIP_ROW ? 'above' : 'below',
  }
}

/**
 * 방향을 뒤집어도 넘칠 때 안으로 민다. 창을 좁혔을 때 필요하다.
 * 범위가 내용보다 좁으면 여백 위치에 붙인다 — 이때는 어차피 넘치므로
 * 왼쪽 가장자리를 기준으로 잡는 편이 읽기 쉽다.
 */
export function clampToRange(value: number, size: number, limit: number, margin = 8): number {
  const max = limit - size - margin
  if (max < margin) return margin
  return Math.min(Math.max(value, margin), max)
}
```

- [ ] **Step 4: 통과를 확인한다**

Run: `npm test -- src/editor/cellGeometry.test.ts`
Expected: PASS (15개)

- [ ] **Step 5: 커밋**

```bash
git add src/editor/cellGeometry.ts src/editor/cellGeometry.test.ts
git commit -m "feat: 팝오버 위치를 정하는 순수 함수

칸의 화면 좌표, 가장자리에서 펼치는 방향 뒤집기, 화면 안으로 밀어넣기.
팝오버를 축소 레이어 안에 넣고 역스케일하면 좌표 계산이 없어지지만
CSS transform 안에서 한글 IME 후보창이 틀어질 수 있어 밖에 둔다.
그 대가인 두 번째 계산은 칸 42개가 영역을 빈틈없이 덮는지 보는
테스트로 묶어 둔다."
```

---

### Task 3: 그 달 안에서만 날짜 옮기기

`‹ ›` 버튼이 쓸 순수 함수. 달을 넘기지 않는다.

**Files:**
- Modify: `src/model/calendar.ts`
- Test: `src/model/calendar.test.ts`

**Interfaces:**
- Consumes: 기존 `dateKey`
- Produces: `shiftDateWithinMonth(date: string, delta: number): string | null`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/model/calendar.test.ts` 맨 아래에 추가한다. 파일 위쪽 `import`에 `shiftDateWithinMonth`를 더한다.

```ts
describe('shiftDateWithinMonth', () => {
  it('하루 뒤로 옮긴다', () => {
    expect(shiftDateWithinMonth('2026-08-08', 1)).toBe('2026-08-09')
  })

  it('하루 앞으로 옮긴다', () => {
    expect(shiftDateWithinMonth('2026-08-08', -1)).toBe('2026-08-07')
  })

  it('1일에서 앞으로 가면 null이다', () => {
    expect(shiftDateWithinMonth('2026-08-01', -1)).toBeNull()
  })

  it('말일에서 뒤로 가면 null이다', () => {
    expect(shiftDateWithinMonth('2026-08-31', 1)).toBeNull()
  })

  it('30일까지인 달의 말일을 안다', () => {
    expect(shiftDateWithinMonth('2026-09-30', 1)).toBeNull()
    expect(shiftDateWithinMonth('2026-09-29', 1)).toBe('2026-09-30')
  })

  it('윤년 2월 29일을 안다', () => {
    expect(shiftDateWithinMonth('2028-02-28', 1)).toBe('2028-02-29')
    expect(shiftDateWithinMonth('2028-02-29', 1)).toBeNull()
  })

  it('형식이 틀리면 null이다', () => {
    expect(shiftDateWithinMonth('2026-8-8', 1)).toBeNull()
  })
})
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npm test -- src/model/calendar.test.ts`
Expected: FAIL — `shiftDateWithinMonth`가 export되지 않음

- [ ] **Step 3: 구현한다**

`src/model/calendar.ts`의 `previousMonth` 아래에 넣는다.

```ts
/**
 * 날짜를 **그 달 안에서만** 옮긴다. 달을 넘어가면 null을 준다.
 *
 * 달 전환은 MonthPicker의 일이고 문서를 통째로 갈아끼우는 무거운 동작이라,
 * 편집기의 화살표 한 번으로 일어나면 놀랍다.
 */
export function shiftDateWithinMonth(date: string, delta: number): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!m) return null
  const year = Number(m[1])
  const month = Number(m[2])
  const day = Number(m[3]) + delta
  // month를 그대로 넘기면 "다음 달 0일" = 이번 달 말일이 된다.
  const lastDay = new Date(year, month, 0).getDate()
  if (day < 1 || day > lastDay) return null
  return dateKey(year, month, day)
}
```

- [ ] **Step 4: 통과를 확인한다**

Run: `npm test -- src/model/calendar.test.ts`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/model/calendar.ts src/model/calendar.test.ts
git commit -m "feat: 그 달 안에서만 날짜를 옮기는 함수

편집기의 ‹ › 버튼이 쓴다. 달 전환은 MonthPicker의 일이고 문서를
통째로 갈아끼우는 무거운 동작이라 화살표 한 번으로 일어나면 안 된다."
```

---

### Task 4: 고른 날짜 편집 폼

`DayEditor.tsx`의 하루치 블록을 독립 컴포넌트로 들어낸다. 31개를 그리느라 있던 것들(`memo`, `useCallback` 3개, `openIconPicker`, 아이콘 접이식)은 전부 버린다.

**Files:**
- Create: `src/editor/SelectedDayEditor.tsx`
- Test: `src/editor/SelectedDayEditor.test.tsx`

**Interfaces:**
- Consumes: Task 3의 `shiftDateWithinMonth`, 기존 `updateDay`·`isLikelyOverflowing`·`inputStyle`·`fieldLabelStyle` (`./controls`), `DAY_ICONS`·`getDayIcon` (`../theme/dayIcons`), `getTheme` (`../theme/themes`)
- Produces: `SelectedDayEditor` 컴포넌트, props `{ api: ScheduleDocApi; date: string; onSelect: (date: string) => void; onClose: () => void }`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/editor/SelectedDayEditor.test.tsx`를 만든다.

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { createEmptyDoc } from '../model/defaults'
import type { ScheduleDoc } from '../model/types'
import type { ScheduleDocApi } from '../state/useScheduleDoc'
import { SelectedDayEditor } from './SelectedDayEditor'

function makeApi(doc: ScheduleDoc, setDoc: ScheduleDocApi['setDoc'] = () => {}): ScheduleDocApi {
  return {
    doc,
    setDoc,
    goToMonth: () => {},
    copyFromPreviousMonth: () => 'no-source',
    saveError: null,
  }
}

const noop = () => {}

describe('SelectedDayEditor', () => {
  it('고른 날짜의 요일을 제목에 보여준다', () => {
    const doc = createEmptyDoc(2026, 8)
    render(createElement(SelectedDayEditor, {
      api: makeApi(doc), date: '2026-08-08', onSelect: noop, onClose: noop,
    }))

    // 2026-08-08은 토요일이다.
    expect(screen.getByText('8일 (토)')).toBeTruthy()
  })

  it('저장된 일정을 입력칸에 채운다', () => {
    const doc = createEmptyDoc(2026, 8)
    doc.days['2026-08-08'] = {
      text: '합방 21시', dateColor: null, cellFill: null, marker: null,
    }
    render(createElement(SelectedDayEditor, {
      api: makeApi(doc), date: '2026-08-08', onSelect: noop, onClose: noop,
    }))

    expect(screen.getByDisplayValue('합방 21시')).toBeTruthy()
  })

  it('일정을 입력하면 그 날짜만 바뀐 문서를 만든다', () => {
    const doc = createEmptyDoc(2026, 8)
    const setDoc = vi.fn()
    render(createElement(SelectedDayEditor, {
      api: makeApi(doc, setDoc), date: '2026-08-08', onSelect: noop, onClose: noop,
    }))

    fireEvent.change(screen.getByLabelText('일정'), { target: { value: '게임 방송' } })

    expect(setDoc).toHaveBeenCalledTimes(1)
    const updater = setDoc.mock.calls[0][0] as (prev: ScheduleDoc) => ScheduleDoc
    expect(updater(doc).days['2026-08-08'].text).toBe('게임 방송')
  })

  it('아이콘 아홉 개가 접히지 않고 처음부터 보인다', () => {
    const doc = createEmptyDoc(2026, 8)
    render(createElement(SelectedDayEditor, {
      api: makeApi(doc), date: '2026-08-08', onSelect: noop, onClose: noop,
    }))

    expect(screen.getAllByRole('button', { name: /^(별|게임|영화|합방|메모|그림|저챗|휴방|휴)$/ }))
      .toHaveLength(9)
  })

  it('다음 날 버튼을 누르면 다음 날짜를 고른다', () => {
    const doc = createEmptyDoc(2026, 8)
    const onSelect = vi.fn()
    render(createElement(SelectedDayEditor, {
      api: makeApi(doc), date: '2026-08-08', onSelect, onClose: noop,
    }))

    fireEvent.click(screen.getByRole('button', { name: '다음 날' }))

    expect(onSelect).toHaveBeenCalledWith('2026-08-09')
  })

  it('1일에서는 이전 날 버튼이 꺼져 있다', () => {
    const doc = createEmptyDoc(2026, 8)
    render(createElement(SelectedDayEditor, {
      api: makeApi(doc), date: '2026-08-01', onSelect: noop, onClose: noop,
    }))

    expect(screen.getByRole('button', { name: '이전 날' })).toHaveProperty('disabled', true)
  })

  it('말일에서는 다음 날 버튼이 꺼져 있다', () => {
    const doc = createEmptyDoc(2026, 8)
    render(createElement(SelectedDayEditor, {
      api: makeApi(doc), date: '2026-08-31', onSelect: noop, onClose: noop,
    }))

    expect(screen.getByRole('button', { name: '다음 날' })).toHaveProperty('disabled', true)
  })

  it('닫기 버튼을 누르면 onClose를 부른다', () => {
    const doc = createEmptyDoc(2026, 8)
    const onClose = vi.fn()
    render(createElement(SelectedDayEditor, {
      api: makeApi(doc), date: '2026-08-08', onSelect: noop, onClose,
    }))

    fireEvent.click(screen.getByRole('button', { name: '닫기' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('글자가 너무 많으면 경고를 띄운다', () => {
    const doc = createEmptyDoc(2026, 8)
    doc.days['2026-08-08'] = {
      text: '가'.repeat(200), dateColor: null, cellFill: null, marker: null,
    }
    render(createElement(SelectedDayEditor, {
      api: makeApi(doc), date: '2026-08-08', onSelect: noop, onClose: noop,
    }))

    expect(screen.getByText('글자가 너무 많아 칸에서 잘릴 수 있습니다.')).toBeTruthy()
  })

  it('그 달에 없는 날짜를 주면 아무것도 안 그린다', () => {
    const doc = createEmptyDoc(2026, 8)
    const { container } = render(createElement(SelectedDayEditor, {
      api: makeApi(doc), date: '2026-09-01', onSelect: noop, onClose: noop,
    }))

    expect(container.firstChild).toBeNull()
  })
})
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npm test -- src/editor/SelectedDayEditor.test.tsx`
Expected: FAIL — `./SelectedDayEditor` 모듈을 찾을 수 없음

- [ ] **Step 3: 구현한다**

`src/editor/SelectedDayEditor.tsx`를 만든다. `SwatchRow`는 `DayEditor.tsx`에서 그대로 옮겨 온다.

```tsx
import { useCallback } from 'react'
import { shiftDateWithinMonth } from '../model/calendar'
import type { DayEntry } from '../model/types'
import type { ScheduleDocApi } from '../state/useScheduleDoc'
import { DAY_ICONS } from '../theme/dayIcons'
import { getTheme, type Theme } from '../theme/themes'
import { fieldLabelStyle, inputStyle, isLikelyOverflowing, updateDay } from './controls'

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
        title="강조 없음"
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

type IconGridProps = {
  value: string | undefined
  onChange: (iconId: string | undefined) => void
}

/**
 * 아이콘 아홉 개를 3×3 그리드로 고른다. **접지 않는다.**
 *
 * 예전에는 접이식이었다. 하루치 편집 블록이 31번 반복되는 패널에서 여러
 * 날짜의 그리드가 동시에 펼쳐지면 감당 못 할 길이가 됐기 때문이다.
 * 한 날짜만 그리게 된 지금은 그 이유가 없어져, 접는 만큼 클릭만 늘어난다.
 */
function IconGrid({ value, onChange }: IconGridProps) {
  return (
    <div style={{ marginTop: 8 }}>
      <span style={{ ...fieldLabelStyle, marginBottom: 4 }}>아이콘</span>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 46px)', gap: 4 }}>
        {DAY_ICONS.map((icon) => (
          <button
            key={icon.id}
            type="button"
            aria-label={icon.label}
            aria-pressed={value === icon.id}
            title={icon.label}
            onClick={() => onChange(icon.id)}
            style={{
              width: 46, height: 46, borderRadius: 4, cursor: 'pointer', padding: 3,
              border: value === icon.id ? '2px solid #18181b' : '1px solid #d4d4d8',
              background: '#ffffff',
            }}
          >
            <img src={icon.src} alt="" style={{ width: '100%', height: '100%', display: 'block' }} />
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange(undefined)}
        style={{
          marginTop: 4, width: '100%', padding: '5px 8px', borderRadius: 4,
          cursor: 'pointer', border: '1px solid #d4d4d8', background: '#fafafa',
          fontSize: 12, color: '#3f3f46',
        }}
      >
        아이콘 없애기
      </button>
    </div>
  )
}

const navButtonStyle = {
  width: 26, height: 26, borderRadius: 5, cursor: 'pointer',
  border: '1px solid #d4d4d8', background: '#ffffff', fontSize: 13,
  lineHeight: 1, padding: 0, marginLeft: 4,
} as const

export type SelectedDayEditorProps = {
  api: ScheduleDocApi
  /** "2026-08-08" */
  date: string
  onSelect: (date: string) => void
  onClose: () => void
}

/**
 * 고른 날짜 하나를 편집한다. 껍데기(팝오버/바텀시트)는 밖에서 씌운다.
 *
 * 예전 DayEditor는 이 폼을 31번 반복해 그렸고, 그 때문에 React.memo와
 * useCallback 고정, 아이콘 그리드 열림 상태 관리가 필요했다. 한 날짜만
 * 그리게 되면서 전부 없앴다.
 */
export function SelectedDayEditor({ api, date, onSelect, onClose }: SelectedDayEditorProps) {
  const { doc, setDoc } = api

  const patch = useCallback(
    (next: Partial<DayEntry>) => setDoc((prev) => updateDay(prev, date, next)),
    [setDoc, date],
  )

  const parsed = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  // 문서가 담고 있는 달 밖의 날짜는 편집 대상이 아니다.
  if (!parsed || Number(parsed[1]) !== doc.year || Number(parsed[2]) !== doc.month) return null

  const theme: Theme = getTheme(doc.themeId)
  const entry = doc.days[date]
  const day = Number(parsed[3])
  const dow = new Date(doc.year, doc.month - 1, day).getDay()
  const prevDate = shiftDateWithinMonth(date, -1)
  const nextDate = shiftDateWithinMonth(date, 1)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <strong style={{ fontSize: 15 }}>{day}일 ({DOW_KO[dow]})</strong>
        <span style={{ marginLeft: 'auto' }}>
          <button
            type="button" aria-label="이전 날" style={navButtonStyle}
            disabled={prevDate === null}
            onClick={() => prevDate && onSelect(prevDate)}
          >
            ‹
          </button>
          <button
            type="button" aria-label="다음 날" style={navButtonStyle}
            disabled={nextDate === null}
            onClick={() => nextDate && onSelect(nextDate)}
          >
            ›
          </button>
          <button type="button" aria-label="닫기" style={navButtonStyle} onClick={onClose}>
            ✕
          </button>
        </span>
      </div>

      <label style={fieldLabelStyle} htmlFor={`day-${date}`}>일정</label>
      <textarea
        id={`day-${date}`}
        style={{ ...inputStyle, minHeight: 52, resize: 'none' }}
        value={entry?.text ?? ''}
        placeholder="일정을 적어주세요"
        onChange={(e) => patch({ text: e.target.value })}
      />
      {isLikelyOverflowing(entry?.text ?? '', entry?.extra) && (
        <p style={{ fontSize: 12, color: '#c0392b', margin: '4px 0 0' }}>
          글자가 너무 많아 칸에서 잘릴 수 있습니다.
        </p>
      )}

      <label style={{ ...fieldLabelStyle, marginTop: 8 }} htmlFor={`extra-${date}`}>추가 문구</label>
      <input
        id={`extra-${date}`}
        type="text"
        style={inputStyle}
        value={entry?.extra ?? ''}
        placeholder="예) 12h"
        onChange={(e) => patch({ extra: e.target.value })}
      />

      <IconGrid value={entry?.icon} onChange={(iconId) => patch({ icon: iconId })} />

      <SwatchRow
        label="칸 배경" colors={theme.accents} value={entry?.cellFill ?? null}
        onChange={(color) => patch({ cellFill: color })}
      />
      <SwatchRow
        label="형광펜" colors={theme.accents} value={entry?.marker ?? null}
        onChange={(color) => patch({ marker: color })}
      />
      <SwatchRow
        label="날짜 색"
        colors={[theme.sundayText, theme.saturdayText, ...theme.accents.slice(0, 4)]}
        value={entry?.dateColor ?? null}
        onChange={(color) => patch({ dateColor: color })}
      />
    </div>
  )
}
```

**주의**: `getDayIcon`은 접힌 상태에서 고른 아이콘 한 개를 미리 보여주는 데만 쓰였다. 그리드를 항상 펼치면 필요 없으므로 import하지 않는다.

- [ ] **Step 4: 통과를 확인한다**

Run: `npm test -- src/editor/SelectedDayEditor.test.tsx`
Expected: PASS (10개)

- [ ] **Step 5: 타입 검사**

Run: `npx tsc -b`
Expected: 오류 없음

- [ ] **Step 6: 커밋**

```bash
git add src/editor/SelectedDayEditor.tsx src/editor/SelectedDayEditor.test.tsx
git commit -m "feat: 고른 날짜 하나를 편집하는 폼

DayEditor의 하루치 블록을 독립 컴포넌트로 들어냈다. 31개를 그리느라
있던 React.memo, useCallback 고정, 아이콘 그리드 열림 상태는 전부
버렸다. 한 날짜만 그리면 필요 없다.

아이콘 3×3 그리드는 항상 펼친다. 접었던 이유가 31개가 동시에
펼쳐지는 것을 막기 위해서였으므로 이제 클릭만 늘린다."
```

---

### Task 5: 미리보기 위 클릭 오버레이

**Files:**
- Create: `src/editor/DayClickLayer.tsx`
- Test: `src/editor/DayClickLayer.test.tsx`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: Task 1의 `CELL_AREA_*`, 기존 `buildMonthGrid`·`GRID_COLUMNS`·`GRID_ROWS`
- Produces: `DayClickLayer` 컴포넌트, props `{ year: number; month: number; scale: number; selectedDate: string | null; onSelect: (date: string) => void }`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/editor/DayClickLayer.test.tsx`를 만든다.

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { DayClickLayer } from './DayClickLayer'

const base = { year: 2026, month: 8, scale: 0.3, selectedDate: null, onSelect: () => {} }

describe('DayClickLayer', () => {
  it('그 달 날짜만 누를 수 있는 버튼으로 그린다', () => {
    render(createElement(DayClickLayer, base))

    // 2026년 8월은 31일까지다. 앞뒤 달 칸은 버튼이 아니다.
    expect(screen.getAllByRole('button')).toHaveLength(31)
  })

  it('칸을 누르면 그 날짜로 onSelect를 부른다', () => {
    const onSelect = vi.fn()
    render(createElement(DayClickLayer, { ...base, onSelect }))

    fireEvent.click(screen.getByRole('button', { name: '2026-08-08 편집' }))

    expect(onSelect).toHaveBeenCalledWith('2026-08-08')
  })

  it('앞뒤 달 날짜는 버튼으로 그리지 않는다', () => {
    render(createElement(DayClickLayer, base))

    // 2026-08-01은 토요일이라 앞에 7월 26~31일이 놓인다.
    expect(screen.queryByRole('button', { name: '2026-07-31 편집' })).toBeNull()
  })

  it('고른 칸에만 표시가 붙는다', () => {
    render(createElement(DayClickLayer, { ...base, selectedDate: '2026-08-08' }))

    expect(screen.getByRole('button', { name: '2026-08-08 편집' }).className)
      .toContain('is-selected')
    expect(screen.getByRole('button', { name: '2026-08-09 편집' }).className)
      .not.toContain('is-selected')
  })

  it('배율을 아직 재지 못했으면 아무것도 안 그린다', () => {
    const { container } = render(createElement(DayClickLayer, { ...base, scale: 0 }))

    expect(container.firstChild).toBeNull()
  })
})
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npm test -- src/editor/DayClickLayer.test.tsx`
Expected: FAIL — `./DayClickLayer` 모듈을 찾을 수 없음

- [ ] **Step 3: 구현한다**

`src/editor/DayClickLayer.tsx`를 만든다.

```tsx
import type { CSSProperties } from 'react'
import { buildMonthGrid, GRID_COLUMNS, GRID_ROWS } from '../model/calendar'
import {
  CANVAS_HEIGHT, CANVAS_WIDTH,
  CELL_AREA_HEIGHT, CELL_AREA_WIDTH, CELL_AREA_X, CELL_AREA_Y,
} from '../preview/layout'

export type DayClickLayerProps = {
  year: number
  /** 1-12 */
  month: number
  /** 미리보기 축소 배율. 0이면 아직 재기 전이다. */
  scale: number
  selectedDate: string | null
  onSelect: (date: string) => void
}

/**
 * 미리보기 위에 겹쳐 날짜 칸 클릭을 받는다.
 *
 * preview/는 표시만 하고 조작은 editor/가 맡는다는 경계를 지키기 위해 별도
 * 오버레이로 뒀다. StickerDragLayer와 같은 이유다.
 *
 * **좌표를 계산하지 않는다.** 격자 영역에 CalendarGrid와 같은 구조의 CSS
 * 그리드를 놓고 안쪽 7×6 분할은 브라우저에 맡긴다. 칸마다 좌표를 구하면
 * CalendarGrid와 따로 노는 두 번째 계산이 생겨 격자 구조를 손댈 때
 * 조용히 어긋난다.
 *
 * **축소는 루트에 transform 한 번으로 건다.** StickerDragLayer처럼 좌표마다
 * scale을 곱하지 않는다. PreviewStage가 캔버스에 하는 것과 같은 방식이라
 * 정렬이 어긋날 여지가 없다.
 *
 * 이 레이어는 canvasRef 바깥에 있다. html-to-image는 ScheduleCanvas 노드만
 * 직렬화하므로 선택 표시가 내보낸 PNG에 들어갈 수가 없다.
 */
export function DayClickLayer({
  year, month, scale, selectedDate, onSelect,
}: DayClickLayerProps) {
  if (scale <= 0) return null

  const cells = buildMonthGrid(year, month)
  // 테두리도 같이 축소되면 0.3배에서 안 보인다. 화면에서 4px이 되게 되돌린다.
  const hitBorder = Math.max(1, Math.round(4 / scale))

  return (
    <div
      style={{
        position: 'absolute', left: 0, top: 0,
        width: CANVAS_WIDTH, height: CANVAS_HEIGHT,
        transform: `scale(${scale})`, transformOrigin: 'top left',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: CELL_AREA_X, top: CELL_AREA_Y,
          width: CELL_AREA_WIDTH, height: CELL_AREA_HEIGHT,
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_COLUMNS}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
        }}
      >
        {cells.map((cell) =>
          cell.inMonth ? (
            <button
              key={cell.date}
              type="button"
              aria-label={`${cell.date} 편집`}
              className={`wp-day-hit${cell.date === selectedDate ? ' is-selected' : ''}`}
              onClick={() => onSelect(cell.date)}
              style={{ '--wp-hit-border': `${hitBorder}px` } as CSSProperties}
            />
          ) : (
            <div key={cell.date} />
          ),
        )}
      </div>
    </div>
  )
}
```

`src/index.css` 맨 아래에 더한다.

```css
/*
  미리보기 위 날짜 클릭 오버레이.
  테두리 두께는 축소 배율에 따라 달라지므로 인라인 커스텀 속성으로 받는다.
  border 대신 inset box-shadow를 쓰는 이유는 테두리가 칸 크기를 바꾸지
  않아야 격자와 계속 포개지기 때문이다.
*/
.wp-day-hit {
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  pointer-events: auto;
  -webkit-tap-highlight-color: transparent;
}

.wp-day-hit:hover {
  box-shadow: inset 0 0 0 var(--wp-hit-border, 4px) rgba(37, 99, 235, 0.45);
}

.wp-day-hit.is-selected,
.wp-day-hit.is-selected:hover {
  box-shadow: inset 0 0 0 var(--wp-hit-border, 4px) #2563eb;
}
```

- [ ] **Step 4: 통과를 확인한다**

Run: `npm test -- src/editor/DayClickLayer.test.tsx`
Expected: PASS (5개)

- [ ] **Step 5: 커밋**

```bash
git add src/editor/DayClickLayer.tsx src/editor/DayClickLayer.test.tsx src/index.css
git commit -m "feat: 미리보기 위 날짜 클릭 오버레이

격자 영역에 CalendarGrid와 같은 구조의 CSS 그리드를 놓아 좌표 계산을
피했다. 칸마다 좌표를 구하면 격자 구조를 손댈 때 조용히 어긋난다.

축소는 루트에 transform 한 번으로 건다. 좌표마다 scale을 곱하는
StickerDragLayer와 다르게, PreviewStage가 캔버스에 하는 것과 같은
방식이라 정렬이 어긋날 여지가 없다.

PC에서 칸을 클릭할 수 있다는 유일한 단서가 호버 표시다."
```

---

### Task 6: 화면 폭 판정 훅

**Files:**
- Create: `src/editor/useIsNarrow.ts`
- Test: `src/editor/useIsNarrow.test.ts`
- Modify: `src/test/setup.ts`

**Interfaces:**
- Consumes: 없음
- Produces: `useIsNarrow(maxWidth?: number): boolean`, `NARROW_MAX_WIDTH: number` (= 900)

- [ ] **Step 1: setup.ts에 matchMedia 스텁을 넣는다**

jsdom에는 `window.matchMedia`가 없어 훅을 그리는 순간 터진다. `src/test/setup.ts` 맨 아래에 더한다.

```ts
/**
 * jsdom에는 window.matchMedia가 없다.
 *
 * useIsNarrow가 화면 폭을 물어보는 데 쓴다. jsdom은 실제 레이아웃이 없어
 * 폭을 잴 수 없으므로 "넓은 화면"으로 답하는 최소 구현만 둔다.
 * 좁은 화면 동작은 테스트마다 이 값을 갈아끼워 확인한다.
 */
if (window.matchMedia === undefined) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}
```

- [ ] **Step 2: 실패하는 테스트를 쓴다**

`src/editor/useIsNarrow.test.ts`를 만든다.

```ts
import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NARROW_MAX_WIDTH, useIsNarrow } from './useIsNarrow'

const original = window.matchMedia

afterEach(() => {
  window.matchMedia = original
})

function stubMatchMedia(matches: boolean) {
  const listeners: Array<() => void> = []
  window.matchMedia = vi.fn((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: (_: string, fn: () => void) => listeners.push(fn),
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

describe('useIsNarrow', () => {
  it('기준 폭이 CSS 미디어쿼리와 같은 900px이다', () => {
    expect(NARROW_MAX_WIDTH).toBe(900)
  })

  it('넓은 화면이면 false다', () => {
    stubMatchMedia(false)
    const { result } = renderHook(() => useIsNarrow())
    expect(result.current).toBe(false)
  })

  it('좁은 화면이면 true다', () => {
    stubMatchMedia(true)
    const { result } = renderHook(() => useIsNarrow())
    expect(result.current).toBe(true)
  })

  it('기준 폭을 미디어쿼리 문자열에 넣는다', () => {
    stubMatchMedia(false)
    renderHook(() => useIsNarrow())
    expect(window.matchMedia).toHaveBeenCalledWith(`(max-width: ${NARROW_MAX_WIDTH}px)`)
  })
})
```

- [ ] **Step 3: 실패를 확인한다**

Run: `npm test -- src/editor/useIsNarrow.test.ts`
Expected: FAIL — `./useIsNarrow` 모듈을 찾을 수 없음

- [ ] **Step 4: 구현한다**

`src/editor/useIsNarrow.ts`를 만든다.

```ts
import { useEffect, useState } from 'react'

/**
 * 좁은 화면으로 보는 기준. index.css의 미디어쿼리와 **같은 값이어야 한다.**
 * 그 폭에서 미리보기와 편집 패널이 위아래로 쌓이는데, 날짜 편집기도 같은
 * 지점에서 팝오버 대신 바텀시트로 바뀌어야 한다.
 */
export const NARROW_MAX_WIDTH = 900

/** 화면이 좁은지 알려준다. 창 크기가 바뀌면 따라 바뀐다. */
export function useIsNarrow(maxWidth: number = NARROW_MAX_WIDTH): boolean {
  const query = `(max-width: ${maxWidth}px)`
  const [narrow, setNarrow] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const list = window.matchMedia(query)
    const update = () => setNarrow(list.matches)
    update()
    list.addEventListener('change', update)
    return () => list.removeEventListener('change', update)
  }, [query])

  return narrow
}
```

- [ ] **Step 5: 통과를 확인한다**

Run: `npm test -- src/editor/useIsNarrow.test.ts`
Expected: PASS (4개)

- [ ] **Step 6: 커밋**

```bash
git add src/editor/useIsNarrow.ts src/editor/useIsNarrow.test.ts src/test/setup.ts
git commit -m "feat: 화면 폭 판정 훅

날짜 편집기가 팝오버와 바텀시트로 갈리는 지점이다. 기준 900px은
index.css의 미디어쿼리와 같은 값이어야 미리보기 배치가 바뀌는 순간과
편집기가 바뀌는 순간이 어긋나지 않는다.

jsdom에 matchMedia가 없어 setup.ts에 최소 스텁을 뒀다."
```

---

### Task 7: 팝오버와 바텀시트 껍데기

폼은 한 벌이고 감싸는 것만 둘이다.

**Files:**
- Create: `src/editor/DayPopover.tsx`
- Create: `src/editor/DaySheet.tsx`
- Test: `src/editor/DayPopover.test.tsx`

**Interfaces:**
- Consumes: Task 2의 `ScreenRect`·`PopoverPlacement`·`clampToRange`
- Produces:
  - `POPOVER_WIDTH: number` (= 320)
  - `DayPopover` props `{ anchor: ScreenRect; placement: PopoverPlacement; containerWidth: number; containerHeight: number; onClose: () => void; children: ReactNode }`
  - `DaySheet` props `{ onClose: () => void; children: ReactNode }`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/editor/DayPopover.test.tsx`를 만든다.

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { DayPopover, POPOVER_WIDTH } from './DayPopover'

const anchor = { x: 100, y: 200, width: 170, height: 100 }

function renderPopover(overrides: Record<string, unknown> = {}) {
  const props = {
    anchor,
    placement: { horizontal: 'right', vertical: 'below' } as const,
    containerWidth: 1200,
    containerHeight: 675,
    onClose: () => {},
    children: createElement('p', null, '내용'),
    ...overrides,
  }
  return render(createElement(DayPopover, props))
}

describe('DayPopover', () => {
  it('폭이 320px이다', () => {
    expect(POPOVER_WIDTH).toBe(320)
  })

  it('아래로 펼치면 칸 아래에 놓인다', () => {
    renderPopover()
    const box = screen.getByRole('dialog')
    expect(box.style.top).toBe(`${anchor.y + anchor.height + 8}px`)
    expect(box.style.bottom).toBe('')
  })

  it('위로 뒤집으면 bottom으로 잡는다', () => {
    renderPopover({ placement: { horizontal: 'right', vertical: 'above' } })
    const box = screen.getByRole('dialog')
    expect(box.style.bottom).toBe(`${675 - anchor.y + 8}px`)
    expect(box.style.top).toBe('')
  })

  it('왼쪽으로 뒤집으면 칸 왼쪽에 붙는다', () => {
    renderPopover({
      anchor: { x: 900, y: 200, width: 170, height: 100 },
      placement: { horizontal: 'left', vertical: 'below' },
    })
    expect(screen.getByRole('dialog').style.left).toBe(`${900 - POPOVER_WIDTH - 8}px`)
  })

  it('오른쪽으로 넘치면 화면 안으로 민다', () => {
    renderPopover({
      anchor: { x: 1000, y: 200, width: 170, height: 100 },
      placement: { horizontal: 'right', vertical: 'below' },
    })
    expect(screen.getByRole('dialog').style.left).toBe(`${1200 - POPOVER_WIDTH - 8}px`)
  })

  it('Esc를 누르면 닫는다', () => {
    const onClose = vi.fn()
    renderPopover({ onClose })

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('바깥을 누르면 닫는다', () => {
    const onClose = vi.fn()
    renderPopover({ onClose })

    fireEvent.pointerDown(document.body)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('안을 누르면 닫지 않는다', () => {
    const onClose = vi.fn()
    renderPopover({ onClose })

    fireEvent.pointerDown(screen.getByText('내용'))

    expect(onClose).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npm test -- src/editor/DayPopover.test.tsx`
Expected: FAIL — `./DayPopover` 모듈을 찾을 수 없음

- [ ] **Step 3: DayPopover를 구현한다**

`src/editor/DayPopover.tsx`를 만든다.

```tsx
import { useEffect, useRef, type ReactNode } from 'react'
import { clampToRange, type PopoverPlacement, type ScreenRect } from './cellGeometry'

/**
 * 강조 줄이 가장 넓다 — 라벨 56 + 버튼 7개×22 + 간격 6×6 = 246px.
 * 좌우 패딩을 더해 320px. 지금 편집 패널 폭(320~420px)과 비슷해서
 * 폼을 그대로 옮겨도 안 깨진다.
 */
export const POPOVER_WIDTH = 320

/** 칸과 팝오버 사이 간격 */
const GAP = 8

export type DayPopoverProps = {
  /** 고른 칸의 화면 좌표. 미리보기 컨테이너 왼쪽 위가 원점이다. */
  anchor: ScreenRect
  placement: PopoverPlacement
  containerWidth: number
  containerHeight: number
  onClose: () => void
  children: ReactNode
}

/** 고른 칸 옆에 뜨는 편집 상자. 넓은 화면에서만 쓴다. */
export function DayPopover({
  anchor, placement, containerWidth, containerHeight, onClose, children,
}: DayPopoverProps) {
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    const onPointerDown = (event: PointerEvent) => {
      const box = boxRef.current
      if (box && event.target instanceof Node && box.contains(event.target)) return
      onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [onClose])

  const rawLeft = placement.horizontal === 'right'
    ? anchor.x + anchor.width + GAP
    : anchor.x - POPOVER_WIDTH - GAP
  const left = clampToRange(rawLeft, POPOVER_WIDTH, containerWidth, GAP)

  // 위로 뒤집을 때는 높이를 몰라도 되게 bottom으로 잡는다.
  const vertical = placement.vertical === 'below'
    ? { top: anchor.y + anchor.height + GAP }
    : { bottom: containerHeight - anchor.y + GAP }

  return (
    <div
      ref={boxRef}
      role="dialog"
      aria-label="날짜 편집"
      style={{
        position: 'absolute',
        left,
        ...vertical,
        width: POPOVER_WIDTH,
        boxSizing: 'border-box',
        padding: 12,
        borderRadius: 10,
        border: '2px solid #2563eb',
        background: '#ffffff',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
        zIndex: 20,
      }}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 4: 통과를 확인한다**

Run: `npm test -- src/editor/DayPopover.test.tsx`
Expected: PASS (8개)

- [ ] **Step 5: DaySheet를 구현한다**

`src/editor/DaySheet.tsx`를 만든다. 테스트는 Task 8의 App 배선에서 함께 확인한다 — 껍데기가 고정 위치와 스크롤만 담당해 단독 검증할 동작이 없다.

```tsx
import { useEffect, type ReactNode } from 'react'

export type DaySheetProps = {
  onClose: () => void
  children: ReactNode
}

/**
 * 화면 아래에서 올라오는 편집 시트. 좁은 화면에서만 쓴다.
 *
 * 폼 높이가 약 420px이라 작은 폰(667px)에서는 화면의 55%로 잡으면 안
 * 들어간다. 75%까지 열어 두고 넘치면 시트 안에서 스크롤한다. 폰에서만
 * 아이콘을 접으면 폼이 화면 크기에 따라 두 모습을 갖게 되므로 그 길은
 * 택하지 않았다.
 *
 * .app-editor에 transform이 걸려 있지 않아 position: fixed가 정상 동작한다.
 */
export function DaySheet({ onClose, children }: DaySheetProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-label="날짜 편집"
      style={{
        position: 'fixed',
        left: 0, right: 0, bottom: 0,
        maxHeight: '75vh',
        overflowY: 'auto',
        boxSizing: 'border-box',
        padding: 12,
        borderTopLeftRadius: 14,
        borderTopRightRadius: 14,
        borderTop: '2px solid #2563eb',
        background: '#ffffff',
        boxShadow: '0 -6px 20px rgba(0, 0, 0, 0.18)',
        zIndex: 30,
      }}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 6: 전체 테스트와 타입 검사**

Run: `npm test && npx tsc -b`
Expected: 기존 272개 + 새 테스트 전부 PASS, 타입 오류 없음

- [ ] **Step 7: 커밋**

```bash
git add src/editor/DayPopover.tsx src/editor/DayPopover.test.tsx src/editor/DaySheet.tsx
git commit -m "feat: 날짜 편집 팝오버와 바텀시트 껍데기

폼은 한 벌이고 감싸는 것만 둘이다. 편집 UI를 두 벌 유지하는 것과
다르므로, 앞으로 날짜 편집에 뭘 더해도 고칠 곳은 SelectedDayEditor
한 곳이다.

팝오버는 위로 뒤집을 때 높이를 몰라도 되게 bottom으로 잡는다.
시트는 폼 420px이 작은 폰에 안 들어가므로 75%까지 열고 안에서
스크롤한다."
```

---

### Task 8: App 배선과 31일 목록 제거

여기서 처음으로 화면에서 동작한다.

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/editor/EditorPanel.tsx`
- Delete: `src/editor/DayEditor.tsx`
- Delete: `src/editor/DayEditor.test.tsx`

**Interfaces:**
- Consumes: Task 2·4·5·6·7의 전부
- Produces: 없음 (배선)

- [ ] **Step 1: EditorPanel에서 DayEditor를 뺀다**

`src/editor/EditorPanel.tsx`에서 `import { DayEditor } from './DayEditor'` 줄과 `<DayEditor api={api} />` 줄을 지운다.

- [ ] **Step 2: App에 선택 상태와 레이어를 배선한다**

`src/App.tsx`를 다음으로 바꾼다.

```tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DayClickLayer } from './editor/DayClickLayer'
import { DayPopover } from './editor/DayPopover'
import { DaySheet } from './editor/DaySheet'
import { EditorPanel } from './editor/EditorPanel'
import { PreviewStage } from './editor/PreviewStage'
import { SelectedDayEditor } from './editor/SelectedDayEditor'
import { StickerDragLayer } from './editor/StickerDragLayer'
import { cellScreenRect, popoverPlacement } from './editor/cellGeometry'
import { useIsNarrow } from './editor/useIsNarrow'
import { buildMonthGrid } from './model/calendar'
import { ScheduleCanvas } from './preview/ScheduleCanvas'
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './preview/layout'
import { useAssetUrl } from './state/useAssetUrl'
import { useRecurringRules } from './state/useRecurringRules'
import { useScheduleDoc } from './state/useScheduleDoc'
import { fontFamilyFor, type FontOption, loadUserFonts } from './theme/fonts'

const today = new Date()

export default function App() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const api = useScheduleDoc(today.getFullYear(), today.getMonth() + 1)
  const [userFonts, setUserFonts] = useState<FontOption[]>([])
  const rulesApi = useRecurringRules()
  const isNarrow = useIsNarrow()

  useEffect(() => {
    void loadUserFonts().then(setUserFonts)
  }, [])

  const fontFamily = fontFamilyFor(api.doc.fontId, userFonts)
  const backgroundUrl = useAssetUrl(api.doc.backgroundAssetId)

  const [previewScale, setPreviewScale] = useState(0)
  const handleScaleChange = useCallback((next: number) => setPreviewScale(next), [])

  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // 달을 옮기면 선택을 푼다. 8월 8일을 고른 채 9월로 넘어갔을 때
  // 9월 8일이 선택돼 있는 것은 자연스럽지 않다.
  const { year, month } = api.doc
  useEffect(() => setSelectedDate(null), [year, month])

  // 같은 칸을 다시 누르면 해제한다.
  const handleSelect = useCallback((date: string) => {
    setSelectedDate((prev) => (prev === date ? null : date))
  }, [])

  const closeEditor = useCallback(() => setSelectedDate(null), [])

  const selectedIndex = useMemo(() => {
    if (selectedDate === null) return -1
    return buildMonthGrid(year, month).findIndex((cell) => cell.date === selectedDate)
  }, [selectedDate, year, month])

  const editorForm = selectedDate === null ? null : (
    <SelectedDayEditor
      api={api}
      date={selectedDate}
      onSelect={setSelectedDate}
      onClose={closeEditor}
    />
  )

  return (
    <div style={{ padding: 16, maxWidth: 2000, margin: '0 auto' }}>
      <h1 style={{ fontSize: 18, margin: '0 0 12px' }}>월간 스케줄표 만들기</h1>

      {api.saveError && (
        <p style={{ color: '#c0392b', fontSize: 13 }}>
          {api.saveError === 'quota'
            ? '저장 공간이 가득 찼습니다. 배경 이미지나 폰트를 정리해 주세요.'
            : '저장에 실패했습니다.'}
        </p>
      )}

      <div className="app-layout">
        <div className="app-preview">
          <div style={{ position: 'relative' }}>
            <PreviewStage verticalChrome={90} onScaleChange={handleScaleChange}>
              <ScheduleCanvas
                ref={canvasRef}
                doc={api.doc}
                fontFamily={fontFamily}
                backgroundUrl={backgroundUrl}
              />
            </PreviewStage>

            {/*
              스티커 레이어보다 **먼저** 놓는다. 반대로 두면 날짜 오버레이가
              스티커 위에 깔려 스티커를 못 끈다.
            */}
            <DayClickLayer
              year={year}
              month={month}
              scale={previewScale}
              selectedDate={selectedDate}
              onSelect={handleSelect}
            />
            <StickerDragLayer api={api} scale={previewScale} />

            {!isNarrow && editorForm !== null && selectedIndex >= 0 && (
              <DayPopover
                anchor={cellScreenRect(selectedIndex, previewScale)}
                placement={popoverPlacement(selectedIndex)}
                containerWidth={CANVAS_WIDTH * previewScale}
                containerHeight={CANVAS_HEIGHT * previewScale}
                onClose={closeEditor}
              >
                {editorForm}
              </DayPopover>
            )}
          </div>
        </div>
        <div className="app-editor">
          <EditorPanel
            api={api}
            userFonts={userFonts}
            onUserFontsChange={setUserFonts}
            canvasRef={canvasRef}
            rulesApi={rulesApi}
          />
        </div>
      </div>

      {isNarrow && editorForm !== null && (
        <DaySheet onClose={closeEditor}>{editorForm}</DaySheet>
      )}
    </div>
  )
}
```

- [ ] **Step 3: 예전 파일을 지운다**

```bash
git rm src/editor/DayEditor.tsx src/editor/DayEditor.test.tsx
```

- [ ] **Step 4: 전체 테스트와 타입 검사**

Run: `npm test && npx tsc -b`
Expected: 전부 PASS. `DayEditor`를 참조하는 곳이 남아 있으면 여기서 잡힌다.

- [ ] **Step 5: 화면에서 확인한다**

Run: `npm run dev`

브라우저에서 확인한다.
1. 달력 칸에 마우스를 올리면 옅은 파란 테두리가 뜨는가
2. 칸을 누르면 그 옆에 팝오버가 뜨는가
3. 팝오버에 일정을 입력하면 미리보기가 즉시 따라오는가
4. `‹ ›`로 옮겨지고 1일·말일에서 꺼지는가
5. `✕`·`Esc`·바깥 클릭으로 닫히는가
6. **토요일 열과 마지막 주 칸에서 팝오버가 뒤집혀 뜨는가**
7. 앞뒤 달 칸은 눌러도 아무 일이 없는가

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "feat: 달력 칸을 클릭해 그 날짜를 편집한다

31일치 입력 블록을 없앴다. 24일을 고치려고 내보내기·테마·배경·스티커·
폰트·제목·규칙을 전부 지나쳐 스크롤해야 했는데, 화면에는 달력이 이미
떠 있으면서 클릭할 수 없었다.

DayClickLayer를 StickerDragLayer보다 먼저 놓는다. 반대면 오버레이가
스티커 위에 깔려 스티커를 못 끈다.

선택 상태는 ScheduleDoc에 넣지 않는다. 저장 대상이 아니고, 넣으면
migrateDoc과 마이그레이션 테스트가 전부 이 값을 알아야 한다."
```

---

### Task 9: 편집 패널 탭 3개

**Files:**
- Create: `src/editor/EditorTabs.tsx`
- Test: `src/editor/EditorTabs.test.tsx`
- Modify: `src/editor/EditorPanel.tsx`
- Modify: `src/editor/StorageStatus.tsx`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `type EditorTabId = 'calendar' | 'decorate' | 'sidebar'`
  - `EDITOR_TABS: ReadonlyArray<{ id: EditorTabId; label: string }>`
  - `TAB_STORAGE_KEY = 'weekplanner:editor-tab'`
  - `loadEditorTab(): EditorTabId`
  - `saveEditorTab(id: EditorTabId): void`
  - `EditorTabs` props `{ value: EditorTabId; onChange: (id: EditorTabId) => void }`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/editor/EditorTabs.test.tsx`를 만든다.

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  EDITOR_TABS, EditorTabs, TAB_STORAGE_KEY, loadEditorTab, saveEditorTab,
} from './EditorTabs'

beforeEach(() => {
  localStorage.clear()
})

describe('EditorTabs', () => {
  it('탭이 달력·꾸미기·사이드바 셋이다', () => {
    expect(EDITOR_TABS.map((tab) => tab.label)).toEqual(['달력', '꾸미기', '사이드바'])
  })

  it('고른 탭을 눌린 상태로 표시한다', () => {
    render(createElement(EditorTabs, { value: 'decorate', onChange: () => {} }))

    expect(screen.getByRole('tab', { name: '꾸미기' }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByRole('tab', { name: '달력' }).getAttribute('aria-selected')).toBe('false')
  })

  it('다른 탭을 누르면 onChange를 부른다', () => {
    const onChange = vi.fn()
    render(createElement(EditorTabs, { value: 'calendar', onChange }))

    fireEvent.click(screen.getByRole('tab', { name: '사이드바' }))

    expect(onChange).toHaveBeenCalledWith('sidebar')
  })
})

describe('탭 저장', () => {
  it('저장한 탭을 다시 읽는다', () => {
    saveEditorTab('sidebar')
    expect(loadEditorTab()).toBe('sidebar')
  })

  it('저장된 것이 없으면 달력 탭이다', () => {
    expect(loadEditorTab()).toBe('calendar')
  })

  it('모르는 값이 들어 있으면 달력 탭으로 떨어진다', () => {
    localStorage.setItem(TAB_STORAGE_KEY, 'nonsense')
    expect(loadEditorTab()).toBe('calendar')
  })
})
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npm test -- src/editor/EditorTabs.test.tsx`
Expected: FAIL — `./EditorTabs` 모듈을 찾을 수 없음

- [ ] **Step 3: 구현한다**

`src/editor/EditorTabs.tsx`를 만든다.

```tsx
export type EditorTabId = 'calendar' | 'decorate' | 'sidebar'

export const EDITOR_TABS: ReadonlyArray<{ id: EditorTabId; label: string }> = [
  { id: 'calendar', label: '달력' },
  { id: 'decorate', label: '꾸미기' },
  { id: 'sidebar', label: '사이드바' },
]

export const TAB_STORAGE_KEY = 'weekplanner:editor-tab'

const isTabId = (value: string | null): value is EditorTabId =>
  EDITOR_TABS.some((tab) => tab.id === value)

/**
 * 마지막에 보던 탭. ScheduleDoc에 넣지 않는다 — 결과 이미지에 영향을 주지
 * 않는 편집기 상태라 문서에 들어가면 마이그레이션이 이 값을 알아야 한다.
 */
export function loadEditorTab(): EditorTabId {
  try {
    const raw = localStorage.getItem(TAB_STORAGE_KEY)
    return isTabId(raw) ? raw : 'calendar'
  } catch {
    return 'calendar'
  }
}

export function saveEditorTab(id: EditorTabId): void {
  try {
    localStorage.setItem(TAB_STORAGE_KEY, id)
  } catch {
    // 저장에 실패해도 이번 세션 동작에는 지장이 없다.
  }
}

export type EditorTabsProps = {
  value: EditorTabId
  onChange: (id: EditorTabId) => void
}

export function EditorTabs({ value, onChange }: EditorTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="편집 항목"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 16 }}
    >
      {EDITOR_TABS.map((tab) => {
        const selected = tab.id === value
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            style={{
              padding: '8px 4px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
              fontWeight: selected ? 700 : 400,
              border: `1px solid ${selected ? '#18181b' : '#d4d4d8'}`,
              background: selected ? '#18181b' : '#ffffff',
              color: selected ? '#ffffff' : '#3f3f46',
            }}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: 통과를 확인한다**

Run: `npm test -- src/editor/EditorTabs.test.tsx`
Expected: PASS (6개)

- [ ] **Step 5: EditorPanel을 탭 구조로 바꾼다**

`src/editor/EditorPanel.tsx`를 다음으로 바꾼다.

```tsx
import { useState, type RefObject } from 'react'
import type { RecurringRulesApi } from '../state/useRecurringRules'
import type { ScheduleDocApi } from '../state/useScheduleDoc'
import type { FontOption } from '../theme/fonts'
import { BackgroundPicker } from './BackgroundPicker'
import { EditorTabs, loadEditorTab, saveEditorTab, type EditorTabId } from './EditorTabs'
import { ExportPanel } from './ExportPanel'
import { FontPicker } from './FontPicker'
import { HeaderEditor } from './HeaderEditor'
import { MonthPicker } from './MonthPicker'
import { RecurringEditor } from './RecurringEditor'
import { StickerManager } from './StickerManager'
import { StorageStatus } from './StorageStatus'
import { ThemePicker } from './ThemePicker'

export type EditorPanelProps = {
  api: ScheduleDocApi
  userFonts: FontOption[]
  onUserFontsChange: (fonts: FontOption[]) => void
  canvasRef: RefObject<HTMLDivElement | null>
  rulesApi: RecurringRulesApi
}

/**
 * 설정 13개를 탭 3개로 접는다.
 *
 * 이미지 저장은 탭에 넣지 않는다 — 가장 자주 쓰는 기능이라 지금까지
 * 맨 위에 있었고, 탭 뒤로 보내면 매번 한 번 더 눌러야 한다. 탭의 약점이
 * "안 보이는 탭에 뭐가 있는지 모른다"는 것이라, 매번 쓰는 것을 밖에 꺼내
 * 두면 그 약점이 닿는 범위가 줄어든다.
 *
 * 날짜별 일정은 여기 없다. 미리보기 달력 칸을 클릭해 편집한다.
 */
export function EditorPanel({
  api, userFonts, onUserFontsChange, canvasRef, rulesApi,
}: EditorPanelProps) {
  const [tab, setTab] = useState<EditorTabId>(loadEditorTab)

  const changeTab = (id: EditorTabId) => {
    setTab(id)
    saveEditorTab(id)
  }

  return (
    <div>
      <ExportPanel api={api} canvasRef={canvasRef} />

      <EditorTabs value={tab} onChange={changeTab} />

      {tab === 'calendar' && (
        <>
          <MonthPicker api={api} />
          <RecurringEditor api={api} rulesApi={rulesApi} />
        </>
      )}

      {tab === 'decorate' && (
        <>
          <ThemePicker api={api} />
          <BackgroundPicker api={api} />
          <FontPicker api={api} userFonts={userFonts} onUserFontsChange={onUserFontsChange} />
          <StickerManager api={api} />
        </>
      )}

      {tab === 'sidebar' && <HeaderEditor api={api} />}

      <StorageStatus api={api} />
    </div>
  )
}
```

- [ ] **Step 6: StorageStatus를 한 줄로 줄인다**

`src/editor/StorageStatus.tsx`의 `return` 부분을 다음으로 바꾼다. `sectionStyle`·`sectionTitleStyle` import는 지우고 `buttonStyle`만 남긴다.

```tsx
  return (
    <div style={{ marginTop: 4, paddingTop: 12, borderTop: '1px dashed #d4d4d8' }}>
      {api.saveError === 'quota' && (
        <p style={{ fontSize: 13, color: '#c0392b', marginBottom: 8 }}>
          저장 공간이 가득 찼습니다. 아래 정리를 눌러 보세요.
        </p>
      )}
      <button
        type="button"
        style={{ ...buttonStyle, fontSize: 12, width: '100%' }}
        onClick={() => void handlePurge()}
      >
        사용하지 않는 이미지·폰트 정리
      </button>
      {notice && <p style={{ fontSize: 12, color: '#52525b', marginTop: 4 }}>{notice}</p>}
    </div>
  )
```

- [ ] **Step 7: 전체 테스트와 타입 검사**

Run: `npm test && npx tsc -b`
Expected: 전부 PASS

- [ ] **Step 8: 화면에서 확인한다**

Run: `npm run dev`

1. 이미지 저장이 맨 위에 그대로 있는가
2. 탭 셋이 그 아래 있고 눌러서 바뀌는가
3. 새로고침해도 마지막 탭이 유지되는가
4. 「사이드바」 탭에 제목과 상자 3개가 다 있는가
5. 저장 공간이 맨 아래 한 줄로 있는가

- [ ] **Step 9: 커밋**

```bash
git add -A
git commit -m "feat: 편집 패널을 탭 3개로 접는다

섹션 13개가 전부 펼쳐진 채 세로로 쌓여 있었다. 달력 / 꾸미기 /
사이드바로 나누고, 이미지 저장만 탭 밖 맨 위에 남긴다. 탭의 약점이
안 보이는 탭에 뭐가 있는지 모르는 것이라, 매번 쓰는 것을 밖에 꺼내
두면 그 약점이 닿는 범위가 줄어든다.

HeaderEditor 한 파일이 이미 제목과 상자 3개를 다 갖고 있어 화면에서만
넷으로 흩어져 있었다. 파일을 쪼갤 필요가 없다.

고른 탭은 localStorage에 둔다. ScheduleDoc에 넣으면 결과 이미지와
상관없는 값을 마이그레이션이 알아야 한다."
```

---

### Task 10: 문서 갱신

**Files:**
- Modify: `docs/manual-checklist.md`
- Modify: `docs/현재-상태.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: Task 1~9의 결과
- Produces: 없음

- [ ] **Step 1: 수동 검증 항목을 더한다**

`docs/manual-checklist.md`에 다음 절을 추가한다.

```markdown
## 달력 칸 클릭 편집

- [ ] 창 폭을 여러 번 바꿔가며, **눈에 보이는 칸과 실제로 눌리는 칸이 같은지**
      확인한다. 자동 판정이 안 되는 정렬 문제다
- [ ] 팝오버 입력칸에서 **한글이 정상적으로 입력되는지** — IME 후보창 위치 포함
- [ ] 토요일 열과 마지막 주 칸에서 팝오버가 뒤집혀 뜨는지
- [ ] 창을 좁혔을 때 팝오버가 화면 안으로 밀려 들어오는지
- [ ] 날짜를 고른 상태로 PNG를 내보내 **파란 선택 테두리가 없는지**
- [ ] 스티커가 놓인 칸에서 스티커가 여전히 끌리는지
- [ ] 폰 폭에서 시트가 올라오고, 닫으면 선택이 풀리는지
- [ ] 폰에서 폼이 시트 안에서 스크롤되는지
- [ ] 달을 바꾸면 선택이 풀리는지

## 편집 패널 탭

- [ ] 새로고침해도 마지막 탭이 유지되는지
- [ ] 「사이드바」 탭에 제목과 상자 3개가 모두 있는지
```

- [ ] **Step 2: 현재 상태 문서를 고친다**

`docs/현재-상태.md`에서 다음을 고친다.

1. **1.1 달력** 표의 「날짜 칸 아이콘」 행 아래 설명에서 접이식 3×3 그리드를 설명하는 문단을 지우고 다음으로 바꾼다.

```markdown
고르는 UI는 **3×3 그리드**다. 한 번에 한 날짜만 편집하므로 접지 않는다.
```

2. **1.5 저장과 내보내기** 위에 다음 절을 추가한다.

```markdown
### 1.6 날짜 편집

미리보기 달력 칸을 클릭해 그 날짜를 편집한다. 31일치 목록은 없다.

- PC는 **칸 옆 팝오버**, 폰은 **바텀시트**. 폼은 한 벌이고 껍데기만 둘이다
- 아무것도 안 고른 상태로 시작한다. 앞뒤 달 칸은 눌러도 반응하지 않는다
- `‹ ›`는 **그 달 안에서만** 움직인다. 달 전환은 `MonthPicker`의 일이다
- 해제는 `✕` · `Esc` · 바깥 클릭 · 같은 칸 재클릭

편집 패널은 **탭 3개**다 — 달력(년·월, 반복 일정) / 꾸미기(테마, 배경,
투명도, 폰트, 스티커) / 사이드바(제목, 상자 3개). 이미지 저장은 탭 밖 맨 위,
저장 공간은 맨 아래 한 줄이다.
```

3. **3.1 의도적으로 남겨둔 것** 표에 행을 더한다.

```markdown
| 폰에 클릭 단서가 없다 | 호버가 없기 때문. PC를 기준으로 설계한 결과 |
| 폰에서 칸이 39×31px | 손가락으로 정확히 눌러야 한다 |
| 좌표 계산이 두 벌 | 클릭은 CSS 그리드, 팝오버는 `cellScreenRect`. 테스트로 묶어 둔다 |
```

4. **3.3 다음에 확인할 것**의 3번(「아이콘 고르기 동작 — 고르면 바로 접히는 것이…」)을 지운다. 접이식이 없어졌다.

5. 맨 위 표의 테스트 개수를 실제 값으로 고친다 (`npm test` 출력 확인).

- [ ] **Step 3: README를 고친다**

「만든 것」 목록에서 다음 줄을 고친다.

```markdown
- 날짜별 일정 텍스트, 칸이 넘치면 글자 크기 자동 조절
```
→
```markdown
- 달력 칸을 클릭해 그 날짜 편집 (PC는 팝오버, 폰은 바텀시트)
- 날짜별 일정 텍스트, 칸이 넘치면 글자 크기 자동 조절
```

「구조」 아래 설명에 한 줄 더한다.

```markdown
편집 패널은 탭 3개(달력 / 꾸미기 / 사이드바)로 나뉜다. 이미지 저장만 탭 밖에 있다.
```

- [ ] **Step 4: 커밋**

```bash
git add docs/ README.md
git commit -m "docs: 칸 클릭 편집과 패널 탭을 문서에 반영

수동 검증 항목을 더했다. 축소된 미리보기에서 보이는 칸과 눌리는 칸이
같은지, 팝오버 안에서 한글이 입력되는지는 자동 판정이 안 된다.

아이콘 접이식이 없어져 「다음에 확인할 것」에서 관련 항목을 뺐다."
```

---

## 완료 기준

- [ ] `npm test` 전부 통과 (기존 272개 + 새로 더한 약 48개)
- [ ] `npx tsc -b` 오류 없음
- [ ] `npm run build` 성공
- [ ] `docs/manual-checklist.md`의 새 항목을 사람이 직접 확인
- [ ] `src/editor/DayEditor.tsx`가 저장소에 없음
