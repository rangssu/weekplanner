import { describe, expect, it } from 'vitest'
import {
  BODY_HEIGHT, BORDER_WIDTH, CANVAS_CONTENT_HEIGHT, CANVAS_CONTENT_WIDTH, CANVAS_HEIGHT,
  CANVAS_WIDTH, CELL_HEIGHT, CELL_TEXT_HEIGHT, CELL_TEXT_WIDTH, CELL_WIDTH, COLUMN_GAP,
  DOW_ROW_HEIGHT, GRID_AREA_HEIGHT, GRID_AREA_WIDTH, GRID_INNER_HEIGHT, GRID_INNER_WIDTH,
  OUTER_PADDING, SIDEBAR_WIDTH, TITLE_GAP, TITLE_ROW_HEIGHT,
} from './layout'

describe('레이아웃 상수', () => {
  it('캔버스는 4000×2250이다', () => {
    expect(CANVAS_WIDTH).toBe(4000)
    expect(CANVAS_HEIGHT).toBe(2250)
  })

  it('16:9 비율이다', () => {
    expect(CANVAS_WIDTH / CANVAS_HEIGHT).toBeCloseTo(16 / 9, 10)
  })

  it('세로 구성 요소의 합이 캔버스 높이와 정확히 같다', () => {
    const total = OUTER_PADDING * 2 + TITLE_ROW_HEIGHT + TITLE_GAP + BODY_HEIGHT
    expect(total).toBe(CANVAS_HEIGHT)
  })

  it('가로 구성 요소의 합이 캔버스 폭과 정확히 같다', () => {
    const total = OUTER_PADDING * 2 + SIDEBAR_WIDTH + COLUMN_GAP + GRID_AREA_WIDTH
    expect(total).toBe(CANVAS_WIDTH)
  })

  it('캔버스 안쪽 공간이 패딩을 뺀 값과 같다', () => {
    expect(CANVAS_CONTENT_WIDTH).toBe(CANVAS_WIDTH - OUTER_PADDING * 2)
    expect(CANVAS_CONTENT_HEIGHT).toBe(CANVAS_HEIGHT - OUTER_PADDING * 2)
  })

  it('격자 영역은 테두리를 포함한 바깥 크기다', () => {
    expect(GRID_INNER_WIDTH).toBe(GRID_AREA_WIDTH - BORDER_WIDTH * 2)
    expect(GRID_INNER_HEIGHT).toBe(GRID_AREA_HEIGHT - BORDER_WIDTH * 2)
  })

  it('사이드바와 격자가 같은 높이를 쓴다', () => {
    expect(GRID_AREA_HEIGHT).toBe(BODY_HEIGHT)
  })

  it('칸 7개가 테두리 안쪽 폭을 채운다', () => {
    expect(CELL_WIDTH * 7).toBeCloseTo(GRID_INNER_WIDTH, 10)
  })

  it('요일 행과 칸 6줄이 테두리 안쪽 높이를 채운다', () => {
    expect(DOW_ROW_HEIGHT + CELL_HEIGHT * 6).toBeCloseTo(GRID_INNER_HEIGHT, 10)
  })

  it('일정 텍스트 영역이 칸 안에 들어간다', () => {
    expect(CELL_TEXT_WIDTH).toBeLessThan(CELL_WIDTH)
    expect(CELL_TEXT_HEIGHT).toBeLessThan(CELL_HEIGHT)
    expect(CELL_TEXT_WIDTH).toBeGreaterThan(0)
    expect(CELL_TEXT_HEIGHT).toBeGreaterThan(0)
  })
})
