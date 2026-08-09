import { GRID_COLUMNS, GRID_ROWS } from '../model/calendar'

/** 결과 이미지 원본 크기. 이 값을 다른 곳에 하드코딩하지 않는다. */
export const CANVAS_WIDTH = 4000
export const CANVAS_HEIGHT = 2250

export const OUTER_PADDING = 100
export const HEADER_HEIGHT = 420
export const DOW_ROW_HEIGHT = 90
export const FOOTER_HEIGHT = 100

export const GRID_WIDTH = CANVAS_WIDTH - OUTER_PADDING * 2 // 3800
export const GRID_HEIGHT =
  CANVAS_HEIGHT - OUTER_PADDING * 2 - HEADER_HEIGHT - DOW_ROW_HEIGHT - FOOTER_HEIGHT // 1440

export const CELL_WIDTH = GRID_WIDTH / GRID_COLUMNS // 542.857…
export const CELL_HEIGHT = GRID_HEIGHT / GRID_ROWS // 240

export const CELL_PADDING = 14
export const DATE_NUMBER_SIZE = 34
export const DATE_NUMBER_BLOCK = 46

/** 일정 텍스트가 쓸 수 있는 영역 */
export const CELL_TEXT_WIDTH = CELL_WIDTH - CELL_PADDING * 2
export const CELL_TEXT_HEIGHT = CELL_HEIGHT - CELL_PADDING * 2 - DATE_NUMBER_BLOCK

export const CELL_TEXT_BASE_SIZE = 44
export const CELL_TEXT_MIN_SIZE = 22
export const CELL_TEXT_LINE_HEIGHT = 1.25

export const BORDER_WIDTH = 5
export const CANVAS_BORDER_WIDTH = 10
export const CANVAS_BORDER_RADIUS = 40
