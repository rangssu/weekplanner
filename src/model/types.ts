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

export type HeaderConfig = {
  /** auto = "8월"처럼 월 이름, custom = 자유 입력 */
  titleMode: 'auto' | 'custom'
  customTitle: string
  /** 오른쪽 위 영문 월 이름(AUGUST) 표기 여부 */
  showEnglishMonth: boolean
  /** 이번 달의 목표 — 길이는 항상 GOAL_LINE_COUNT */
  goals: { enabled: boolean; lines: string[] }
  /** 주요 할 일 */
  todo: { enabled: boolean; items: TodoItem[] }
  /** 우선순위 — 자유 텍스트 */
  priorities: { enabled: boolean; text: string }
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
  stickers: Sticker[]
}
