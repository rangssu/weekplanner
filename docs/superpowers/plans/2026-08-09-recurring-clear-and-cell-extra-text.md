# 반복 일정 일괄 삭제 · 칸 추가 문구 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 반복 규칙이 뿌린 일정을 버튼 한 번으로 되돌리고, 칸의 일정 아래에 별도 문구를 얹을 수 있게 한다.

**Architecture:** 두 축이다. (1) `model/recurring.ts`에 기존 `applyRecurringRules`의 역함수 `clearRecurringRules`를 짝으로 추가한다 — 규칙 텍스트와 완전히 일치하는 칸만 되돌린다. (2) `DayEntry`에 선택 필드 `extra`를 더하고, `DayCell`이 칸의 텍스트 영역을 본문/추가 문구 두 띠로 나눠 그린다. 추가 문구가 비면 기존과 픽셀 단위로 동일하게 렌더링된다.

**Tech Stack:** React 18, TypeScript 5.6, Vite 7, Vitest 3 (jsdom)

## Global Constraints

- 설계 문서: `docs/superpowers/specs/2026-08-09-recurring-clear-and-cell-extra-text-design.md`
- 테스트 실행: `npm test` (= `vitest run`). 단일 파일은 `npx vitest run src/경로/파일.test.ts`
- 타입 검사 포함 빌드: `npm run build` (= `tsc -b && vite build`)
- `DayEntry.extra`는 **선택 필드**(`extra?: string`)다. 필수로 만들지 않는다 — `migrateDoc`이 `days`를 통째로 캐스팅하므로 런타임에 이 필드가 없는 항목이 실제로 존재한다.
- `model/defaults.ts`의 `createEmptyDayEntry`는 **바꾸지 않는다.** `extra`를 넣으면 `defaults.test.ts`와 `controls.test.ts`의 `toEqual` 비교가 깨진다.
- 기존 테스트 파일의 `DayEntry` 리터럴 14군데는 **손대지 않는다.** 선택 필드라 그대로 컴파일된다.
- UI 라벨은 **`추가 문구`**다. `덮어쓰기`가 아니다 — 반복 규칙에 이미 `전부 덮어쓰기` 버튼이 있어 뜻이 다른 "덮어쓰기"가 한 화면에 둘이 되면 안 된다.
- 주석과 커밋 메시지는 한국어로 쓴다. 기존 코드가 전부 그렇다.
- 기존 코드의 주석 밀도를 따른다 — "왜"를 설명하고 "무엇"은 설명하지 않는다.

## File Structure

| 파일 | 역할 | 변경 |
|---|---|---|
| `src/model/types.ts` | `DayEntry`에 `extra?: string` | 수정 |
| `src/model/recurring.ts` | `clearRecurringRules`, `countClearTargets` 추가 / `plan`이 `extra` 보존 | 수정 |
| `src/model/recurring.test.ts` | 삭제 동작 + `extra` 보존 테스트 | 수정 |
| `src/editor/controls.ts` | `isEmptyEntry`가 `extra`를 본다 | 수정 |
| `src/editor/controls.test.ts` | `extra` 빈 항목 판정 테스트 | 수정 |
| `src/preview/layout.ts` | `CELL_EXTRA_*` 상수 3개 | 수정 |
| `src/preview/DayCell.tsx` | `splitCellText` + 추가 문구 렌더링 | 수정 |
| `src/preview/DayCell.test.ts` | `splitCellText` 테스트 | 수정 |
| `src/editor/DayEditor.tsx` | `추가 문구` 입력칸 | 수정 |
| `src/editor/RecurringEditor.tsx` | `규칙 지우기` 버튼 | 수정 |

새 파일은 만들지 않는다. 각 변경이 이미 그 책임을 가진 파일에 붙는다.

**Task 순서의 이유:** Task 1이 데이터 필드를 깔고, Task 2가 그것을 화면에 그리고, Task 3이 입력 경로를 잇는다. Task 4는 Task 1의 `extra` 보존에 의존하므로 마지막이다. 각 Task는 끝난 시점에 앱이 동작한다.

---

### Task 1: `DayEntry.extra` 필드와 빈 항목 판정

칸에 얹을 문구를 담을 자리를 만든다. 아직 화면에는 안 보인다.

**Files:**
- Modify: `src/model/types.ts:11`
- Modify: `src/editor/controls.ts:51-58`
- Test: `src/editor/controls.test.ts`

**Interfaces:**
- Consumes: 없음 (첫 Task)
- Produces:
  - `DayEntry` 타입에 `extra?: string` — 이후 모든 Task가 읽는다
  - `isEmptyEntry`(비공개)가 `extra`를 판정에 포함 → `updateDay(doc, date, { extra: '12h' })`가 항목을 살려둔다

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/editor/controls.test.ts`의 `describe('updateDay', ...)` 블록 안, `'원본을 변경하지 않는다'` 테스트 **앞**에 넣는다:

```ts
  it('추가 문구만 있어도 항목을 유지한다', () => {
    const doc = updateDay(createEmptyDoc(2026, 8), '2026-08-03', { extra: '12h' })
    expect(doc.days['2026-08-03']?.extra).toBe('12h')
  })

  it('추가 문구를 지우면 다른 게 없을 때 항목이 사라진다', () => {
    let doc = updateDay(createEmptyDoc(2026, 8), '2026-08-03', { extra: '12h' })
    doc = updateDay(doc, '2026-08-03', { extra: '' })
    expect(doc.days['2026-08-03']).toBeUndefined()
  })

  it('추가 문구가 공백뿐이면 빈 항목으로 본다', () => {
    const doc = updateDay(createEmptyDoc(2026, 8), '2026-08-03', { extra: '   ' })
    expect(doc.days['2026-08-03']).toBeUndefined()
  })

  it('추가 문구 필드가 아예 없는 예전 항목도 판정이 동작한다', () => {
    // migrateDoc이 days를 통째로 캐스팅하므로 이 모양이 런타임에 실제로 들어온다.
    const doc = createEmptyDoc(2026, 8)
    doc.days['2026-08-03'] = { text: '방송', dateColor: null, cellFill: null, marker: null }
    const out = updateDay(doc, '2026-08-03', { text: '' })
    expect(out.days['2026-08-03']).toBeUndefined()
  })
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npx vitest run src/editor/controls.test.ts`

Expected: FAIL. `'추가 문구만 있어도 항목을 유지한다'`가 `undefined`를 받는다 — `isEmptyEntry`가 `extra`를 모르므로 항목을 빈 것으로 보고 키를 지운다. 첫 두 테스트는 `extra`가 `DayEntry`에 없어서 타입 오류도 난다.

- [ ] **Step 3: 타입에 필드를 더한다**

`src/model/types.ts`, `marker` 줄 다음에:

```ts
  /**
   * 일정 텍스트 아래에 따로 얹는 문구. 없거나 비면 그리지 않는다.
   *
   * 선택 필드인 이유: storage의 migrateDoc이 days를 통째로 캐스팅해 넘기므로,
   * 이 필드가 없는 예전 문서가 그대로 읽힌다. 필수로 선언하면 타입이
   * 실제 런타임 값과 어긋난다.
   */
  extra?: string
```

- [ ] **Step 4: 빈 항목 판정에 반영한다**

`src/editor/controls.ts`의 `isEmptyEntry`:

```ts
/** 텍스트도 강조도 없으면 저장할 이유가 없는 항목 */
function isEmptyEntry(entry: DayEntry): boolean {
  return (
    entry.text.trim() === '' &&
    entry.dateColor === null &&
    entry.cellFill === null &&
    entry.marker === null &&
    (entry.extra ?? '').trim() === ''
  )
}
```

- [ ] **Step 5: 통과를 확인한다**

Run: `npx vitest run src/editor/controls.test.ts`
Expected: PASS (기존 테스트 포함 전부)

- [ ] **Step 6: 전체 테스트와 타입 검사**

Run: `npm test`
Expected: PASS. 기존 테스트 파일의 `DayEntry` 리터럴 14군데는 선택 필드라 그대로 컴파일된다.

Run: `npm run build`
Expected: 타입 오류 없이 빌드 성공

- [ ] **Step 7: 커밋**

```bash
git add src/model/types.ts src/editor/controls.ts src/editor/controls.test.ts
git commit -m "feat: 칸 항목에 추가 문구 필드 추가"
```

---

### Task 2: 칸에 추가 문구 그리기

칸의 텍스트 영역을 본문/추가 문구 두 띠로 나눠 그린다. 추가 문구가 비면 기존과 완전히 동일하게 그린다.

**Files:**
- Modify: `src/preview/layout.ts:62` 뒤
- Modify: `src/preview/DayCell.tsx`
- Test: `src/preview/DayCell.test.ts`

**Interfaces:**
- Consumes: Task 1의 `DayEntry.extra?: string`
- Produces:
  - `layout.ts`: `CELL_EXTRA_HEIGHT = 78`, `CELL_EXTRA_BASE_SIZE = 62`, `CELL_EXTRA_MIN_SIZE = 32`
  - `DayCell.tsx`: `export function splitCellText(extra: string | undefined): { bodyHeight: number; extraHeight: number }`

**배경 수치** (건드리지 말 것, 계산해서 확인만):
`CELL_HEIGHT = 297`, `CELL_PADDING = 14`, `DATE_NUMBER_BLOCK = 52`
→ `CELL_TEXT_HEIGHT = 297 − 28 − 52 = 217`
추가 문구가 있을 때: 본문 `217 − 78 = 139`, 추가 문구 `78`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/preview/DayCell.test.ts`의 import 줄을 이렇게 바꾼다:

```ts
import { CELL_EXTRA_HEIGHT, CELL_TEXT_HEIGHT } from './layout'
import { dateNumberColor, splitCellText } from './DayCell'
```

파일 맨 끝에 붙인다:

```ts
describe('splitCellText', () => {
  it('추가 문구가 없으면 본문이 텍스트 영역을 전부 쓴다', () => {
    // 기존에 만든 일정표가 픽셀 하나도 안 바뀌어야 한다. 이 테스트가 그 보증이다.
    expect(splitCellText(undefined)).toEqual({ bodyHeight: CELL_TEXT_HEIGHT, extraHeight: 0 })
  })

  it('추가 문구가 빈 문자열이어도 본문이 전부 쓴다', () => {
    expect(splitCellText('')).toEqual({ bodyHeight: CELL_TEXT_HEIGHT, extraHeight: 0 })
  })

  it('추가 문구가 공백뿐이어도 본문이 전부 쓴다', () => {
    expect(splitCellText('   ')).toEqual({ bodyHeight: CELL_TEXT_HEIGHT, extraHeight: 0 })
  })

  it('추가 문구가 있으면 아래쪽 띠만큼 본문이 줄어든다', () => {
    expect(splitCellText('12h')).toEqual({
      bodyHeight: CELL_TEXT_HEIGHT - CELL_EXTRA_HEIGHT,
      extraHeight: CELL_EXTRA_HEIGHT,
    })
  })

  it('두 띠를 더하면 항상 텍스트 영역 전체다', () => {
    for (const value of [undefined, '', '12h', '아주 긴 문구를 넣어도 마찬가지']) {
      const { bodyHeight, extraHeight } = splitCellText(value)
      expect(bodyHeight + extraHeight).toBe(CELL_TEXT_HEIGHT)
    }
  })
})
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npx vitest run src/preview/DayCell.test.ts`
Expected: FAIL — `splitCellText`와 `CELL_EXTRA_HEIGHT`가 없어 import가 깨진다

- [ ] **Step 3: 레이아웃 상수를 더한다**

`src/preview/layout.ts`의 `CELL_TEXT_LINE_HEIGHT` 줄 다음에:

```ts
/**
 * 일정 아래에 얹는 추가 문구가 쓰는 띠.
 *
 * 기본 크기 한 줄이 들어갈 만큼만 잡는다(62 × 1.25 ≈ 78). 더 크게 잡으면
 * 본문이 두 줄도 못 쓰게 되고, 추가 문구가 없는 칸이 대부분이라 손해가 크다.
 *
 * 본문(52)보다 글자가 큰 이유: 여기 들어가는 값은 "12h"처럼 짧고 눈에 먼저
 * 들어와야 하는 것이다. 길이가 아니라 위계로 크기를 정한다.
 */
export const CELL_EXTRA_HEIGHT = 78
export const CELL_EXTRA_BASE_SIZE = 62
export const CELL_EXTRA_MIN_SIZE = 32
```

- [ ] **Step 4: `splitCellText`를 구현한다**

`src/preview/DayCell.tsx`의 import에 상수를 더하고(`CELL_EXTRA_HEIGHT`, `CELL_EXTRA_BASE_SIZE`, `CELL_EXTRA_MIN_SIZE`), `dateNumberColor` 함수 다음에 넣는다:

```ts
/**
 * 칸의 텍스트 영역을 본문과 추가 문구가 어떻게 나눠 쓰는지 정한다.
 *
 * 추가 문구가 없으면 본문이 전부 가져간다. 이 경우 기존 결과물과 픽셀 단위로
 * 같아야 하므로 띠를 0으로 두고 요소 자체를 그리지 않는다.
 */
export function splitCellText(extra: string | undefined): {
  bodyHeight: number
  extraHeight: number
} {
  if ((extra ?? '').trim() === '') {
    return { bodyHeight: CELL_TEXT_HEIGHT, extraHeight: 0 }
  }
  return { bodyHeight: CELL_TEXT_HEIGHT - CELL_EXTRA_HEIGHT, extraHeight: CELL_EXTRA_HEIGHT }
}
```

- [ ] **Step 5: 통과를 확인한다**

Run: `npx vitest run src/preview/DayCell.test.ts`
Expected: PASS

- [ ] **Step 6: 칸에 실제로 그린다**

`src/preview/DayCell.tsx`의 `DayCell` 본문에서, `const text = ...` 줄 다음에 추가하고 `AutoFitText` 부분을 교체한다:

```tsx
  const text = cell.inMonth ? (entry?.text ?? '') : ''
  const extra = cell.inMonth ? (entry?.extra ?? '') : ''
  const { bodyHeight, extraHeight } = splitCellText(extra)
```

`AutoFitText` 요소를 이렇게 바꾼다 (`maxHeight`가 상수에서 `bodyHeight`로 바뀐 것이 핵심):

```tsx
      <AutoFitText
        text={text}
        maxWidth={CELL_TEXT_WIDTH}
        maxHeight={bodyHeight}
        baseSize={CELL_TEXT_BASE_SIZE}
        minSize={CELL_TEXT_MIN_SIZE}
        lineHeight={CELL_TEXT_LINE_HEIGHT}
        color={cell.inMonth ? theme.bodyText : theme.outsideMonthText}
        markerColor={cell.inMonth ? (entry?.marker ?? null) : null}
      />

      {extraHeight > 0 && (
        <AutoFitText
          text={extra}
          maxWidth={CELL_TEXT_WIDTH}
          maxHeight={extraHeight}
          baseSize={CELL_EXTRA_BASE_SIZE}
          minSize={CELL_EXTRA_MIN_SIZE}
          lineHeight={CELL_TEXT_LINE_HEIGHT}
          color={theme.bodyText}
          // 형광펜은 본문에만 건다. 강조 수단이 둘로 늘면 조합만 복잡해지고
          // 지금 요구에는 없다.
          markerColor={null}
        />
      )}
```

- [ ] **Step 7: 전체 테스트와 빌드**

Run: `npm test`
Expected: PASS

Run: `npm run build`
Expected: 성공

- [ ] **Step 8: 눈으로 확인한다**

Run: `npm run dev`

입력칸은 Task 3에서 만든다. 지금은 저장된 문서에 값을 직접 넣어 확인한다.

브라우저에서 먼저 아무 날짜에 일정을 하나 적어 문서가 저장되게 한 뒤, 개발자 도구 콘솔에서:

```js
const key = Object.keys(localStorage).find(k => k.startsWith('weekplanner:doc:'))
const doc = JSON.parse(localStorage.getItem(key))
const date = Object.keys(doc.days)[0]   // 방금 적은 날짜
doc.days[date] = { ...doc.days[date], text: '가나다라', extra: '12h' }
localStorage.setItem(key, JSON.stringify(doc))
location.reload()
```

Expected:
- 그 칸에 `가나다라`가 위쪽, `12h`가 아래쪽에 **조금 더 큰 글씨로** 그려진다
- 나머지 칸은 모양이 전혀 바뀌지 않았다

`key`가 `undefined`면 아직 저장된 문서가 없는 것이다. 앱에서 일정을 하나 적고 다시 실행한다.

- [ ] **Step 9: 커밋**

```bash
git add src/preview/layout.ts src/preview/DayCell.tsx src/preview/DayCell.test.ts
git commit -m "feat: 칸 일정 아래에 추가 문구를 그린다"
```

---

### Task 3: 추가 문구 입력칸

날짜별 일정 패널에서 추가 문구를 입력할 수 있게 한다. 이 Task가 끝나면 기능 2가 완성된다.

**Files:**
- Modify: `src/editor/DayEditor.tsx:75-86`

**Interfaces:**
- Consumes: Task 1의 `DayEntry.extra`, 기존 `updateDay`
- Produces: 없음 (UI 종단)

이 Task는 순수 UI라 단위 테스트를 새로 쓰지 않는다. 판정 로직은 Task 1이, 렌더링은 Task 2가 이미 테스트했다. 이 Task가 하는 일은 그 둘을 잇는 `input` 하나다.

- [ ] **Step 1: 입력칸을 넣는다**

`src/editor/DayEditor.tsx`에서 `isLikelyOverflowing` 경고 블록 **다음**, 첫 `SwatchRow` **앞**에 넣는다:

```tsx
              <label
                style={{ ...fieldLabelStyle, marginTop: 8 }}
                htmlFor={`extra-${cell.date}`}
              >
                추가 문구
              </label>
              <input
                id={`extra-${cell.date}`}
                type="text"
                style={inputStyle}
                value={entry?.extra ?? ''}
                placeholder="예) 12h"
                onChange={(e) => patch(cell.date, { extra: e.target.value })}
              />
```

한 줄 `input`이다. `textarea`가 아니다 — 띠 높이가 한 줄 분량이라 줄바꿈을 받을 자리가 없다.

- [ ] **Step 2: 테스트와 빌드**

Run: `npm test`
Expected: PASS

Run: `npm run build`
Expected: 성공

- [ ] **Step 3: 눈으로 확인한다**

Run: `npm run dev`

1. `날짜별 일정` 패널에서 아무 날짜의 `일정`에 `가나다라`를 적는다
2. 같은 날짜의 `추가 문구`에 `12h`를 적는다
3. 미리보기 칸에 두 줄이 위아래로 갈려 그려지는지 본다
4. `추가 문구`를 지운다 → 본문이 칸 전체를 다시 쓰는지 본다
5. 페이지를 새로고침한다 → `12h`가 저장되어 살아있는지 본다

Expected: 5번까지 전부 그대로 동작

- [ ] **Step 4: 커밋**

```bash
git add src/editor/DayEditor.tsx
git commit -m "feat: 날짜별 추가 문구 입력칸 추가"
```

---

### Task 4: 반복 규칙이 추가 문구를 보존한다

규칙을 다시 적용해도 날짜별로 적어둔 추가 문구가 살아남게 한다. **이 Task가 두 기능을 잇는 핵심이다.**

**Files:**
- Modify: `src/model/recurring.ts:64-71`
- Test: `src/model/recurring.test.ts`

**Interfaces:**
- Consumes: Task 1의 `DayEntry.extra`
- Produces: `plan`이 만드는 `DayEntry`가 기존 `extra`를 물려받는다 → Task 5의 삭제도 같은 성질을 갖는다

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/model/recurring.test.ts`의 `describe('applyRecurringRules', ...)` 블록 안, `'달이 바뀌면 ...'` 테스트 **앞**에 넣는다:

```ts
  it('추가 문구는 어느 모드에서도 보존된다', () => {
    // 규칙으로 제목을 다시 뿌려도 날짜별로 적어둔 방송 길이는 살아남아야 한다.
    // 이게 안 되면 추가 문구를 적을 이유가 없다.
    for (const mode of ['fill-empty', 'overwrite'] as const) {
      const d = doc()
      d.days['2026-08-04'] = {
        text: '', dateColor: null, cellFill: null, marker: null, extra: '12h',
      }
      const out = applyRecurringRules(d, [rule()], mode)
      expect(out.days['2026-08-04'].extra).toBe('12h')
      expect(out.days['2026-08-04'].text).toBe('발로란트 랭크\n21:00')
    }
  })
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npx vitest run src/model/recurring.test.ts`
Expected: FAIL — `expected undefined to be '12h'`. `plan`이 새 `DayEntry`를 통째로 만들면서 `extra`를 버린다.

- [ ] **Step 3: `plan`이 보존하게 고친다**

`src/model/recurring.ts`의 `plan` 안 `result.set(...)`:

```ts
    result.set(cell.date, {
      // 날짜 숫자 색은 규칙이 건드리지 않는다. 공휴일 표시처럼 날짜 자체의
      // 성격을 나타내는 것이라 반복 일정과 성격이 다르다.
      dateColor: doc.days[cell.date]?.dateColor ?? null,
      // 추가 문구도 마찬가지다. 규칙은 요일에 묶인 것을 다루고, 추가 문구는
      // 날짜마다 다른 값이라 규칙이 덮으면 안 된다.
      extra: doc.days[cell.date]?.extra,
      text: rule.text,
      cellFill: rule.cellFill,
      marker: rule.marker,
    })
```

- [ ] **Step 4: 통과를 확인한다**

Run: `npx vitest run src/model/recurring.test.ts`
Expected: PASS (기존 테스트 포함)

`'규칙에 맞는 요일 칸을 전부 채운다'` 같은 기존 테스트는 `extra`가 `undefined`로 들어가도 `.text`만 보므로 영향이 없다.

- [ ] **Step 5: 전체 테스트와 빌드**

Run: `npm test`
Expected: PASS

Run: `npm run build`
Expected: 성공

- [ ] **Step 6: 커밋**

```bash
git add src/model/recurring.ts src/model/recurring.test.ts
git commit -m "feat: 반복 규칙 적용이 추가 문구를 보존한다"
```

---

### Task 5: 반복 일정 일괄 삭제 (모델)

`applyRecurringRules`의 역함수를 만든다.

**Files:**
- Modify: `src/model/recurring.ts`
- Test: `src/model/recurring.test.ts`

**Interfaces:**
- Consumes: Task 4의 `extra` 보존 성질, 기존 `RecurringRule` / `usableRules` / `ScheduleDoc`
- Produces:
  - `export function clearRecurringRules(doc: ScheduleDoc, rules: RecurringRule[]): ScheduleDoc`
  - `export function countClearTargets(doc: ScheduleDoc, rules: RecurringRule[]): number`
  - → Task 6의 `RecurringEditor`가 이 둘을 쓴다

**판정 규칙** (설계 §3.1, §3.2):
- 칸의 `text`가 규칙 `text`와 `trim()` 기준 **완전 일치**하면 대상
- **요일은 보지 않는다** — 규칙 요일을 바꾼 뒤엔 예전에 뿌린 칸이 판정에서 빠져 영영 안 지워지기 때문
- 여러 규칙 중 하나라도 일치하면 대상
- 지우는 것: `text`→`''`, `cellFill`→`null`, `marker`→`null`
- 보존하는 것: `dateColor`, `extra`
- 결과가 완전히 빈 항목이면 `days`에서 키 자체를 지운다

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/model/recurring.test.ts`에서 import 줄에 두 함수를 더한다:

```ts
import {
  applyRecurringRules, clearRecurringRules, countClearTargets, countRuleTargets,
  createRecurringRule, loadRecurringRules, type RecurringRule, saveRecurringRules,
} from './recurring'
```

`describe('countRuleTargets', ...)` 블록 **다음**에 붙인다:

```ts
describe('clearRecurringRules', () => {
  const applied = () => applyRecurringRules(doc(), [rule()], 'fill-empty')

  it('규칙이 뿌린 칸을 전부 비운다', () => {
    const out = clearRecurringRules(applied(), [rule()])
    expect(out.days).toEqual({})
  })

  it('한 글자라도 다른 칸은 남긴다', () => {
    const d = applied()
    d.days['2026-08-11'] = {
      text: '발로란트 랭크\n22:00', dateColor: null, cellFill: null, marker: null,
    }
    const out = clearRecurringRules(d, [rule()])
    expect(out.days['2026-08-11'].text).toBe('발로란트 랭크\n22:00')
    expect(Object.keys(out.days)).toEqual(['2026-08-11'])
  })

  it('앞뒤 공백만 다른 칸은 지운다', () => {
    const d = doc()
    d.days['2026-08-04'] = {
      text: '  발로란트 랭크\n21:00  ', dateColor: null, cellFill: null, marker: null,
    }
    expect(clearRecurringRules(d, [rule()]).days).toEqual({})
  })

  it('규칙 요일이 아닌 날에 있어도 텍스트가 맞으면 지운다', () => {
    // 규칙 요일을 나중에 바꿔도 예전에 뿌려둔 칸이 남지 않아야 한다.
    const d = doc()
    d.days['2026-08-03'] = { // 월요일. 규칙은 화요일이다.
      text: '발로란트 랭크\n21:00', dateColor: null, cellFill: null, marker: null,
    }
    expect(clearRecurringRules(d, [rule()]).days).toEqual({})
  })

  it('규칙이 넣었던 강조도 함께 지운다', () => {
    const d = applyRecurringRules(
      doc(), [rule({ cellFill: '#ffd6e0', marker: '#ffe680' })], 'fill-empty',
    )
    expect(clearRecurringRules(d, [rule({ cellFill: '#ffd6e0', marker: '#ffe680' })]).days)
      .toEqual({})
  })

  it('날짜 색은 보존한다', () => {
    const d = applied()
    d.days['2026-08-04'] = { ...d.days['2026-08-04'], dateColor: '#ff0000' }
    const out = clearRecurringRules(d, [rule()])
    // 날짜 색이 남았으므로 빈 항목이 아니고, 키도 살아 있다.
    expect(out.days['2026-08-04'].dateColor).toBe('#ff0000')
    expect(out.days['2026-08-04'].text).toBe('')
    expect(out.days['2026-08-04'].cellFill).toBeNull()
    expect(out.days['2026-08-04'].marker).toBeNull()
  })

  it('추가 문구는 보존한다', () => {
    const d = applied()
    d.days['2026-08-04'] = { ...d.days['2026-08-04'], extra: '12h' }
    const out = clearRecurringRules(d, [rule()])
    expect(out.days['2026-08-04'].extra).toBe('12h')
    expect(out.days['2026-08-04'].text).toBe('')
  })

  it('여러 규칙 중 하나라도 맞으면 지운다', () => {
    const d = applyRecurringRules(
      doc(), [rule(), rule({ weekdays: [5], text: '금요일 방송' })], 'fill-empty',
    )
    const out = clearRecurringRules(d, [rule({ weekdays: [5], text: '금요일 방송' })])
    // 금요일 칸만 사라지고 화요일 칸 4개는 남는다.
    expect(Object.keys(out.days).sort()).toEqual(AUGUST_TUESDAYS)
  })

  it('텍스트가 빈 규칙은 무시한다', () => {
    const d = doc()
    d.days['2026-08-04'] = { text: '', dateColor: null, cellFill: '#ffd6e0', marker: null }
    const out = clearRecurringRules(d, [rule({ text: '   ' })])
    expect(out.days['2026-08-04'].cellFill).toBe('#ffd6e0')
  })

  it('요일을 안 고른 규칙도 텍스트가 맞으면 지운다', () => {
    // 삭제는 요일을 보지 않으므로 요일이 비어도 동작한다.
    expect(clearRecurringRules(applied(), [rule({ weekdays: [] })]).days).toEqual({})
  })

  it('규칙이 없으면 문서를 그대로 돌려준다', () => {
    const d = applied()
    expect(clearRecurringRules(d, [])).toBe(d)
  })

  it('지울 칸이 없으면 문서를 그대로 돌려준다', () => {
    const d = doc()
    expect(clearRecurringRules(d, [rule()])).toBe(d)
  })

  it('원본을 변경하지 않는다', () => {
    const d = applied()
    clearRecurringRules(d, [rule()])
    expect(Object.keys(d.days)).toHaveLength(4)
  })

  it('앞뒤 달 칸은 건드리지 않는다', () => {
    const d = doc()
    d.days['2026-07-28'] = { // 7월 화요일. 8월 격자에 보이지만 8월이 아니다.
      text: '발로란트 랭크\n21:00', dateColor: null, cellFill: null, marker: null,
    }
    expect(clearRecurringRules(d, [rule()]).days['2026-07-28'].text)
      .toBe('발로란트 랭크\n21:00')
  })
})

describe('countClearTargets', () => {
  it('실제로 비워질 칸 수를 센다', () => {
    const d = applyRecurringRules(doc(), [rule()], 'fill-empty')
    expect(countClearTargets(d, [rule()])).toBe(4)

    d.days['2026-08-11'] = { text: '손으로 고침', dateColor: null, cellFill: null, marker: null }
    expect(countClearTargets(d, [rule()])).toBe(3)
  })

  it('규칙이 없으면 0이다', () => {
    expect(countClearTargets(doc(), [])).toBe(0)
  })

  it('빈 문서면 0이다', () => {
    expect(countClearTargets(doc(), [rule()])).toBe(0)
  })
})
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npx vitest run src/model/recurring.test.ts`
Expected: FAIL — `clearRecurringRules is not a function` (import 단계에서 깨진다)

- [ ] **Step 3: 구현한다**

`src/model/recurring.ts`의 `countRuleTargets` **다음**, `const RULES_KEY` **앞**에 넣는다:

```ts
/**
 * 지울 대상이 되는 날짜와, 지운 뒤의 내용을 계산한다.
 *
 * 적용(plan)과 달리 **요일을 보지 않는다.** 규칙 요일을 나중에 바꾸면 예전에
 * 뿌려둔 칸이 판정에서 빠져 영영 안 지워지기 때문이다. 텍스트만 보면
 * "규칙이 넣은 내용은 어디 있든 지운다"가 되어 예측이 단순하다.
 *
 * 부분 일치는 보지 않는다. 손으로 한 글자라도 고친 칸은 사용자가 의도해서
 * 손댄 칸이므로 남긴다.
 */
function planClear(doc: ScheduleDoc, allRules: RecurringRule[]): Map<string, DayEntry> {
  const texts = new Set(
    allRules.map((r) => r.text.trim()).filter((t) => t !== ''),
  )
  const result = new Map<string, DayEntry>()
  if (texts.size === 0) return result

  for (const cell of buildMonthGrid(doc.year, doc.month)) {
    if (!cell.inMonth) continue

    const entry = doc.days[cell.date]
    if (entry === undefined) continue
    if (!texts.has(entry.text.trim())) continue

    result.set(cell.date, {
      // 규칙이 넣었던 것만 되돌린다. 날짜 색과 추가 문구는 규칙이 애초에
      // 건드리지 않으므로 그대로 둔다.
      text: '',
      dateColor: entry.dateColor,
      cellFill: null,
      marker: null,
      extra: entry.extra,
    })
  }
  return result
}

/**
 * 규칙이 넣은 내용과 일치하는 칸을 비운 새 문서를 만든다.
 * 비운 결과가 완전히 빈 항목이면 키 자체를 지운다.
 */
export function clearRecurringRules(doc: ScheduleDoc, rules: RecurringRule[]): ScheduleDoc {
  const cleared = planClear(doc, rules)
  if (cleared.size === 0) return doc

  const days = { ...doc.days }
  for (const [date, entry] of cleared) {
    if (isBlank(entry)) delete days[date]
    else days[date] = entry
  }
  return { ...doc, days }
}

/** 지우면 몇 칸이 바뀌는지. 버튼에 미리 보여주기 위한 것. */
export function countClearTargets(doc: ScheduleDoc, rules: RecurringRule[]): number {
  return planClear(doc, rules).size
}
```

`hasContent` 바로 다음에 짝이 되는 헬퍼를 둔다:

```ts
/** 저장할 이유가 남지 않은 항목인지. editor/controls의 isEmptyEntry와 같은 기준. */
const isBlank = (entry: DayEntry): boolean =>
  entry.text.trim() === '' &&
  entry.dateColor === null &&
  entry.cellFill === null &&
  entry.marker === null &&
  (entry.extra ?? '').trim() === ''
```

> `editor/controls.ts`의 `isEmptyEntry`와 판정이 같다. 한쪽으로 합치지 않는 이유는 `model/`이 `editor/`를 import하면 계층이 뒤집히고, 반대 방향으로 옮기려면 `controls.ts`의 UI 스타일 상수까지 `model/`로 딸려오기 때문이다. 두 곳 다 여섯 줄짜리이고 `DayEntry` 필드가 늘어날 때만 바뀐다.

- [ ] **Step 4: 통과를 확인한다**

Run: `npx vitest run src/model/recurring.test.ts`
Expected: PASS (기존 테스트 포함 전부)

- [ ] **Step 5: 전체 테스트와 빌드**

Run: `npm test`
Expected: PASS

Run: `npm run build`
Expected: 성공

- [ ] **Step 6: 커밋**

```bash
git add src/model/recurring.ts src/model/recurring.test.ts
git commit -m "feat: 반복 규칙이 뿌린 일정을 되돌리는 함수 추가"
```

---

### Task 6: 규칙 지우기 버튼

Task 5의 함수를 화면에 잇는다. 이 Task가 끝나면 기능 1이 완성된다.

**Files:**
- Modify: `src/editor/RecurringEditor.tsx`

**Interfaces:**
- Consumes: Task 5의 `clearRecurringRules`, `countClearTargets`
- Produces: 없음 (UI 종단)

- [ ] **Step 1: import를 늘린다**

`src/editor/RecurringEditor.tsx` 맨 위:

```tsx
import {
  applyRecurringRules, clearRecurringRules, countClearTargets, countRuleTargets,
  createRecurringRule, type ApplyMode, type RecurringRule,
} from '../model/recurring'
```

- [ ] **Step 2: 핸들러와 개수를 더한다**

`apply` 함수 **다음**에:

```tsx
  const clear = () => {
    const count = countClearTargets(doc, rules)
    if (count === 0) {
      setNotice('지울 칸이 없습니다. 규칙 내용과 칸의 내용이 정확히 같아야 지워집니다.')
      return
    }
    setDoc((prev) => clearRecurringRules(prev, rules))
    setNotice(`${count}칸을 비웠습니다.`)
  }
```

`overwriteCount` 줄 **다음**에:

```tsx
  const clearCount = countClearTargets(doc, rules)
```

- [ ] **Step 3: 버튼을 넣는다**

적용 버튼 두 개가 있는 `<div>` 안, `전부 덮어쓰기` 버튼 **다음**에:

```tsx
          <button type="button" style={buttonStyle} onClick={clear}>
            규칙 지우기 ({clearCount})
          </button>
```

개수가 버튼에 미리 보이므로 별도 확인 창은 두지 않는다. 0이면 누를 이유가 없고, 12면 무엇이 사라질지 알고 누른다.

- [ ] **Step 4: 안내 문구를 더한다**

`반복 일정` 섹션의 설명 `<p>` 안, 기존 문장 다음에 한 줄 더한다:

```tsx
        규칙은 다음 달로 넘어가도 그대로 남습니다.
        지우기는 칸 내용이 규칙과 정확히 같을 때만 동작합니다.
```

- [ ] **Step 5: 테스트와 빌드**

Run: `npm test`
Expected: PASS

Run: `npm run build`
Expected: 성공

- [ ] **Step 6: 눈으로 확인한다 (핵심 시나리오)**

Run: `npm run dev`

1. `반복 일정`에서 규칙 하나를 만든다 — 요일 `화`, 내용 `발로란트 랭크`
2. `빈 칸만 채우기 (4)`를 누른다 → 화요일 4칸이 채워진다
3. 아무 화요일의 `추가 문구`에 `12h`를 적는다
4. 다른 화요일의 `일정`을 `발로란트 커스텀`으로 손수 고친다
5. `규칙 지우기 (3)`를 누른다

Expected:
- 손대지 않은 화요일 3칸이 비워진다
- 4번에서 고친 칸은 `발로란트 커스텀`으로 그대로 남는다 (그래서 개수가 4가 아니라 3이다)
- 3번에서 적은 `12h`는 그 칸에 그대로 남는다 (일정만 사라지고 추가 문구는 살아있다)
- 안내에 `3칸을 비웠습니다.`가 뜬다

6. 한 번 더 `규칙 지우기`를 누른다 → `지울 칸이 없습니다.` 안내가 뜬다

- [ ] **Step 7: 커밋**

```bash
git add src/editor/RecurringEditor.tsx
git commit -m "feat: 반복 규칙 일괄 지우기 버튼 추가"
```

---

### Task 7: 수동 점검 문서 갱신

`docs/manual-checklist.md`에 두 기능의 점검 항목을 더한다.

**Files:**
- Modify: `docs/manual-checklist.md`

**Interfaces:**
- Consumes: Task 1–6 전부
- Produces: 없음

- [ ] **Step 1: `## 텍스트` 절 뒤에 추가 문구 항목을 넣는다**

`docs/manual-checklist.md`의 `## 텍스트` 절 마지막 줄(`- [ ] 최소 크기로도 안 들어갈 만큼 긴 글에는 편집 폼에 경고가 뜬다`) **다음**, `## 강조` **앞**에 넣는다:

```markdown
## 추가 문구

- [ ] `추가 문구`를 적으면 칸 아래쪽에 **본문보다 큰 글씨로** 그려진다
- [ ] **추가 문구가 비면 본문이 칸 전체를 쓴다** — 예전에 만든 일정표와 모양이 같아야 한다. 다르면 `splitCellText`가 빈 값을 못 걸러낸 것이다
- [ ] 긴 추가 문구를 넣어도 칸 크기와 격자 위치가 변하지 않고 글자만 작아진다
- [ ] 추가 문구에는 형광펜이 걸리지 않는다 (본문에만 걸린다)
```

- [ ] **Step 2: `## 강조` 절 뒤에 반복 일정 절을 넣는다**

`## 강조` 절 마지막 줄(`- [ ] `×` 버튼으로 각 강조를 없앨 수 있다`) **다음**, `## 헤더` **앞**에 넣는다:

```markdown
## 반복 일정

- [ ] 규칙을 적용하면 해당 요일 칸이 채워지고, 다음 달로 넘어가도 규칙이 남아 있다
- [ ] `규칙 지우기`를 누르면 규칙이 뿌린 칸이 비워진다
- [ ] **손으로 고친 칸은 지워지지 않는다** — 버튼의 개수도 그만큼 줄어 있어야 한다
- [ ] 지울 칸이 없을 때 누르면 안내 문구가 뜨고 아무것도 바뀌지 않는다
- [ ] 지운 뒤에도 날짜 색(공휴일 빨간 숫자)은 남아 있다
- [ ] **추가 문구가 있는 칸을 지우면 일정만 사라지고 추가 문구는 남는다**
- [ ] 규칙을 다시 적용해도 그 칸의 추가 문구가 살아남는다
```

- [ ] **Step 3: `## 저장` 절에 한 줄 더한다**

`- [ ] 새로고침해도 입력한 내용이 남아 있다` **다음**에:

```markdown
- [ ] 새로고침해도 추가 문구가 남아 있다
```

- [ ] **Step 4: `## 이미지 내보내기` 절에 한 줄 더한다**

`- [ ] 자동 축소된 텍스트가 화면과 같은 크기로 나온다` **다음**에:

```markdown
- [ ] 추가 문구가 결과 이미지에 미리보기와 같은 위치·크기로 나온다
```

- [ ] **Step 5: 커밋**

```bash
git add docs/manual-checklist.md
git commit -m "docs: 일괄 지우기와 추가 문구 점검 항목 추가"
```

---

## 완료 조건

- [ ] `npm test` 전부 통과
- [ ] `npm run build` 타입 오류 없음
- [ ] Task 6 Step 6의 시나리오가 브라우저에서 그대로 동작
- [ ] 추가 문구가 없는 예전 일정표를 열었을 때 모양이 변하지 않음
- [ ] PNG 내보내기에 추가 문구가 포함됨
