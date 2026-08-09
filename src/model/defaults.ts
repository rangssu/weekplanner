import { BOX_DEFAULTS, GOAL_LINE_COUNT, type DayEntry, type ScheduleDoc } from './types'

export const DOC_VERSION = 1 as const

/** Task 6에서 themes.ts가 이 id를 반드시 제공해야 한다. */
export const DEFAULT_THEME_ID = 'white'
/** theme/fonts.ts의 BUILTIN_FONTS가 이 id를 반드시 제공해야 한다. */
export const DEFAULT_FONT_ID = 'cafe24dongdong'

export function createEmptyDayEntry(): DayEntry {
  return { text: '', dateColor: null, cellFill: null, marker: null }
}

/**
 * 더 이상 저장할 이유가 없는 항목인지 판정하는 단 하나의 기준.
 *
 * text/dateColor/cellFill/marker/extra/icon 여섯 필드가 전부 비어야 blank다.
 * updateDay(controls.ts)와 clearRecurringRules(recurring.ts) 둘 다 이 기준으로
 * 문서에서 키를 지울지 정한다. 두 곳이 각자 조건을 손으로 베껴 쓰면 한쪽만
 * 고쳐질 위험이 있으므로 정의를 여기 하나로 모은다. DayEntry에 필드를
 * 추가하면 이 함수도 함께 고려해야 한다.
 */
export function isBlankDayEntry(entry: DayEntry): boolean {
  return (
    entry.text.trim() === '' &&
    entry.dateColor === null &&
    entry.cellFill === null &&
    entry.marker === null &&
    (entry.extra ?? '').trim() === '' &&
    (entry.icon ?? '').trim() === ''
  )
}

export function createEmptyDoc(year: number, month: number): ScheduleDoc {
  return {
    version: DOC_VERSION,
    year,
    month,
    header: {
      titleMode: 'auto',
      customTitle: '',
      goals: {
        enabled: true,
        ...BOX_DEFAULTS.goals,
        lines: Array.from({ length: GOAL_LINE_COUNT }, () => ''),
      },
      todo: { enabled: true, ...BOX_DEFAULTS.todo, items: [] },
      memo: { enabled: true, ...BOX_DEFAULTS.memo, text: '' },
    },
    days: {},
    themeId: DEFAULT_THEME_ID,
    fontId: DEFAULT_FONT_ID,
    backgroundAssetId: null,
    gridOpacity: 1,
    sidebarOpacity: 1,
    stickers: [],
  }
}
