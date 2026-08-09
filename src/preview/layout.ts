import { GRID_COLUMNS, GRID_ROWS } from '../model/calendar'

/** 결과 이미지 원본 크기. 이 값을 다른 곳에 하드코딩하지 않는다. */
export const CANVAS_WIDTH = 4000
export const CANVAS_HEIGHT = 2250

export const CANVAS_BORDER_WIDTH = 0
export const BORDER_WIDTH = 3

export const OUTER_PADDING = 90

/**
 * 캔버스가 `box-sizing: border-box`라 실제로 내용이 들어갈 공간은
 * 전체 크기에서 **자신의 테두리와 패딩을 모두 뺀** 값이다.
 */
export const CANVAS_CONTENT_WIDTH = CANVAS_WIDTH - CANVAS_BORDER_WIDTH * 2 - OUTER_PADDING * 2
export const CANVAS_CONTENT_HEIGHT = CANVAS_HEIGHT - CANVAS_BORDER_WIDTH * 2 - OUTER_PADDING * 2

/**
 * 맨 위 제목 줄 — 왼쪽에 "8월", 오른쪽 끝에 "AUGUST".
 *
 * 높이를 넉넉히 잡으면 제목이 짧아질 때 남는 공간이 그대로 빈 여백으로 보인다.
 * 가장 큰 제목(TITLE_KO_SIZE)이 들어갈 만큼만 두고, 남는 세로는 격자에 넘긴다.
 */
export const TITLE_ROW_HEIGHT = 160
/** 제목 줄과 본문 사이 */
export const TITLE_GAP = 32

/** 본문(사이드바 + 격자)이 쓰는 세로 공간 */
export const BODY_HEIGHT = CANVAS_CONTENT_HEIGHT - TITLE_ROW_HEIGHT - TITLE_GAP

/** 왼쪽 사이드바와 오른쪽 격자 */
export const SIDEBAR_WIDTH = 900
export const COLUMN_GAP = 40
export const GRID_AREA_WIDTH = CANVAS_CONTENT_WIDTH - SIDEBAR_WIDTH - COLUMN_GAP
export const GRID_AREA_HEIGHT = BODY_HEIGHT

/** 테두리 안쪽. 요일 행과 날짜 칸이 실제로 나눠 쓰는 공간. */
export const GRID_INNER_WIDTH = GRID_AREA_WIDTH - BORDER_WIDTH * 2
export const GRID_INNER_HEIGHT = GRID_AREA_HEIGHT - BORDER_WIDTH * 2

export const DOW_ROW_HEIGHT = 90
export const CELL_WIDTH = GRID_INNER_WIDTH / GRID_COLUMNS
export const CELL_HEIGHT = (GRID_INNER_HEIGHT - DOW_ROW_HEIGHT) / GRID_ROWS

export const CELL_PADDING = 14
export const DATE_NUMBER_SIZE = 40
export const DATE_NUMBER_BLOCK = 52

/** 일정 텍스트가 쓸 수 있는 영역 */
export const CELL_TEXT_WIDTH = CELL_WIDTH - CELL_PADDING * 2
export const CELL_TEXT_HEIGHT = CELL_HEIGHT - CELL_PADDING * 2 - DATE_NUMBER_BLOCK

/**
 * 글자 크기는 **결과 이미지가 축소돼 보이는 상황**을 기준으로 잡는다.
 *
 * 4000px 이미지를 X 타임라인에 올리면 1200px 안팎으로 줄어 보인다.
 * 배율이 0.3이므로 캔버스의 52px는 화면에서 약 16px이 된다.
 */
export const CELL_TEXT_BASE_SIZE = 52
export const CELL_TEXT_MIN_SIZE = 26
export const CELL_TEXT_LINE_HEIGHT = 1.25

export const TITLE_KO_SIZE = 130
export const TITLE_EN_SIZE = 96

/**
 * 제목이 길면 줄이되, 한 번에 확 줄이지 않는다.
 * 크게 줄이면 남는 세로 공간이 빈 여백으로 도드라지고, 영문 월 이름
 * (TITLE_EN_SIZE)보다 작아져 위계까지 뒤집힌다. 최소값을 영문보다 크게 둔다.
 */
export const TITLE_KO_SIZE_STEPS = [
  { maxLength: 6, size: TITLE_KO_SIZE },
  { maxLength: 10, size: 112 },
  // 영문 월 이름보다 작아지지 않는다. 더 긴 제목은 크기를 줄이는 대신
  // 말줄임표로 자른다.
  { maxLength: Infinity, size: TITLE_EN_SIZE + 8 },
] as const
export const DOW_LABEL_SIZE = 40

/**
 * 사이드바 박스.
 *
 * 글자 크기는 날짜 칸(CELL_TEXT_BASE_SIZE = 52)을 기준으로 맞춘다.
 * 사이드바 내용이 44면 X 타임라인 축소(0.3배) 후 약 13px로, 날짜 칸 16px보다
 * 한 단계 작아 위계가 잡힌다. 이전 값(32)은 축소 후 9.6px라 읽기 어려웠다.
 */
export const BOX_HEADER_HEIGHT = 118
export const BOX_LABEL_KO_SIZE = 52
export const BOX_BADGE_SIZE = 48
export const BOX_PADDING = 34
/**
 * 안내 문구. 박스가 비어 있을 때 **이것만 보이므로** 본문과 크게 차이나면
 * 그 박스만 글씨가 작아 보인다. 본문보다 한 단계만 작게 둔다.
 */
export const BOX_HINT_SIZE = 40
export const BOX_TEXT_SIZE = 54
export const BOX_CHECKBOX_SIZE = 44

/** 박스 3개가 사이드바 높이를 나눠 갖는 비율 */
export const GOALS_BOX_RATIO = 0.38
export const TODO_BOX_RATIO = 0.34
export const MEMO_BOX_RATIO = 0.28
