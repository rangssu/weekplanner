# 레이아웃·테마 조정 4종 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 달력 칸을 세로로 키우고, 다크 테마 격자선을 뚜렷하게 하고, 배경 이미지 위에서 달력 투명도를 조절할 수 있게 하고, 사이드바 박스 제목을 편집할 수 있게 한다.

**Architecture:** 네 가지가 독립적이지만 두 개가 `preview/`의 같은 파일을 만진다. 레이아웃 재배치를 먼저 끝내 치수를 확정한 뒤 나머지를 얹는다. 투명도는 배경색에만 알파를 씌우는 순수 함수 하나(`withAlpha`)로 처리해, 알파가 1일 때 지금 결과물과 문자열 단위로 같게 만든다.

**Tech Stack:** React 18, TypeScript 5.6, Vite 7, Vitest 3 (jsdom)

## Global Constraints

- 설계 문서: `docs/superpowers/specs/2026-08-09-layout-and-theme-adjustments-design.md`
- 테스트: `npm test` (= `vitest run`). 단일 파일은 `npx vitest run src/경로/파일.test.ts`
- 타입 검사 포함 빌드: `npm run build` (= `tsc -b && vite build`)
- **`DOC_VERSION`은 올리지 않는다.** `migrateDoc`이 모든 필드를 개별 검증하므로 버전을 올리면 되살릴 수 있는 문서를 버리게 된다.
- **`MONTH_NAMES_EN`은 지우지 않는다.** `editor/MonthPicker.tsx:51`이 아직 쓴다. `TitleBar`에서만 쓰지 않게 한다.
- 투명도 기본값은 **1**이고, 이때 렌더링 결과가 지금과 **완전히 같아야** 한다. `withAlpha`가 알파 1이면 원본 문자열을 그대로 돌려주는 이유다.
- 다크 테마 `cellBorder`는 정확히 **`#8a90b5`**. `borderColor`(`#5a5f7d`)는 건드리지 않는다.
- 새 치수: `SIDEBAR_HEIGHT = 1878`, `GRID_AREA_HEIGHT = 2070`, `CELL_HEIGHT = 329`, `CELL_TEXT_HEIGHT = 249`
- 사이드바 박스 제목이 비면 기본값으로 복귀, **배지가 비면 배지를 아예 안 그린다.**
- 주석과 커밋 메시지는 한국어로 쓴다. 기존 코드가 전부 그렇다. 주석은 "왜"를 설명하고 "무엇"은 설명하지 않는다.

## File Structure

| 파일 | 변경 | Task |
|---|---|---|
| `src/model/types.ts` | `showEnglishMonth` 제거 / 박스 `label`·`badge` / 투명도 2개 | 1, 4, 6 |
| `src/model/defaults.ts` | 위 셋에 맞춰 기본값 | 1, 4, 6 |
| `src/model/storage.ts` | `mergeHeader`·`migrateDoc` 필드 정리 | 1, 4, 6 |
| `src/preview/layout.ts` | 세로 상수 분리, `TITLE_EN_SIZE` 제거, 제목 크기 단계 | 1, 2 |
| `src/preview/TitleBar.tsx` | 영문 월 이름 제거 | 1 |
| `src/preview/ScheduleCanvas.tsx` | 제목을 왼쪽 열 안으로 | 2 |
| `src/preview/Sidebar.tsx` | `SIDEBAR_HEIGHT` / 제목·배지 전달 / 투명도 전달 | 2, 4, 6 |
| `src/preview/SidebarBox.tsx` | 배지 빈 값 처리 / 배경 알파 | 4, 6 |
| `src/preview/CalendarGrid.tsx` | 요일 행 배경 알파 | 6 |
| `src/preview/DayCell.tsx` | 칸 배경 알파 | 6 |
| `src/theme/themes.ts` | 다크 `cellBorder` / `withAlpha` | 3, 5 |
| `src/editor/HeaderEditor.tsx` | 토글 제거 / 제목·배지 입력칸 | 1, 4 |
| `src/editor/BackgroundPicker.tsx` | 투명도 슬라이더 2개 | 7 |
| `docs/manual-checklist.md` | 점검 항목 | 8 |

새 파일은 만들지 않는다.

**Task 순서의 이유:** Task 1(AUGUST 제거)이 Task 2의 제약(제목이 900px 열에 갇힘)을 미리 없앤다. Task 2가 치수를 확정한다. Task 3·4는 독립적이라 아무 때나 되지만 투명도(5~7)보다 먼저 둬서, 투명도를 눈으로 확인할 때 레이아웃과 제목이 최종 모양이도록 한다.

---

### Task 1: AUGUST 영문 월 이름 제거

제목 오른쪽의 영문 월 이름 기능을 없앤다. Task 2에서 제목이 900px 열로 들어가면 둘을 나란히 둘 자리가 없다.

**Files:**
- Modify: `src/model/types.ts:42`, `src/model/defaults.ts:22`, `src/model/storage.ts:59-60`
- Modify: `src/preview/TitleBar.tsx`, `src/preview/layout.ts:64-78`
- Modify: `src/editor/HeaderEditor.tsx:59-66`
- Test: `src/preview/TitleBar.test.ts`, `src/model/defaults.test.ts`, `src/model/copyMonth.test.ts`

**Interfaces:**
- Consumes: 없음 (첫 Task)
- Produces:
  - `HeaderConfig`에서 `showEnglishMonth` 사라짐
  - `layout.ts`에서 `TITLE_EN_SIZE` 사라짐
  - `TITLE_KO_SIZE_STEPS`의 최소 크기가 `80` — Task 2가 이 값에 의존한다

- [ ] **Step 1: 실패하는 테스트로 바꾼다**

`src/preview/TitleBar.test.ts`의 import에서 `TITLE_EN_SIZE`를 뺀다:

```ts
import { TITLE_KO_SIZE, TITLE_ROW_HEIGHT } from './layout'
```

`'아무리 길어도 영문 월 이름보다는 크다'` 테스트(53행 부근)를 통째로 아래로 교체한다:

```ts
  it('아무리 길어도 최소 크기 아래로는 내려가지 않는다', () => {
    // 더 줄이면 사이드바 본문 글자(54)와 비슷해져 제목의 위계가 무너진다.
    expect(titleKoSize('가'.repeat(200))).toBe(80)
  })
```

`'가장 큰 제목도 제목 줄 높이 안에 들어간다'` 테스트(56-59행)에서 `TITLE_EN_SIZE` 줄을 지운다:

```ts
  it('가장 큰 제목도 제목 줄 높이 안에 들어간다', () => {
    expect(TITLE_KO_SIZE).toBeLessThanOrEqual(TITLE_ROW_HEIGHT)
  })
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npx vitest run src/preview/TitleBar.test.ts`
Expected: FAIL — 최소 크기가 아직 104(`TITLE_EN_SIZE + 8`)라 `toBe(80)`이 어긋난다

- [ ] **Step 3: 레이아웃 상수에서 영문 크기를 없앤다**

`src/preview/layout.ts`에서 `TITLE_EN_SIZE` 줄을 지우고, `TITLE_KO_SIZE_STEPS`를 아래로 교체한다:

```ts
export const TITLE_KO_SIZE = 130

/**
 * 제목이 길면 줄이되, 한 번에 확 줄이지 않는다.
 * 크게 줄이면 남는 세로 공간이 빈 여백으로 도드라진다.
 *
 * 제목은 사이드바 폭(900) 안에서만 그려진다. 최소 80이면 약 11자까지
 * 들어가고, 그보다 길면 말줄임표로 자른다. 더 줄이지 않는 이유는
 * 사이드바 본문 글자(BOX_TEXT_SIZE = 54)와 비슷해지면 위계가 무너지기 때문이다.
 */
export const TITLE_KO_SIZE_STEPS = [
  { maxLength: 6, size: TITLE_KO_SIZE },
  { maxLength: 10, size: 112 },
  { maxLength: Infinity, size: 80 },
] as const
```

- [ ] **Step 4: TitleBar에서 영문 블록을 지운다**

`src/preview/TitleBar.tsx`:
- `import { MONTH_NAMES_EN } from '../model/calendar'` 줄 삭제
- import에서 `TITLE_EN_SIZE` 제거
- `{header.showEnglishMonth && ( ... )}` 블록 전체 삭제
- 바깥 `<div>`의 `justifyContent: 'space-between'`과 `gap: 60` 삭제 (자식이 하나뿐이라 의미가 없다)

- [ ] **Step 5: 데이터에서 필드를 없앤다**

- `src/model/types.ts` — `HeaderConfig`의 `showEnglishMonth` 줄과 그 위 주석 삭제
- `src/model/defaults.ts` — `showEnglishMonth: true,` 줄 삭제
- `src/model/storage.ts` — `mergeHeader`의 `showEnglishMonth:` 항목 2줄 삭제

- [ ] **Step 6: 편집 UI에서 토글을 없앤다**

`src/editor/HeaderEditor.tsx`의 `<label style={checkboxRowStyle}>` 블록(59-66행, "오른쪽 위 영문 월 이름 표시")을 삭제한다.

`checkboxRowStyle`은 다른 곳에서 계속 쓰므로 남긴다.

- [ ] **Step 7: 남은 테스트를 고친다**

`src/model/defaults.test.ts:24-28` — 테스트 이름이 사실과 달라지므로 통째로 교체한다:

```ts
  it('헤더 기본값은 자동 제목이다', () => {
    expect(createEmptyDoc(2026, 8).header.titleMode).toBe('auto')
  })
```

`src/model/copyMonth.test.ts:66,75` — `showEnglishMonth`를 쓰는 두 줄을 교체한다. 이 파일은 74행에서 이미 `customTitle`을 검증하므로 **다른 필드**를 써야 검증이 늘어난다:

66행:
```ts
    src.header.goals.enabled = false
```
75행:
```ts
    expect(out.header.goals.enabled).toBe(false)
```

- [ ] **Step 8: 전체 테스트와 빌드**

Run: `npm test`
Expected: PASS

Run: `npm run build`
Expected: 성공. `MONTH_NAMES_EN`은 `MonthPicker`가 계속 쓰므로 미사용 경고가 나지 않는다.

- [ ] **Step 9: 커밋**

```bash
git add src/model/types.ts src/model/defaults.ts src/model/storage.ts src/preview/TitleBar.tsx src/preview/layout.ts src/editor/HeaderEditor.tsx src/preview/TitleBar.test.ts src/model/defaults.test.ts src/model/copyMonth.test.ts
git commit -m "feat!: 오른쪽 위 영문 월 이름 표기 제거"
```

---

### Task 2: 제목을 사이드바 열로 옮기고 달력 세로 확대

이 계획의 핵심이다. 달력이 캔버스 세로 전체를 쓰게 되어 칸이 297 → 329px가 된다.

**Files:**
- Modify: `src/preview/layout.ts:29-36`
- Modify: `src/preview/ScheduleCanvas.tsx`
- Modify: `src/preview/Sidebar.tsx:4,36,47`
- Modify: `src/preview/TitleBar.tsx`
- Test: `src/preview/layout.test.ts`

**Interfaces:**
- Consumes: Task 1의 `TITLE_KO_SIZE_STEPS` 최소 80
- Produces:
  - `layout.ts`: `BODY_HEIGHT` 사라지고 `SIDEBAR_HEIGHT`(1878) 생김, `GRID_AREA_HEIGHT`가 2070으로 바뀜
  - `CELL_HEIGHT` 297 → 329, `CELL_TEXT_HEIGHT` 217 → 249 (이름은 그대로, 값만 바뀜)

**배경 수치** (직접 계산해 확인할 것):
```
CANVAS_CONTENT_HEIGHT = 2250 − 90×2        = 2070
SIDEBAR_HEIGHT        = 2070 − 160 − 32    = 1878   (지금 BODY_HEIGHT와 같은 값)
GRID_AREA_HEIGHT      = 2070                        (지금 1878)
GRID_INNER_HEIGHT     = 2070 − 3×2         = 2064
CELL_HEIGHT           = (2064 − 90) ÷ 6    = 329
CELL_TEXT_HEIGHT      = 329 − 14×2 − 52    = 249
```

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/preview/layout.test.ts`의 import에서 `BODY_HEIGHT`를 빼고 `SIDEBAR_HEIGHT`를 넣는다:

```ts
import {
  BORDER_WIDTH, CANVAS_CONTENT_HEIGHT, CANVAS_CONTENT_WIDTH, CANVAS_HEIGHT,
  CANVAS_WIDTH, CELL_HEIGHT, CELL_TEXT_HEIGHT, CELL_TEXT_WIDTH, CELL_WIDTH, COLUMN_GAP,
  DOW_ROW_HEIGHT, GRID_AREA_HEIGHT, GRID_AREA_WIDTH, GRID_INNER_HEIGHT, GRID_INNER_WIDTH,
  OUTER_PADDING, SIDEBAR_HEIGHT, SIDEBAR_WIDTH, TITLE_GAP, TITLE_ROW_HEIGHT,
} from './layout'
```

`'세로 구성 요소의 합이 캔버스 높이와 정확히 같다'`(19-22행)를 교체한다:

```ts
  it('왼쪽 열 세로 구성 요소의 합이 캔버스 높이와 정확히 같다', () => {
    const total = OUTER_PADDING * 2 + TITLE_ROW_HEIGHT + TITLE_GAP + SIDEBAR_HEIGHT
    expect(total).toBe(CANVAS_HEIGHT)
  })
```

`'사이드바와 격자가 같은 높이를 쓴다'`(39-41행)를 교체한다:

```ts
  it('달력이 캔버스 안쪽 세로를 전부 쓴다', () => {
    // 제목이 왼쪽 열 안으로 들어갔으므로 달력은 위에서부터 끝까지 쓴다.
    expect(GRID_AREA_HEIGHT).toBe(CANVAS_CONTENT_HEIGHT)
  })

  it('사이드바는 제목 높이만큼 달력보다 짧다', () => {
    expect(GRID_AREA_HEIGHT - SIDEBAR_HEIGHT).toBe(TITLE_ROW_HEIGHT + TITLE_GAP)
  })

  it('칸이 세로로 커졌다', () => {
    // 이 변경의 목적. 297에서 329로 커진다.
    expect(CELL_HEIGHT).toBeCloseTo(329, 10)
  })
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npx vitest run src/preview/layout.test.ts`
Expected: FAIL — `SIDEBAR_HEIGHT`가 없어 import가 깨진다

- [ ] **Step 3: 레이아웃 상수를 나눈다**

`src/preview/layout.ts`의 `BODY_HEIGHT` 정의(29-30행)와 `GRID_AREA_HEIGHT` 정의(36행)를 아래로 교체한다:

```ts
/**
 * 사이드바가 쓰는 세로 공간. 제목이 왼쪽 열 위에 얹히므로 그만큼 짧다.
 *
 * 예전에는 이 값이 사이드바와 달력 모두의 높이였다(BODY_HEIGHT). 제목이
 * 왼쪽 열로 들어가면서 두 값이 갈라졌고, 이름이 값을 설명하지 못하게 되어
 * 둘로 나눴다.
 */
export const SIDEBAR_HEIGHT = CANVAS_CONTENT_HEIGHT - TITLE_ROW_HEIGHT - TITLE_GAP
```

`GRID_AREA_WIDTH` 다음 줄의 `GRID_AREA_HEIGHT`:

```ts
/** 달력은 제목에 가리지 않으므로 캔버스 안쪽 세로를 전부 쓴다. */
export const GRID_AREA_HEIGHT = CANVAS_CONTENT_HEIGHT
```

- [ ] **Step 4: 통과를 확인한다**

Run: `npx vitest run src/preview/layout.test.ts`
Expected: PASS

- [ ] **Step 5: 사이드바가 새 상수를 쓰게 한다**

`src/preview/Sidebar.tsx`에서 `BODY_HEIGHT`를 `SIDEBAR_HEIGHT`로 바꾼다 — import(4행), `heightOf`(36행), 바깥 `<div>`의 `height`(47행). 총 3곳.

값이 1878로 같으므로 **사이드바 내부 렌더링 결과는 전혀 바뀌지 않는다.**

- [ ] **Step 6: 제목이 사이드바 폭 안에 갇히게 한다**

`src/preview/TitleBar.tsx`의 바깥 `<div>` 스타일에 폭 제약을 더한다. `SIDEBAR_WIDTH`를 import한다:

```tsx
    <div
      style={{
        width: SIDEBAR_WIDTH,
        height: TITLE_ROW_HEIGHT,
        flexShrink: 0,
        display: 'flex',
        // 세로 중앙 정렬. 아래쪽 정렬로 두면 제목이 작아질 때 남는 공간이
        // 전부 위로 몰려 위쪽 여백만 도드라진다.
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
```

- [ ] **Step 7: 캔버스를 두 열로 다시 짠다**

`src/preview/ScheduleCanvas.tsx`의 import를 고치고(`BODY_HEIGHT` → `CANVAS_CONTENT_HEIGHT`, `SIDEBAR_WIDTH` 추가), `<TitleBar>`부터 `</div>`까지를 아래로 교체한다:

```tsx
        {/*
          왼쪽 열은 제목 + 사이드바, 오른쪽은 달력.
          제목을 전체 폭으로 가로지르지 않는 덕에 달력이 캔버스 세로를 다 쓴다.
        */}
        <div style={{ display: 'flex', gap: COLUMN_GAP, height: CANVAS_CONTENT_HEIGHT }}>
          <div
            style={{
              width: SIDEBAR_WIDTH,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <TitleBar header={doc.header} month={doc.month} theme={theme} />
            <div style={{ height: TITLE_GAP, flexShrink: 0 }} />
            <Sidebar header={doc.header} theme={theme} />
          </div>

          <CalendarGrid doc={doc} theme={theme} />
        </div>
```

바깥 캔버스 `<div>`의 `flexDirection: 'column'`은 그대로 둔다 — `StickerLayer`가 형제로 남는다.

- [ ] **Step 8: 전체 테스트와 빌드**

Run: `npm test`
Expected: PASS

Run: `npm run build`
Expected: 성공

- [ ] **Step 9: 눈으로 확인한다**

Run: `npm run dev`

Expected:
- 제목 「8월」이 사이드바 바로 위, 왼쪽 열 안에 있다
- 달력이 캔버스 맨 위(요일 행)부터 맨 아래까지 이어진다
- 칸이 눈에 띄게 세로로 길어졌다
- 사이드바 세 박스의 크기와 위치는 이전과 같다
- 캔버스 사방 여백이 균등하다 (개발자 도구로 확인)
- 제목을 「몬몬 8월 스케줄 특별판」처럼 길게 넣으면 말줄임표로 잘리고, 사이드바를 밀어내지 않는다

- [ ] **Step 10: 커밋**

```bash
git add src/preview/layout.ts src/preview/ScheduleCanvas.tsx src/preview/Sidebar.tsx src/preview/TitleBar.tsx src/preview/layout.test.ts
git commit -m "feat!: 제목을 사이드바 열로 옮기고 달력이 캔버스 세로를 다 쓰게 함"
```

---

### Task 3: 다크 테마 격자선 색

한 줄짜리 변경이다.

**Files:**
- Modify: `src/theme/themes.ts:103`
- Test: `src/theme/themes.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces: 없음 (값 변경)

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/theme/themes.test.ts` 파일 끝에 붙인다:

```ts
describe('다크 테마 격자선', () => {
  it('칸 배경과 충분히 대비된다', () => {
    // 어두운 배경에서는 선을 더 밝게 해야 뚜렷해진다. 더 어둡게 하면
    // 배경에 묻혀 오히려 안 보인다.
    const dark = getTheme('dark')
    expect(dark.cellBorder).toBe('#8a90b5')
    expect(dark.cellBackground).toBe('#2b2e42')
  })
})
```

`getTheme`이 이미 import되어 있는지 확인하고, 없으면 import에 더한다.

- [ ] **Step 2: 실패를 확인한다**

Run: `npx vitest run src/theme/themes.test.ts`
Expected: FAIL — `expected '#4a4f6b' to be '#8a90b5'`

- [ ] **Step 3: 값을 바꾼다**

`src/theme/themes.ts`의 dark 테마에서:

```ts
    cellBorder: '#8a90b5',
```

`borderColor: '#5a5f7d'`는 **그대로 둔다.** 편집 패널의 밝은 배경 위에 놓이는 스와치 테두리라 밝게 만들면 오히려 안 보인다.

- [ ] **Step 4: 통과를 확인한다**

Run: `npx vitest run src/theme/themes.test.ts`
Expected: PASS

- [ ] **Step 5: 전체 테스트와 빌드**

Run: `npm test`
Expected: PASS

Run: `npm run build`
Expected: 성공

- [ ] **Step 6: 커밋**

```bash
git add src/theme/themes.ts src/theme/themes.test.ts
git commit -m "fix: 다크 테마 격자선이 배경에 묻히던 문제 수정"
```

---

### Task 4: 사이드바 박스 제목·배지 편집

**Files:**
- Modify: `src/model/types.ts`, `src/model/defaults.ts`, `src/model/storage.ts`
- Modify: `src/preview/Sidebar.tsx`, `src/preview/SidebarBox.tsx`
- Modify: `src/editor/HeaderEditor.tsx`
- Test: `src/model/storage.test.ts`, `src/model/defaults.test.ts`

**Interfaces:**
- Consumes: Task 1이 정리한 `HeaderConfig`
- Produces:
  - `types.ts`: `BOX_DEFAULTS` 상수, 세 박스에 `label`·`badge` 필드
  - `SidebarBox`가 `badge`가 빈 문자열이면 배지를 렌더링하지 않는다

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/model/storage.test.ts`의 `describe('migrateDoc', ...)` 안에 붙인다:

```ts
  it('박스 제목과 배지가 없으면 기본값으로 채운다', () => {
    const old = createEmptyDoc(2026, 8) as unknown as Record<string, unknown>
    const header = old.header as Record<string, unknown>
    header.goals = { enabled: true, lines: ['', '', ''] }

    const out = migrateDoc(old)
    expect(out?.header.goals.label).toBe('이번 달의 목표')
    expect(out?.header.goals.badge).toBe('GOALS')
  })

  it('저장된 박스 제목과 배지를 그대로 살린다', () => {
    const doc = createEmptyDoc(2026, 8)
    doc.header.memo.label = '공지'
    doc.header.memo.badge = ''

    const out = migrateDoc(doc)
    expect(out?.header.memo.label).toBe('공지')
    expect(out?.header.memo.badge).toBe('')
  })
```

같은 파일 82-89행의 `'예전 이름(priorities)으로 저장된 메모를 물려받는다'` 테스트는 `toEqual`로 memo 전체를 비교하므로 필드가 늘면 깨진다. 아래로 교체한다:

```ts
  it('예전 이름(priorities)으로 저장된 메모를 물려받는다', () => {
    const old = createEmptyDoc(2026, 8) as unknown as Record<string, unknown>
    const header = old.header as Record<string, unknown>
    delete header.memo
    header.priorities = { enabled: true, text: '예전에 적어둔 내용' }

    const memo = migrateDoc(old)?.header.memo
    expect(memo?.enabled).toBe(true)
    expect(memo?.text).toBe('예전에 적어둔 내용')
  })
```

`src/model/defaults.test.ts`의 `'사이드바 세 박스는 기본으로 켜져 있다'` 테스트 **다음**에 붙인다:

```ts
  it('사이드바 박스 제목과 배지의 기본값이 있다', () => {
    const { header } = createEmptyDoc(2026, 8)
    expect(header.goals.label).toBe('이번 달의 목표')
    expect(header.goals.badge).toBe('GOALS')
    expect(header.todo.label).toBe('주요 할 일')
    expect(header.todo.badge).toBe('TO-DO LIST')
    expect(header.memo.label).toBe('메모')
    expect(header.memo.badge).toBe('MEMO')
  })
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npx vitest run src/model/storage.test.ts`
Expected: FAIL — `label`이 `DayEntry`에 없어 타입 오류, 실행하면 `undefined`

- [ ] **Step 3: 타입과 기본값을 더한다**

`src/model/types.ts`의 `HeaderConfig` 위에 상수를 두고, 세 박스에 필드를 더한다:

```ts
/** 사이드바 박스의 기본 제목. 사용자가 비우면 이 값으로 되돌아간다. */
export const BOX_DEFAULTS = {
  goals: { label: '이번 달의 목표', badge: 'GOALS' },
  todo: { label: '주요 할 일', badge: 'TO-DO LIST' },
  memo: { label: '메모', badge: 'MEMO' },
} as const

export type HeaderConfig = {
  /** auto = "8월"처럼 월 이름, custom = 자유 입력 */
  titleMode: 'auto' | 'custom'
  customTitle: string
  /** 이번 달의 목표 — lines 길이는 항상 GOAL_LINE_COUNT */
  goals: { enabled: boolean; label: string; badge: string; lines: string[] }
  /** 주요 할 일 */
  todo: { enabled: boolean; label: string; badge: string; items: TodoItem[] }
  /** 메모 — 자유 텍스트 */
  memo: { enabled: boolean; label: string; badge: string; text: string }
}
```

`src/model/defaults.ts`의 `createEmptyDoc`:

```ts
      goals: {
        enabled: true,
        ...BOX_DEFAULTS.goals,
        lines: Array.from({ length: GOAL_LINE_COUNT }, () => ''),
      },
      todo: { enabled: true, ...BOX_DEFAULTS.todo, items: [] },
      memo: { enabled: true, ...BOX_DEFAULTS.memo, text: '' },
```

import에 `BOX_DEFAULTS`를 더한다.

- [ ] **Step 4: 마이그레이션에 반영한다**

`src/model/storage.ts`의 `mergeHeader`에서, 세 박스 각각에 두 필드를 더한다. 문자열이 아니면 기본값을 쓴다:

```ts
  const text = (v: unknown, fallback: string): string =>
    typeof v === 'string' ? v : fallback

  return {
    titleMode: raw.titleMode === 'custom' ? 'custom' : 'auto',
    customTitle: typeof raw.customTitle === 'string' ? raw.customTitle : base.customTitle,
    goals: {
      enabled: typeof goals?.enabled === 'boolean' ? goals.enabled : base.goals.enabled,
      label: text(goals?.label, base.goals.label),
      badge: text(goals?.badge, base.goals.badge),
      // 줄 수가 바뀌어도 항상 GOAL_LINE_COUNT에 맞춘다.
      lines: base.goals.lines.map((fallback, i) => {
        const line = Array.isArray(goals?.lines) ? goals.lines[i] : undefined
        return typeof line === 'string' ? line : fallback
      }),
    },
    todo: {
      enabled: typeof todo?.enabled === 'boolean' ? todo.enabled : base.todo.enabled,
      label: text(todo?.label, base.todo.label),
      badge: text(todo?.badge, base.todo.badge),
      items: Array.isArray(todo?.items) ? (todo.items as HeaderConfig['todo']['items']) : [],
    },
    memo: {
      enabled: typeof memo?.enabled === 'boolean' ? memo.enabled : base.memo.enabled,
      label: text(memo?.label, base.memo.label),
      badge: text(memo?.badge, base.memo.badge),
      text: typeof memo?.text === 'string' ? memo.text : base.memo.text,
    },
  }
```

빈 문자열은 문자열이므로 그대로 살아남는다. 배지를 일부러 비운 설정이 새로고침 후에도 유지되려면 이래야 한다.

- [ ] **Step 5: 통과를 확인한다**

Run: `npx vitest run src/model/storage.test.ts`
Expected: PASS

- [ ] **Step 6: 미리보기가 저장된 값을 쓰게 한다**

`src/preview/Sidebar.tsx`의 세 `<SidebarBox>`에서 하드코딩된 `label`·`badge`를 바꾼다. 제목이 비면 기본값으로 되돌린다:

```tsx
const boxLabel = (value: string, fallback: string): string =>
  value.trim() === '' ? fallback : value
```

```tsx
        <SidebarBox
          label={boxLabel(header.goals.label, BOX_DEFAULTS.goals.label)}
          badge={header.goals.badge}
          height={heightOf(0)}
          theme={theme}
        >
```

todo(`BOX_DEFAULTS.todo.label`)와 memo(`BOX_DEFAULTS.memo.label`)도 같은 꼴로 바꾼다. import에 `BOX_DEFAULTS`를 더한다.

**배지에는 `boxLabel`을 쓰지 않는다.** 비었을 때 사라지는 것이 요구사항이다.

- [ ] **Step 7: 빈 배지를 안 그리게 한다**

`src/preview/SidebarBox.tsx`에서 배지 `<span>`을 조건부로 만든다:

```tsx
        {badge.trim() !== '' && (
          <span
            style={{
              fontSize: BOX_BADGE_SIZE,
              fontWeight: 900,
              letterSpacing: 0.5,
              color: theme.bodyText,
              background: theme.dowHeaderBackground,
              padding: '6px 14px',
              whiteSpace: 'nowrap',
            }}
          >
            {badge}
          </span>
        )}
```

제목 행의 `justifyContent: 'space-between'`은 그대로 둔다. 배지가 없으면 한글 제목이 왼쪽에 남는다.

- [ ] **Step 8: 편집 UI에 입력칸을 넣는다**

`src/editor/HeaderEditor.tsx`의 세 섹션 각각에서, 표시 체크박스 **다음**에 입력칸 두 개를 넣는다. goals 섹션 예시:

```tsx
        {header.goals.enabled && (
          <>
            <label style={{ ...fieldLabelStyle, marginTop: 8 }} htmlFor="goals-label">제목</label>
            <input
              id="goals-label"
              style={inputStyle}
              value={header.goals.label}
              placeholder={BOX_DEFAULTS.goals.label}
              onChange={(e) =>
                patchHeader({ goals: { ...header.goals, label: e.target.value } })
              }
            />
            <label style={{ ...fieldLabelStyle, marginTop: 6 }} htmlFor="goals-badge">배지</label>
            <input
              id="goals-badge"
              style={inputStyle}
              value={header.goals.badge}
              placeholder="비우면 배지가 사라집니다"
              onChange={(e) =>
                patchHeader({ goals: { ...header.goals, badge: e.target.value } })
              }
            />
          </>
        )}
```

todo·memo도 같은 꼴로 넣는다. id는 `todo-label`/`todo-badge`, `memo-label`/`memo-badge`를 쓴다.

기존의 목표 3줄·할 일 5개·메모 입력은 이 블록 **다음**에 그대로 남는다. `header.goals.enabled &&` 조건이 이미 있으므로 새 블록과 합쳐도 되고 따로 둬도 된다.

import에 `BOX_DEFAULTS`를 더한다.

각 섹션의 `<h2>` 제목(`이번 달의 목표 (GOALS)` 등)은 이제 편집 가능한 값과 어긋날 수 있으므로 고정 문구로 바꾼다: `목표 상자`, `할 일 상자`, `메모 상자`.

- [ ] **Step 9: 전체 테스트와 빌드**

Run: `npm test`
Expected: PASS

Run: `npm run build`
Expected: 성공

- [ ] **Step 10: 눈으로 확인한다**

Run: `npm run dev`

1. `목표 상자`의 `제목`을 「방송 목표」로 바꾼다 → 미리보기 제목이 바뀐다
2. `제목`을 전부 지운다 → 「이번 달의 목표」로 되돌아간다
3. `배지`를 전부 지운다 → 오른쪽 회색 배지가 **사라지고** 제목만 남는다
4. `배지`를 「PLAN」으로 바꾼다 → 배지가 다시 나오고 글자가 바뀐다
5. 새로고침 → 3번에서 비운 배지가 여전히 없다
6. 세 상자 모두에서 1~4가 동작한다

- [ ] **Step 11: 커밋**

```bash
git add src/model/types.ts src/model/defaults.ts src/model/storage.ts src/preview/Sidebar.tsx src/preview/SidebarBox.tsx src/editor/HeaderEditor.tsx src/model/storage.test.ts src/model/defaults.test.ts
git commit -m "feat: 사이드바 박스 제목과 배지를 편집할 수 있게 함"
```

---

### Task 5: `withAlpha` 헬퍼

투명도 기능의 토대. 순수 함수 하나와 테스트로 끝난다.

**Files:**
- Modify: `src/theme/themes.ts`
- Test: `src/theme/themes.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces: `export function withAlpha(hex: string, alpha: number): string` — Task 6이 쓴다

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/theme/themes.test.ts` 파일 끝에 붙인다. import에 `withAlpha`를 더한다:

```ts
describe('withAlpha', () => {
  it('알파가 1이면 원래 문자열을 그대로 준다', () => {
    // 기본값 상태에서 지금까지 만든 결과물과 문자열 단위로 같아야 회귀가 없다.
    expect(withAlpha('#2b2e42', 1)).toBe('#2b2e42')
  })

  it('알파가 1보다 커도 원래 문자열을 준다', () => {
    expect(withAlpha('#2b2e42', 1.5)).toBe('#2b2e42')
  })

  it('알파를 rgba로 바꾼다', () => {
    expect(withAlpha('#ffffff', 0.5)).toBe('rgba(255, 255, 255, 0.5)')
    expect(withAlpha('#2b2e42', 0)).toBe('rgba(43, 46, 66, 0)')
  })

  it('대문자 표기도 처리한다', () => {
    expect(withAlpha('#FFE680', 0.4)).toBe('rgba(255, 230, 128, 0.4)')
  })

  it('음수 알파는 0으로 자른다', () => {
    expect(withAlpha('#ffffff', -1)).toBe('rgba(255, 255, 255, 0)')
  })

  it('#rrggbb 꼴이 아니면 그대로 돌려준다', () => {
    // 테마 값은 전부 #rrggbb지만, 못 알아보는 값에 rgba(NaN)을 만들면
    // 색이 통째로 사라진다. 원본을 주는 쪽이 안전하다.
    expect(withAlpha('rgba(0,0,0,.5)', 0.5)).toBe('rgba(0,0,0,.5)')
    expect(withAlpha('#fff', 0.5)).toBe('#fff')
    expect(withAlpha('', 0.5)).toBe('')
  })
})
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npx vitest run src/theme/themes.test.ts`
Expected: FAIL — `withAlpha`가 없어 import가 깨진다

- [ ] **Step 3: 구현한다**

`src/theme/themes.ts`의 `getTheme` 다음에 붙인다:

```ts
/**
 * `#rrggbb`에 알파를 입혀 `rgba()`로 바꾼다.
 *
 * 알파가 1 이상이면 **원래 문자열을 그대로 돌려준다.** 투명도 기본값이 1이므로,
 * 이래야 기능을 더하기 전에 만든 결과물과 렌더링이 문자열 단위로 같아진다.
 *
 * 못 알아보는 형식도 원본을 그대로 준다. rgba(NaN, ...)을 만들면 색이 통째로
 * 사라져서, 잘못된 입력의 대가가 너무 크다.
 */
export function withAlpha(hex: string, alpha: number): string {
  if (alpha >= 1) return hex

  const match = /^#([0-9a-f]{6})$/i.exec(hex)
  if (match === null) return hex

  const value = parseInt(match[1], 16)
  const clamped = Math.max(0, alpha)
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${clamped})`
}
```

- [ ] **Step 4: 통과를 확인한다**

Run: `npx vitest run src/theme/themes.test.ts`
Expected: PASS

- [ ] **Step 5: 전체 테스트와 빌드**

Run: `npm test`
Expected: PASS

Run: `npm run build`
Expected: 성공

- [ ] **Step 6: 커밋**

```bash
git add src/theme/themes.ts src/theme/themes.test.ts
git commit -m "feat: 색에 알파를 입히는 withAlpha 추가"
```

---

### Task 6: 투명도 데이터와 렌더링

배경색에만 알파를 씌운다. 글자와 격자선은 건드리지 않는다.

**Files:**
- Modify: `src/model/types.ts`, `src/model/defaults.ts`, `src/model/storage.ts`
- Modify: `src/preview/DayCell.tsx`, `src/preview/CalendarGrid.tsx`
- Modify: `src/preview/Sidebar.tsx`, `src/preview/SidebarBox.tsx`
- Test: `src/model/storage.test.ts`

**Interfaces:**
- Consumes: Task 5의 `withAlpha`
- Produces:
  - `ScheduleDoc`에 `gridOpacity: number`, `sidebarOpacity: number` (0~1, 기본 1)
  - `DayCell`·`SidebarBox`가 `bgOpacity: number` prop을 받는다
  - Task 7의 슬라이더가 이 두 필드를 쓴다

**알파를 씌우는 대상** (설계 §4.3):

| 요소 | 색 | 슬라이더 |
|---|---|---|
| 날짜 칸 배경 | `entry.cellFill` 또는 `theme.cellBackground` | `gridOpacity` |
| 요일 행 배경 | `theme.dowHeaderBackground` | `gridOpacity` |
| 사이드바 박스 배경 | `theme.cellBackground` | `sidebarOpacity` |
| 사이드바 배지 배경 | `theme.dowHeaderBackground` | `sidebarOpacity` |

격자선·글자·형광펜·날짜 숫자 색은 **건드리지 않는다.**

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`src/model/storage.test.ts`의 `describe('migrateDoc', ...)` 안에 붙인다:

```ts
  it('투명도가 없으면 1로 채운다', () => {
    const partial = createEmptyDoc(2026, 8) as unknown as Record<string, unknown>
    delete partial.gridOpacity
    delete partial.sidebarOpacity
    const out = migrateDoc(partial)
    expect(out?.gridOpacity).toBe(1)
    expect(out?.sidebarOpacity).toBe(1)
  })

  it('저장된 투명도를 살린다', () => {
    const doc = createEmptyDoc(2026, 8)
    doc.gridOpacity = 0.4
    doc.sidebarOpacity = 0.7
    const out = migrateDoc(doc)
    expect(out?.gridOpacity).toBe(0.4)
    expect(out?.sidebarOpacity).toBe(0.7)
  })

  it('범위 밖이거나 숫자가 아닌 투명도는 1로 되돌린다', () => {
    const broken = createEmptyDoc(2026, 8) as unknown as Record<string, unknown>
    broken.gridOpacity = 5
    broken.sidebarOpacity = '반투명'
    const out = migrateDoc(broken)
    expect(out?.gridOpacity).toBe(1)
    expect(out?.sidebarOpacity).toBe(1)
  })
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npx vitest run src/model/storage.test.ts`
Expected: FAIL — `gridOpacity`가 `ScheduleDoc`에 없어 타입 오류

- [ ] **Step 3: 데이터에 필드를 더한다**

`src/model/types.ts`의 `ScheduleDoc`, `stickers` 앞에:

```ts
  /**
   * 달력 칸 배경 불투명도. 1이면 지금과 같고, 0이면 배경 이미지가 그대로 비친다.
   * 글자와 격자선은 이 값과 무관하게 항상 또렷하다.
   */
  gridOpacity: number
  /** 사이드바 박스 배경 불투명도. */
  sidebarOpacity: number
```

`src/model/defaults.ts`의 `createEmptyDoc`에서 `stickers: []` 앞에:

```ts
    gridOpacity: 1,
    sidebarOpacity: 1,
```

`src/model/storage.ts`의 `migrateDoc` 반환값에, `stickers` 앞에:

```ts
    gridOpacity: opacity(raw.gridOpacity),
    sidebarOpacity: opacity(raw.sidebarOpacity),
```

같은 파일 `isObject` 근처에 헬퍼를 둔다:

```ts
/** 0~1 범위의 숫자만 받는다. 아니면 불투명(1)으로 되돌린다. */
const opacity = (v: unknown): number =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1 ? v : 1
```

- [ ] **Step 4: 통과를 확인한다**

Run: `npx vitest run src/model/storage.test.ts`
Expected: PASS

- [ ] **Step 5: 달력에 알파를 씌운다**

`src/preview/DayCell.tsx`:
- `DayCellProps`에 `bgOpacity: number`를 더한다
- 함수 시그니처를 `{ cell, entry, theme, bgOpacity }`로 바꾼다
- 배경 줄을 바꾼다:

```tsx
        background: withAlpha(
          (cell.inMonth && entry?.cellFill) || theme.cellBackground,
          bgOpacity,
        ),
```

`withAlpha`를 `../theme/themes`에서 import한다.

`src/preview/CalendarGrid.tsx`:
- 요일 칸의 `background`를 바꾼다:

```tsx
              background: withAlpha(theme.dowHeaderBackground, doc.gridOpacity),
```

- `<DayCell>`에 prop을 넘긴다:

```tsx
          <DayCell
            key={cell.date}
            cell={cell}
            entry={doc.days[cell.date]}
            theme={theme}
            bgOpacity={doc.gridOpacity}
          />
```

- [ ] **Step 6: 사이드바에 알파를 씌운다**

`src/preview/SidebarBox.tsx`:
- `SidebarBoxProps`에 `bgOpacity: number`를 더하고 시그니처에 받는다
- 바깥 `<div>`의 `background`를 `withAlpha(theme.cellBackground, bgOpacity)`로
- 배지 `<span>`의 `background`를 `withAlpha(theme.dowHeaderBackground, bgOpacity)`로

`src/preview/Sidebar.tsx`:
- `SidebarProps`에 `bgOpacity: number`를 더하고 시그니처에 받는다
- 세 `<SidebarBox>`에 `bgOpacity={bgOpacity}`를 넘긴다

`src/preview/ScheduleCanvas.tsx`:
- `<Sidebar header={doc.header} theme={theme} bgOpacity={doc.sidebarOpacity} />`

- [ ] **Step 7: 전체 테스트와 빌드**

Run: `npm test`
Expected: PASS

Run: `npm run build`
Expected: 성공

- [ ] **Step 8: 기본값에서 결과가 안 바뀌는지 확인한다**

Run: `npm run dev`

Expected: 슬라이더가 아직 없으므로 투명도는 1이다. 미리보기가 **Task 5 이전과 완전히 같아야 한다.** 다르면 `withAlpha`가 알파 1에서 원본을 안 돌려주고 있는 것이다.

- [ ] **Step 9: 커밋**

```bash
git add src/model/types.ts src/model/defaults.ts src/model/storage.ts src/preview/DayCell.tsx src/preview/CalendarGrid.tsx src/preview/Sidebar.tsx src/preview/SidebarBox.tsx src/preview/ScheduleCanvas.tsx src/model/storage.test.ts
git commit -m "feat: 달력·사이드바 배경에 투명도를 적용한다"
```

---

### Task 7: 투명도 슬라이더

Task 6의 데이터를 화면에 잇는다. 이 Task가 끝나면 4번 요청이 완성된다.

**Files:**
- Modify: `src/editor/BackgroundPicker.tsx`

**Interfaces:**
- Consumes: Task 6의 `doc.gridOpacity`, `doc.sidebarOpacity`
- Produces: 없음 (UI 종단)

순수 UI라 단위 테스트를 새로 쓰지 않는다. 값 검증은 Task 6이, 색 계산은 Task 5가 이미 테스트했다.

- [ ] **Step 1: 슬라이더를 넣는다**

`src/editor/BackgroundPicker.tsx`의 안내 문구 `<p>` **다음**, `{error && ...}` **앞**에 넣는다:

```tsx
      {doc.backgroundAssetId && (
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 12, color: '#71717a', margin: '0 0 8px' }}>
            투명도를 낮추면 배경 그림이 비쳐 보입니다. 일정 글자와 선은 항상 또렷합니다.
          </p>
          <OpacitySlider
            id="grid-opacity"
            label="달력"
            value={doc.gridOpacity}
            onChange={(v) => setDoc((prev) => ({ ...prev, gridOpacity: v }))}
          />
          <OpacitySlider
            id="sidebar-opacity"
            label="사이드바"
            value={doc.sidebarOpacity}
            onChange={(v) => setDoc((prev) => ({ ...prev, sidebarOpacity: v }))}
          />
        </div>
      )}
```

배경 이미지가 없으면 조절할 이유가 없으므로 `doc.backgroundAssetId`가 있을 때만 보인다.

- [ ] **Step 2: 슬라이더 컴포넌트를 같은 파일에 둔다**

`BackgroundPicker` 함수 **앞**에 넣는다. 이 파일에서만 쓰므로 export하지 않는다:

```tsx
type OpacitySliderProps = {
  id: string
  label: string
  value: number
  onChange: (value: number) => void
}

function OpacitySlider({ id, label, value, onChange }: OpacitySliderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
      <label htmlFor={id} style={{ fontSize: 12, color: '#52525b', width: 56, flexShrink: 0 }}>
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={5}
        value={Math.round(value * 100)}
        style={{ flex: 1 }}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
      />
      <span
        style={{
          fontSize: 12, color: '#52525b', width: 40, flexShrink: 0, textAlign: 'right',
          // 값이 바뀔 때 폭이 흔들리면 슬라이더가 같이 움찔거린다.
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {Math.round(value * 100)}%
      </span>
    </div>
  )
}
```

5% 단위로 끊는 이유: 1% 단위는 눈으로 구분되지 않는데 드래그만 예민해진다.

- [ ] **Step 3: 테스트와 빌드**

Run: `npm test`
Expected: PASS

Run: `npm run build`
Expected: 성공

- [ ] **Step 4: 눈으로 확인한다**

Run: `npm run dev`

1. 배경 이미지가 없을 때 → 슬라이더가 **안 보인다**
2. 배경 이미지를 올린다 → 슬라이더 두 개가 나타나고 둘 다 100%다
3. `달력`을 50%로 내린다 → 달력 칸으로 배경 그림이 비치고, **일정 글자와 격자선은 그대로 또렷하다**
4. 사이드바는 아직 불투명하다
5. `사이드바`도 50%로 내린다 → 사이드바 박스도 비친다
6. 칸 배경 강조색을 준 칸도 함께 투명해진다 (그 칸만 떠 보이지 않는다)
7. `달력`을 0%로 내린다 → 칸 배경이 완전히 사라지고 선과 글자만 남는다
8. 새로고침 → 값이 유지된다
9. PNG로 내보낸다 → 이미지에도 투명도가 그대로 반영된다
10. 배경 이미지를 없앤다 → 슬라이더가 사라지고, 달력이 불투명하게 보인다

10번을 주의해서 본다. 배경을 없애면 슬라이더는 숨지만 저장된 값은 남는다. 테마 배경색 위에 반투명 칸이 얹히므로 색이 옅어 보일 수 있다.

- [ ] **Step 5: 커밋**

```bash
git add src/editor/BackgroundPicker.tsx
git commit -m "feat: 배경 이미지 위 달력·사이드바 투명도 슬라이더 추가"
```

---

### Task 8: 수동 점검 문서 갱신

**Files:**
- Modify: `docs/manual-checklist.md`

**Interfaces:**
- Consumes: Task 1–7 전부
- Produces: 없음

- [ ] **Step 1: 레이아웃 절을 고친다**

`## 레이아웃` 절의 두 항목을 아래로 교체한다. 두 번째 항목이 이제 사실이 아니다 — 제목과 격자가 더 이상 세로를 나눠 갖지 않는다:

```markdown
## 레이아웃

- [ ] **캔버스 사방 여백이 균등하다** — 개발자 도구로 재보면 확실하다. 어긋나면 `box-sizing: border-box` 요소의 테두리를 계산에서 빠뜨린 것이다
- [ ] **달력이 캔버스 안쪽 세로를 전부 쓴다** — 요일 행 위와 마지막 주 아래에 빈 틈이 없다
- [ ] 제목이 사이드바 열 안에 있고, 사이드바 폭을 넘지 않는다
- [ ] 제목 + 간격 + 사이드바 높이 합이 달력 높이와 정확히 같다
- [ ] 긴 제목을 넣어도 말줄임표로 잘릴 뿐 사이드바를 밀어내지 않는다
```

- [ ] **Step 2: 테마 절에 다크 항목을 더한다**

`## 테마 · 폰트 · 배경 · 스티커` 절의 첫 항목 다음에 넣는다:

```markdown
- [ ] **다크 테마에서 격자선이 뚜렷하게 보인다** — 결과 이미지를 1200px로 줄여도 칸 경계가 구분된다
```

- [ ] **Step 3: 투명도 절을 새로 넣는다**

`## 테마 · 폰트 · 배경 · 스티커` 절 **다음**, `## 이미지 내보내기` **앞**에 넣는다:

```markdown
## 배경 투명도

- [ ] 배경 이미지가 없으면 투명도 슬라이더가 보이지 않는다
- [ ] 배경 이미지를 올리면 슬라이더 두 개가 100%로 나타난다
- [ ] 달력 투명도를 내리면 칸으로 배경이 비치고, **일정 글자와 격자선은 또렷하게 남는다**
- [ ] 칸 배경 강조색을 준 칸도 함께 투명해진다 — 그 칸만 불투명하게 떠 보이면 잘못된 것이다
- [ ] 달력과 사이드바가 서로 독립적으로 조절된다
- [ ] 0%로 내리면 배경이 완전히 사라지고 선과 글자만 남는다
- [ ] **100%일 때 결과가 이 기능을 넣기 전과 똑같다** — 다르면 `withAlpha`가 알파 1에서 원본을 안 돌려주는 것이다
```

- [ ] **Step 4: 헤더 절에 제목 편집 항목을 더한다**

`## 헤더` 절에서 영문 월 이름 항목(`- [ ] 자동 제목이 영문 월 이름으로 나온다`)을 지우고, 절 끝에 더한다:

```markdown
- [ ] 세 상자의 제목을 바꾸면 미리보기에 반영된다
- [ ] 제목을 비우면 기본 제목(「이번 달의 목표」 등)으로 되돌아간다
- [ ] **배지를 비우면 오른쪽 회색 배지가 사라지고 제목만 남는다**
- [ ] 비운 배지가 새로고침 후에도 그대로 없다
```

- [ ] **Step 5: 내보내기 절에 한 줄 더한다**

`- [ ] 자동 축소된 텍스트가 화면과 같은 크기로 나온다` 다음에:

```markdown
- [ ] 투명도를 내린 상태가 결과 이미지에도 반영된다
```

- [ ] **Step 6: 커밋**

```bash
git add docs/manual-checklist.md
git commit -m "docs: 레이아웃 변경과 새 기능 점검 항목 갱신"
```

---

## 완료 조건

- [ ] `npm test` 전부 통과
- [ ] `npm run build` 타입 오류 없음
- [ ] 투명도 100%·기본 설정에서 결과 이미지가 Task 5 이전과 동일 (레이아웃 변경분 제외)
- [ ] 예전에 저장한 달을 열어도 깨지지 않고, 없던 필드가 기본값으로 채워진다
- [ ] PNG 내보내기에 새 레이아웃·투명도·제목이 모두 반영된다
