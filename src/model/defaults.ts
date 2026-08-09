import { GOAL_LINE_COUNT, type DayEntry, type ScheduleDoc } from './types'

export const DOC_VERSION = 1 as const

/** Task 6에서 themes.ts가 이 id를 반드시 제공해야 한다. */
export const DEFAULT_THEME_ID = 'white'
/** theme/fonts.ts의 BUILTIN_FONTS가 이 id를 반드시 제공해야 한다. */
export const DEFAULT_FONT_ID = 'cafe24dongdong'

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
      showEnglishMonth: true,
      goals: { enabled: true, lines: Array.from({ length: GOAL_LINE_COUNT }, () => '') },
      todo: { enabled: true, items: [] },
      memo: { enabled: true, text: '' },
    },
    days: {},
    themeId: DEFAULT_THEME_ID,
    fontId: DEFAULT_FONT_ID,
    backgroundAssetId: null,
    stickers: [],
  }
}
