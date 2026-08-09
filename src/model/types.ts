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
  /**
   * 일정 텍스트 아래에 따로 얹는 문구. 없거나 비면 그리지 않는다.
   *
   * 선택 필드인 이유: storage의 migrateDoc이 days를 통째로 캐스팅해 넘기므로,
   * 이 필드가 없는 예전 문서가 그대로 읽힌다. 필수로 선언하면 타입이
   * 실제 런타임 값과 어긋난다.
   */
  extra?: string
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

/** 사이드바 GOALS 칸. 밑줄 위에 한 줄씩 적는다. */
export const GOAL_LINE_COUNT = 3

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

/** 한 달치 문서. 저장 단위이자 preview/의 유일한 입력. */
export type ScheduleDoc = {
  version: 1
  year: number
  /** 1-12 */
  month: number
  header: HeaderConfig
  /** 키는 "2026-08-03" 형식. 해당 월의 날짜만 담는다. */
  days: Record<string, DayEntry>
  themeId: string
  fontId: string
  /** IndexedDB 에셋 참조. null이면 테마 기본 배경. */
  backgroundAssetId: string | null
  /**
   * 달력 칸 배경 불투명도. 1이면 지금과 같고, 0이면 배경 이미지가 그대로 비친다.
   * 글자와 격자선은 이 값과 무관하게 항상 또렷하다.
   */
  gridOpacity: number
  /** 사이드바 박스 배경 불투명도. */
  sidebarOpacity: number
  stickers: Sticker[]
}
