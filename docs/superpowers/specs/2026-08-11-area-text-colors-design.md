# 영역별 글자색 + 배경 밝기 자동 전환 — 설계

작성일: 2026-08-11

## 1. 개요

두 가지를 함께 다룬다. 뒤엣것은 앞엣것의 자동 모드라 떼어낼 수 없다.

1. **글자색을 영역별로 정한다.** 지금은 `theme.bodyText` 하나를 사이드바 상자 3개와 달력이 같이 쓴다.
2. **배경 이미지가 어두우면 글자를 밝게, 밝으면 어둡게 자동으로 바꾼다.**

영역은 **5개** — 제목 · 목표 상자 · 할 일 상자 · 메모 상자 · 달력.

## 2. 결정된 사항

| 항목 | 결정 |
|---|---|
| 영역 | 5개 (제목 포함) |
| 수동과 자동의 관계 | **영역별로 「자동 / 직접」 전환.** 기본은 자동 |
| 배경 이미지가 없을 때 | **계산하지 않고 테마 기본색을 쓴다** |
| 달력 영역의 범위 | 일정 텍스트 + **평일 날짜 숫자** |
| 사이드바 상자의 범위 | 본문 + 체크 표시 + 상자 라벨 |
| 임계치 | 140 / 255 |
| 캔버스 색 전환 애니메이션 | **넣지 않는다** |

### 2.1 배경이 없으면 계산하지 않는다

이것이 가장 중요한 규칙이다.

`auto`가 항상 밝기를 계산하면, 배경 이미지가 없는 문서에서도 핑크 테마의 `#5b3a42`가 "계산 결과 어두운 색"으로 대체된다. **저장된 모든 문서의 모습이 바뀐다.**

따라서 **배경 이미지가 있을 때만 계산한다.** 없으면 `auto`는 그 영역의 기존 테마색을 그대로 쓴다. 기존 문서는 이 기능이 붙어도 한 픽셀도 안 변한다.

### 2.2 달력 영역이 평일 날짜 숫자를 포함하는 이유

`dateNumberColor()`의 마지막 폴백이 `theme.bodyText`다.

```ts
if (!cell.inMonth)     return theme.outsideMonthText
if (entry?.dateColor)  return entry.dateColor
if (cell.dow === 0)    return theme.sundayText
if (cell.dow === 6)    return theme.saturdayText
return theme.bodyText          // 평일 날짜 숫자
```

일정 텍스트만 바꾸면 어두운 사진 위에서 **일정 글자는 밝아지는데 평일 날짜 숫자는 어두운 채로 남아 안 보인다.** 지키려던 것은 「일요일 빨강 · 토요일 파랑 · 날짜별 지정색」이지 평일 숫자가 아니다.

따라서 **마지막 폴백만 영역 색으로 바꾸고 앞의 네 줄은 건드리지 않는다.**

## 3. 데이터

`ScheduleDoc`에 필드 하나를 더한다.

```ts
export type TextColorArea = 'title' | 'goal' | 'todo' | 'memo' | 'calendar'

export type TextColorSetting = {
  /** 'auto'면 배경 밝기로 정한다. 배경 이미지가 없으면 테마 기본색을 쓴다. */
  mode: 'auto' | 'manual'
  /** mode가 'manual'일 때만 의미가 있다. */
  color: string | null
}

/** 없으면 전 영역 { mode: 'auto', color: null }로 채운다. */
textColors?: Record<TextColorArea, TextColorSetting>
```

`extra`·`icon`과 같이 **선택 필드**로 선언한다. `migrateDoc`이 없는 문서에 기본값을 채우며, 필수로 선언하면 타입이 런타임 값과 어긋난다.

사용자가 색을 고르면 그 영역만 `mode: 'manual'`이 된다. 「자동으로 되돌리기」 버튼이 `mode: 'auto'`로 돌린다.

## 4. 밝기 계산

### 4.1 순수 함수

`src/model/luminance.ts`. React를 모른다.

```ts
/** 0.299R + 0.587G + 0.114B. ImageData를 간격 샘플링해 평균을 낸다. */
regionLuminance(data: ImageData): number

/** 배경 이미지 위에 알파 배경색이 덮이는 것을 반영한 실효 밝기. */
blendLuminance(imageLuma: number, overlayColor: string, opacity: number): number

/** 임계치보다 밝으면 'dark'(어두운 글자), 아니면 'light'. */
pickTextTone(luma: number, threshold = 140): 'dark' | 'light'
```

**샘플링**: 영역마다 최대 약 2000픽셀만 읽는다. `step = max(1, floor(sqrt(픽셀수 / 2000)))`로 격자 간격을 잡는다. 4000×2250 전체를 다 읽으면 900만 픽셀이라 배경을 바꿀 때마다 눈에 띄게 멈춘다.

### 4.2 불투명도를 반드시 반영한다

**글자는 배경 이미지 위에 바로 얹히지 않는다.** 사이에 알파가 들어간 테마 배경색이 있다.

```
실효 밝기 = 이미지 밝기 × (1 − 불투명도) + 덮는 색 밝기 × 불투명도
```

이걸 빼먹으면 기능이 틀린다. 불투명도가 1이면 배경 이미지는 **아예 안 보이는데**, 이미지 밝기로 글자색을 정하면 어두운 사진을 깔았다는 이유로 흰 배경 위에 흰 글자가 나온다.

영역별로 덮는 것이 다르다.

| 영역 | 덮는 색 | 불투명도 |
|---|---|---|
| 제목 | **없음** — `TitleBar`에 배경이 없어 이미지가 그대로 비친다 | 적용 안 함 |
| 목표 · 할 일 · 메모 | `theme.cellBackground` (`SidebarBox`) | `doc.sidebarOpacity` |
| 달력 | `theme.cellBackground` (`DayCell`) | `doc.gridOpacity` |

### 4.3 영역 좌표

배경 이미지는 `backgroundSize: 4000×2250`으로 캔버스를 꽉 채우므로 캔버스 좌표를 이미지 크기로 비례 변환하면 된다.

```
imgX = canvasX / CANVAS_WIDTH * image.naturalWidth
```

| 영역 | 사각형 |
|---|---|
| 제목 | `(OUTER_PADDING, OUTER_PADDING, SIDEBAR_WIDTH, TITLE_ROW_HEIGHT)` |
| 상자 3개 | `sidebarBoxRects(header)` — 아래 참고 |
| 달력 | `(CELL_AREA_X, CELL_AREA_Y, CELL_AREA_WIDTH, CELL_AREA_HEIGHT)` |

**달력 사각형은 앞 문서가 추가하는 상수를 그대로 쓴다.** 10장 참고.

**`sidebarBoxRects`를 `layout.ts`로 끌어낸다.** 상자 높이는 켜진 상자에 따라 비율이 재분배되는데(`GOALS_BOX_RATIO` 0.38 / `TODO_BOX_RATIO` 0.34 / `MEMO_BOX_RATIO` 0.28), 그 계산이 지금 `Sidebar.tsx` 안에 지역 함수 `heightOf`로 들어 있다. 밝기 측정이 같은 계산을 따로 하면 **두 번째 계산이 생겨 조용히 어긋난다.** `layout.ts`로 옮기고 `Sidebar.tsx`가 그것을 쓰게 한다.

### 4.4 어떤 색을 고르는가

`Theme`에 **두 값**을 더한다. 테마 분위기를 유지하면서 양쪽 극을 모두 갖는다.

```ts
/** 밝은 배경 위에 얹을 어두운 글자색. */
autoTextOnLight: string
/** 어두운 배경 위에 얹을 밝은 글자색. */
autoTextOnDark: string
```

- **밝은 배경(`tone === 'dark'`)** → `theme.autoTextOnLight`
- **어두운 배경(`tone === 'light'`)** → `theme.autoTextOnDark`

**한 값만 두면 다크 테마에서 깨진다.** 「밝은 배경이면 기존 테마색」으로 하면 다크 테마의 `bodyText`가 이미 밝은 색이라, 밝은 사진 위에 밝은 글자가 나온다. 양쪽 극이 다 필요하다.

**값을 정하는 규칙** — 파스텔·화이트 4종은 `autoTextOnLight`를 기존 `bodyText`와 같게 둔다. 밝은 사진을 깔아도 지금과 같은 모습이 나오고, 2.1절의 「배경이 없으면 테마 기본색」과도 이어진다. **다크 테마만 `autoTextOnLight`를 새로 정한다** — 지금 어두운 글자가 없기 때문이다. `autoTextOnDark`는 5종 모두 새로 정한다.

`headerText`와 `bodyText`는 지금 5개 테마에서 모두 같은 값이므로 제목도 같은 쌍을 쓴다. 나중에 둘이 갈라지면 이 쌍도 둘로 나눠야 한다.

## 5. 흐름

```
App
 ├ useAutoTextColors(backgroundUrl, theme, header, gridOpacity, sidebarOpacity)
 │    → Record<TextColorArea, string> | null      (실패하거나 배경이 없으면 null)
 ├ doc.textColors와 합쳐 영역별 최종 색 5개를 정한다
 └ ScheduleCanvas에 resolvedTextColors로 넘긴다
```

**`preview/`는 아무것도 모른다.** 이미 해석이 끝난 색 5개만 받는다. `fontFamily`·`backgroundUrl`을 넘기는 것과 같은 방식이라 「`preview/` 컴포넌트는 `ScheduleDoc`만 받는다」는 규칙의 기존 예외와 성격이 같다.

해석 규칙:

```
manual  → doc.textColors[area].color
auto    → 계산 결과가 있으면 그것, 없으면 테마 기본색
```

**재계산 시점**: 배경 이미지가 바뀌면 이미지를 다시 샘플링한다. 불투명도나 테마만 바뀌면 **샘플링 결과는 캐시하고 `blendLuminance`만 다시 돈다.** 상자 on/off가 바뀌면 사각형이 달라지므로 다시 샘플링한다.

## 6. 실패 처리

`getImageData`가 실패하면 `null`을 돌려 테마 기본색으로 떨어진다.

**이 프로젝트에 CORS 문제는 없다.** 배경 이미지는 IndexedDB에 저장된 사용자 업로드 파일이고, `useAssetUrl`이 **data URL로 변환해서** 쓴다(`html-to-image`가 내보내기 시점에 blob URL을 못 읽는 경우가 있어서다 — `useAssetUrl.ts` 주석). 외부 URL 배경도 프리셋 이미지도 없어 캔버스가 오염될 경로가 없다.

따라서 실패 원인은 **손상된 파일 · 디코딩 실패**다. 폴백은 그대로 두되 이유가 다르다.

## 7. 색 전환 애니메이션

**캔버스에는 넣지 않는다.**

`preview/`의 DOM이 곧 내보내기 대상이다. 색이 전환되는 중에 내보내면 **중간 색이 PNG에 그대로 박힌다.** 그리고 배경 이미지 자체는 즉시 바뀌는데 글자만 늦게 따라가면 오히려 어색하다.

전환은 **편집 패널의 색상 미리보기 견본에만** 넣는다. `editor/`에는 이 제약이 없다.

## 8. 편집 UI

「꾸미기」 탭에 **「글자색」 섹션 하나**를 둔다. 5영역을 나란히 놓고 각각 자동/직접 토글과 색 고르기를 준다.

목표·할 일·메모가 「사이드바」 탭과 관련이 깊지만 한곳에 모은다 — 5영역을 **서로 비교하면서** 정하는 일이라 흩어 놓으면 탭을 오가야 한다.

## 9. 검증

### 9.1 자동

| 파일 | 내용 |
|---|---|
| `luminance.test.ts` | 공식(순백 255, 순흑 0, 순록이 순청보다 밝음), 샘플링 간격이 커도 평균이 크게 안 틀림, `blendLuminance`가 불투명도 0·1에서 각각 이미지·덮는 색과 일치, 임계치 경계값 139/140/141 |
| `layout.test.ts` | `sidebarBoxRects`가 켜진 상자 수에 따라 세로를 나눠 갖고, 합이 `SIDEBAR_HEIGHT`를 넘지 않음. 0개·1개·3개 |
| `Sidebar.test.tsx` | `Sidebar`가 `sidebarBoxRects`와 같은 높이로 그리는지 (4.3절의 두 계산이 갈라지는 것을 막는 그물) |
| `storage.test.ts` | `textColors`가 없는 예전 문서가 전 영역 `auto`로 채워져 읽힘 |
| `textColors.test.ts` | `manual`이 `auto`를 이김, 배경이 없으면 `auto`가 테마 기본색, 계산 실패 시 테마 기본색 |
| `textColors.test.ts` | **다크 테마 + 밝은 배경 → 어두운 글자.** 4.4절에서 한 값만 뒀을 때 깨지던 경우 |
| `themes.test.ts` | 5개 테마 모두 `autoTextOnLight`·`autoTextOnDark`를 갖고, 두 값의 밝기가 임계치를 사이에 두고 갈림 |
| `DayCell.test.ts` | 영역 색이 일정 텍스트와 **평일 날짜 숫자**에만 닿고, 일요일·토요일·`entry.dateColor`·앞뒤 달은 안 바뀜 |

### 9.2 수동 (`docs/manual-checklist.md`에 추가)

1. 어두운 사진과 밝은 사진을 각각 올려 5영역이 알맞게 바뀌는지
2. **불투명도를 1로 올렸을 때 글자색이 테마 기준으로 돌아오는지** — 4.2절의 핵심이다
3. 왼쪽이 어둡고 오른쪽이 밝은 사진에서 사이드바와 달력이 따로 판정되는지
4. 배경 이미지가 없는 저장된 지난 달을 열어 **모습이 그대로인지** (2.1절)
5. 손상된 파일을 올렸을 때 테마 기본색으로 떨어지는지
6. 한 영역을 직접 색으로 바꾼 뒤 배경을 갈아도 그 영역만 유지되는지

## 10. 알려진 제약

| 항목 | 내용 |
|---|---|
| **밑줄과 체크박스 테두리는 안 바뀐다** | 목표 상자의 밑줄 3줄과 체크박스 네모는 `theme.cellBorder`다. 글자만 밝아지고 선은 어두운 채로 남는다. 선까지 따라가게 하면 「글자색 기능」이 아니라 「테마 자동 반전」이 되어 범위가 훨씬 커진다 |
| 상자 힌트 문구 | 비어 있을 때만 보이는 안내다. `theme.outsideMonthText`를 그대로 쓴다 |
| 배지 글자 | 자기 배경색(`dowHeaderBackground`) 위에 있어 배경 이미지 밝기와 상관이 적다. 제외 |
| 요일 헤더 글자 | 같은 이유로 제외 |
| 앞뒤 달 흐린 숫자 | `outsideMonthText` 유지 |
| 칸 배경 채우기가 반영되지 않는다 | 영역 평균이라 `cellFill`을 칠한 칸 하나하나는 계산에 안 들어간다 |
| 영역 안이 반씩 밝고 어두운 사진 | 평균으로 판정하므로 한쪽이 안 보일 수 있다. 그때는 직접 고르면 된다 |

## 11. 앞 문서와의 관계

[`2026-08-11-cell-click-editing-design.md`](2026-08-11-cell-click-editing-design.md)가 추가하는 `CELL_AREA_X / Y / WIDTH / HEIGHT`를 달력 영역의 밝기 측정 사각형으로 재사용한다(4.3절). **그 문서를 먼저 구현한다.** 순서가 바뀌면 이 문서가 같은 상수를 직접 추가해야 한다.

「글자색」 섹션이 들어갈 「꾸미기」 탭도 그 문서가 만든다.
