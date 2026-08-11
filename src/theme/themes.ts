import { DEFAULT_THEME_ID } from '../model/defaults'
import { MAX_CELL_BORDER_WIDTH } from '../preview/layout'

export const ACCENT_COUNT = 6

export type Theme = {
  id: string
  name: string
  /** 캔버스 전체 바탕 */
  pageBackground: string
  /** 격자와 캔버스 테두리 */
  borderColor: string
  /** 제목·년월 글자색 */
  headerText: string
  /** 날짜 칸 바탕 */
  cellBackground: string
  cellBorder: string
  /**
   * 칸 사이 구분선 두께. 격자 바깥 테두리는 이 값을 쓰지 않는다.
   *
   * 어두운 바탕에서는 얇은 선이 축소될 때 뭉개져, 색을 아무리 밝혀도
   * 한계가 있다. 그래서 다크만 두껍게 둔다.
   *
   * 구분선은 칸 안쪽으로 들어가므로 이 값을 바꿔도 칸의 바깥 크기와 격자
   * 기하는 그대로다. 바깥 테두리까지 두껍게 하면 격자 안쪽 높이가 줄어
   * 마지막 주가 잘리므로 그쪽은 건드리지 않는다.
   * 최댓값은 layout.ts의 MAX_CELL_BORDER_WIDTH와 맞춰야 한다.
   */
  cellBorderWidth: number
  /** 일정 텍스트 색 */
  bodyText: string
  /** 앞뒤 달 날짜의 흐린 색 */
  outsideMonthText: string
  sundayText: string
  saturdayText: string
  dowHeaderBackground: string
  dowHeaderText: string
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
  /** 칸 채우기·형광펜·날짜 색으로 고를 수 있는 색. 정확히 ACCENT_COUNT개. */
  accents: string[]
}

/**
 * 이 배열의 순서가 곧 테마 고르는 칸의 표시 순서다.
 *
 * **파스텔 3종을 앞에, 무채색 2종을 뒤에** 둔다. 고르는 칸이 3열이라
 * 이 순서가 그대로 「핑크·크림·민트 / 화이트·다크」 두 줄로 떨어진다.
 * 성격이 다른 테마가 한 줄에 섞이지 않아야 눈으로 훑기 쉽다.
 */
export const THEMES: Theme[] = [
  {
    id: 'pink',
    name: '핑크',
    pageBackground: '#f9c9d4',
    borderColor: '#5b3a42',
    headerText: '#5b3a42',
    cellBackground: '#fdf4f6',
    cellBorder: '#5b3a42',
    cellBorderWidth: 3,
    bodyText: '#5b3a42',
    outsideMonthText: '#c9a7b0',
    sundayText: '#e2445c',
    saturdayText: '#4a7bd0',
    dowHeaderBackground: '#f7a8bd',
    dowHeaderText: '#ffffff',
    autoTextOnLight: '#5b3a42',
    autoTextOnDark: '#fff2f6',
    accents: ['#ffd6e0', '#ffe9a8', '#c9ecc3', '#c5ddf7', '#e3d0f5', '#ffd2b3'],
  },
  {
    id: 'cream',
    name: '크림',
    pageBackground: '#f5eddf',
    borderColor: '#4a4238',
    headerText: '#3d362c',
    cellBackground: '#fffdf8',
    cellBorder: '#4a4238',
    cellBorderWidth: 3,
    bodyText: '#3d362c',
    outsideMonthText: '#bcb2a2',
    sundayText: '#c94f3d',
    saturdayText: '#4a6fa5',
    dowHeaderBackground: '#e3d5bd',
    dowHeaderText: '#3d362c',
    autoTextOnLight: '#3d362c',
    autoTextOnDark: '#fdf8ef',
    accents: ['#ffe0b8', '#fff2b8', '#d9ecc6', '#c9e0ec', '#e6d5ef', '#f7cfc4'],
  },
  {
    id: 'mint',
    name: '민트',
    pageBackground: '#cfeee6',
    borderColor: '#2f5b53',
    headerText: '#2f5b53',
    cellBackground: '#f6fffc',
    cellBorder: '#2f5b53',
    cellBorderWidth: 3,
    bodyText: '#2f5b53',
    outsideMonthText: '#a5c6bf',
    sundayText: '#d9534f',
    saturdayText: '#3f7bb5',
    dowHeaderBackground: '#8fd3c3',
    dowHeaderText: '#1f4a42',
    autoTextOnLight: '#2f5b53',
    autoTextOnDark: '#f2fbf7',
    accents: ['#c5f0e3', '#fff3bf', '#ffd6d6', '#cfe3ff', '#e6d9ff', '#ffe1c2'],
  },
  {
    // 여기부터 무채색 두 종. 파스텔과 달리 바탕에 색이 없어 어떤 일러스트·
    // 스티커와도 부딪히지 않고, 인쇄하거나 다른 곳에 얹기에도 무난하다.
    id: 'white',
    name: '화이트',
    pageBackground: '#ffffff',
    borderColor: '#3f3f46',
    headerText: '#18181b',
    cellBackground: '#ffffff',
    cellBorder: '#d4d4d8',
    cellBorderWidth: 3,
    bodyText: '#27272a',
    outsideMonthText: '#d4d4d8',
    sundayText: '#c0392b',
    saturdayText: '#2563eb',
    dowHeaderBackground: '#f4f4f5',
    dowHeaderText: '#27272a',
    autoTextOnLight: '#27272a',
    autoTextOnDark: '#ffffff',
    accents: ['#ffe0e6', '#fff3c4', '#d9f2d0', '#d3e6fb', '#e6dcf7', '#ffe2cc'],
  },
  {
    id: 'dark',
    name: '다크',
    pageBackground: '#1f2130',
    borderColor: '#5a5f7d',
    headerText: '#f2f3f8',
    cellBackground: '#2b2e42',
    // 어두운 바탕에서는 얇은 선이 축소될 때 뭉개진다. 밝기만 올려서는
    // 한계가 있어 두께까지 함께 올린다.
    cellBorder: '#c6cbdd',
    cellBorderWidth: MAX_CELL_BORDER_WIDTH,
    bodyText: '#e7e9f2',
    outsideMonthText: '#666b87',
    sundayText: '#ff8a8a',
    saturdayText: '#8ab6ff',
    dowHeaderBackground: '#3a3e58',
    dowHeaderText: '#f2f3f8',
    autoTextOnLight: '#1c1c1f',
    autoTextOnDark: '#e7e9f2',
    accents: ['#5c3f5e', '#5e563a', '#3a5a4c', '#3a4b6b', '#4b3f6b', '#6b4a3a'],
  },
]

export function getTheme(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES.find((t) => t.id === DEFAULT_THEME_ID)!
}

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
