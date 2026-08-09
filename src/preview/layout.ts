import { GRID_COLUMNS, GRID_ROWS } from '../model/calendar'

/** 결과 이미지 원본 크기. 이 값을 다른 곳에 하드코딩하지 않는다. */
export const CANVAS_WIDTH = 4000
export const CANVAS_HEIGHT = 2250

/**
 * 세로 공간 배분.
 *
 * 캔버스 높이 2250은 고정이므로, 날짜 칸을 키우려면 여백·헤더에서 가져오는
 * 수밖에 없다. 실사용자가 "칸이 더 길었으면" 한다고 해서 여백 100→70,
 * 헤더 420→330으로 조이고 하단 문구 영역(100)은 통째로 없앴다.
 * 칸 높이가 235 → 277로 18% 늘었다.
 *
 * 회수한 공간이 6행으로 나뉘므로 칸당 증가폭은 회수량의 1/6밖에 안 된다.
 * 체감할 만큼 키우려면 헤더에서 가져오는 수밖에 없다.
 */
export const OUTER_PADDING = 70
export const HEADER_HEIGHT = 330
export const DOW_ROW_HEIGHT = 90

export const BORDER_WIDTH = 5
export const CANVAS_BORDER_WIDTH = 10
export const CANVAS_BORDER_RADIUS = 40

/**
 * 격자가 차지하는 영역. **테두리를 포함한 바깥 크기다.**
 *
 * CalendarGrid는 이 크기를 `box-sizing: border-box`로 쓴다. 테두리를 뺀
 * 크기로 잡으면 실제 렌더링이 상수보다 가로세로 10px씩 커져서, 세로로는
 * flex가 격자를 눌러 압축하고 가로로는 캔버스를 넘어 잘린다. 실제로 그랬다.
 */
/**
 * 캔버스가 `box-sizing: border-box`라 실제로 내용이 들어갈 공간은
 * 전체 크기에서 **자신의 테두리와 패딩을 모두 뺀** 값이다.
 * 테두리를 빼먹으면 여백이 의도한 100px이 아니라 80px이 된다.
 */
export const CANVAS_CONTENT_WIDTH = CANVAS_WIDTH - CANVAS_BORDER_WIDTH * 2 - OUTER_PADDING * 2 // 3780
export const CANVAS_CONTENT_HEIGHT =
  CANVAS_HEIGHT - CANVAS_BORDER_WIDTH * 2 - OUTER_PADDING * 2 // 2030

export const GRID_AREA_WIDTH = CANVAS_CONTENT_WIDTH // 3840
export const GRID_AREA_HEIGHT = CANVAS_CONTENT_HEIGHT - HEADER_HEIGHT // 1760

/** 테두리 안쪽. 요일 행과 날짜 칸이 실제로 나눠 쓰는 공간. */
export const GRID_INNER_WIDTH = GRID_AREA_WIDTH - BORDER_WIDTH * 2 // 3790
export const GRID_INNER_HEIGHT = GRID_AREA_HEIGHT - BORDER_WIDTH * 2 // 1520

export const CELL_WIDTH = GRID_INNER_WIDTH / GRID_COLUMNS // 541.43…
export const CELL_HEIGHT = (GRID_INNER_HEIGHT - DOW_ROW_HEIGHT) / GRID_ROWS // 238.33…

export const CELL_PADDING = 14
export const DATE_NUMBER_SIZE = 44
export const DATE_NUMBER_BLOCK = 56

/** 일정 텍스트가 쓸 수 있는 영역 */
export const CELL_TEXT_WIDTH = CELL_WIDTH - CELL_PADDING * 2
export const CELL_TEXT_HEIGHT = CELL_HEIGHT - CELL_PADDING * 2 - DATE_NUMBER_BLOCK

/**
 * 글자 크기는 **결과 이미지가 축소돼 보이는 상황**을 기준으로 잡는다.
 *
 * 4000px 이미지를 X 타임라인에 올리면 1200px 안팎으로 줄어 보인다.
 * 배율이 0.3이므로 캔버스의 56px는 화면에서 약 17px이 된다.
 * 44px로 두면 13px이 되어 폰에서 읽기 어렵다.
 */
export const CELL_TEXT_BASE_SIZE = 56
export const CELL_TEXT_MIN_SIZE = 28
export const CELL_TEXT_LINE_HEIGHT = 1.25

export const DOW_LABEL_SIZE = 48
export const MEMO_LABEL_SIZE = 42
export const MEMO_TEXT_SIZE = 34
export const TODO_LABEL_SIZE = 42
export const TODO_TEXT_SIZE = 32
