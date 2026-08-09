import { describe, expect, it } from 'vitest'
import {
  CANVAS_HEIGHT, CANVAS_WIDTH, CELL_HEIGHT, CELL_WIDTH, DOW_ROW_HEIGHT,
  FOOTER_HEIGHT, GRID_HEIGHT, GRID_WIDTH, HEADER_HEIGHT, OUTER_PADDING,
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
    const total = OUTER_PADDING * 2 + HEADER_HEIGHT + DOW_ROW_HEIGHT + GRID_HEIGHT + FOOTER_HEIGHT
    expect(total).toBe(CANVAS_HEIGHT)
  })

  it('가로 구성 요소의 합이 캔버스 폭과 정확히 같다', () => {
    expect(OUTER_PADDING * 2 + GRID_WIDTH).toBe(CANVAS_WIDTH)
  })

  it('칸 7개가 격자 폭을 채운다', () => {
    expect(CELL_WIDTH * 7).toBeCloseTo(GRID_WIDTH, 10)
  })

  it('칸 6줄이 격자 높이를 채운다', () => {
    expect(CELL_HEIGHT * 6).toBeCloseTo(GRID_HEIGHT, 10)
  })
})
