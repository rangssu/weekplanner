import { GRID_COLUMNS, GRID_ROWS } from '../model/calendar'
import {
  CELL_AREA_HEIGHT, CELL_AREA_WIDTH, CELL_AREA_X, CELL_AREA_Y,
} from '../preview/layout'

export type ScreenRect = { x: number; y: number; width: number; height: number }

export type PopoverPlacement = {
  /** 'right'면 칸 오른쪽에 붙여 오른쪽으로 펼친다. */
  horizontal: 'left' | 'right'
  /** 'below'면 칸 아래에 붙여 아래로 펼친다. */
  vertical: 'above' | 'below'
}

/**
 * 팝오버를 오른쪽으로 펼칠 여유가 없어지는 열. 팝오버 폭이 320px인데
 * 칸 하나는 미리보기가 1200px일 때 약 171px이라, 오른쪽에 두 칸 넘게
 * 남아야 들어간다.
 */
const FLIP_COLUMN = GRID_COLUMNS - 2
/** 팝오버 높이가 약 420px이라 아래쪽 세 행에서는 화면 밖으로 나간다. */
const FLIP_ROW = GRID_ROWS - 3

/**
 * 격자 index(0~41)의 칸이 화면에서 차지하는 사각형.
 *
 * 클릭을 받는 오버레이는 CSS 그리드라 좌표를 안 만든다. 이 함수는 팝오버를
 * 어디에 띄울지에만 쓴다 — 팝오버를 축소된 레이어 안에 넣고 역스케일하면
 * 좌표 계산은 사라지지만, CSS transform이 걸린 컨테이너 안에서 한글 IME
 * 후보창 위치가 틀어질 수 있어 그 방법을 쓰지 않는다.
 *
 * 그 대가로 CalendarGrid의 CSS 그리드와 따로 노는 두 번째 계산이 된다.
 * cellGeometry.test.ts가 칸 42개가 영역을 빈틈없이 덮는지 검사해 묶어 둔다.
 */
export function cellScreenRect(index: number, scale: number): ScreenRect {
  const col = index % GRID_COLUMNS
  const row = Math.floor(index / GRID_COLUMNS)
  const width = CELL_AREA_WIDTH / GRID_COLUMNS
  const height = CELL_AREA_HEIGHT / GRID_ROWS
  return {
    x: (CELL_AREA_X + col * width) * scale,
    y: (CELL_AREA_Y + row * height) * scale,
    width: width * scale,
    height: height * scale,
  }
}

/** 가장자리 칸에서 팝오버가 화면 밖으로 나가지 않게 펼치는 방향을 뒤집는다. */
export function popoverPlacement(index: number): PopoverPlacement {
  const col = index % GRID_COLUMNS
  const row = Math.floor(index / GRID_COLUMNS)
  return {
    horizontal: col >= FLIP_COLUMN ? 'left' : 'right',
    vertical: row >= FLIP_ROW ? 'above' : 'below',
  }
}

/**
 * 방향을 뒤집어도 넘칠 때 안으로 민다. 창을 좁혔을 때 필요하다.
 * 범위가 내용보다 좁으면 여백 위치에 붙인다 — 이때는 어차피 넘치므로
 * 왼쪽 가장자리를 기준으로 잡는 편이 읽기 쉽다.
 */
export function clampToRange(value: number, size: number, limit: number, margin = 8): number {
  const max = limit - size - margin
  if (max < margin) return margin
  return Math.min(Math.max(value, margin), max)
}
