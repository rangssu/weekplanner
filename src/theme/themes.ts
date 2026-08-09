import { DEFAULT_THEME_ID } from '../model/defaults'

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
    // 파스텔 테마들과 달리 바탕이 무채색인 기본형. 어떤 일러스트·스티커와도
    // 부딪히지 않고, 인쇄하거나 다른 곳에 얹기에도 무난하다.
    id: 'white',
    name: '화이트',
    pageBackground: '#ffffff',
    borderColor: '#3f3f46',
    headerText: '#18181b',
    cellBackground: '#ffffff',
    cellBorder: '#d4d4d8',
    bodyText: '#27272a',
    outsideMonthText: '#d4d4d8',
    sundayText: '#c0392b',
    saturdayText: '#2563eb',
    dowHeaderBackground: '#f4f4f5',
    dowHeaderText: '#27272a',
    accents: ['#ffe0e6', '#fff3c4', '#d9f2d0', '#d3e6fb', '#e6dcf7', '#ffe2cc'],
  },
  {
    id: 'pink',
    name: '핑크',
    pageBackground: '#f9c9d4',
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
    borderColor: '#5a5f7d',
    headerText: '#f2f3f8',
    cellBackground: '#2b2e42',
    cellBorder: '#8a90b5',
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
