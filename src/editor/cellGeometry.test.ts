import { describe, expect, it } from 'vitest'
import { GRID_CELL_COUNT, GRID_COLUMNS } from '../model/calendar'
import {
  CELL_AREA_HEIGHT, CELL_AREA_WIDTH, CELL_AREA_X, CELL_AREA_Y,
} from '../preview/layout'
import { cellScreenRect, clampToRange, popoverPlacement } from './cellGeometry'

describe('cellScreenRect', () => {
  it('배율 1에서 첫 칸이 칸 영역의 왼쪽 위 모서리에서 시작한다', () => {
    const rect = cellScreenRect(0, 1)
    expect(rect.x).toBeCloseTo(CELL_AREA_X, 10)
    expect(rect.y).toBeCloseTo(CELL_AREA_Y, 10)
  })

  it('마지막 칸의 오른쪽 아래가 칸 영역의 오른쪽 아래와 같다', () => {
    const rect = cellScreenRect(GRID_CELL_COUNT - 1, 1)
    expect(rect.x + rect.width).toBeCloseTo(CELL_AREA_X + CELL_AREA_WIDTH, 10)
    expect(rect.y + rect.height).toBeCloseTo(CELL_AREA_Y + CELL_AREA_HEIGHT, 10)
  })

  it('칸 42개가 겹치거나 벌어지지 않고 영역을 덮는다', () => {
    for (let i = 0; i < GRID_CELL_COUNT; i++) {
      const rect = cellScreenRect(i, 1)
      const col = i % GRID_COLUMNS
      if (col === GRID_COLUMNS - 1) continue
      const right = cellScreenRect(i + 1, 1)
      // 오른쪽 이웃의 왼쪽 모서리가 이 칸의 오른쪽 모서리와 같아야 한다.
      expect(right.x).toBeCloseTo(rect.x + rect.width, 10)
    }
  })

  it('배율을 곱하면 좌표와 크기가 같은 비율로 줄어든다', () => {
    const full = cellScreenRect(15, 1)
    const half = cellScreenRect(15, 0.5)
    expect(half.x).toBeCloseTo(full.x * 0.5, 10)
    expect(half.width).toBeCloseTo(full.width * 0.5, 10)
  })
})

describe('popoverPlacement', () => {
  it('왼쪽 다섯 열은 오른쪽으로 펼친다', () => {
    expect(popoverPlacement(0).horizontal).toBe('right')
    expect(popoverPlacement(4).horizontal).toBe('right')
  })

  it('오른쪽 두 열은 왼쪽으로 뒤집는다', () => {
    expect(popoverPlacement(5).horizontal).toBe('left')
    expect(popoverPlacement(6).horizontal).toBe('left')
  })

  it('위 세 행은 아래로 펼친다', () => {
    expect(popoverPlacement(0).vertical).toBe('below')
    expect(popoverPlacement(20).vertical).toBe('below')
  })

  it('아래 세 행은 위로 뒤집는다', () => {
    expect(popoverPlacement(21).vertical).toBe('above')
    expect(popoverPlacement(41).vertical).toBe('above')
  })

  it('오른쪽 아래 모서리는 양쪽 다 뒤집는다', () => {
    expect(popoverPlacement(41)).toEqual({ horizontal: 'left', vertical: 'above' })
  })
})

describe('clampToRange', () => {
  it('범위 안이면 그대로 둔다', () => {
    expect(clampToRange(100, 320, 1000)).toBe(100)
  })

  it('오른쪽으로 넘치면 안으로 민다', () => {
    expect(clampToRange(900, 320, 1000, 8)).toBe(1000 - 320 - 8)
  })

  it('왼쪽으로 넘치면 안으로 민다', () => {
    expect(clampToRange(-50, 320, 1000, 8)).toBe(8)
  })

  it('범위가 내용보다 좁으면 여백 위치에 붙인다', () => {
    expect(clampToRange(0, 320, 100, 8)).toBe(8)
  })
})
