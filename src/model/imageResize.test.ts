import { describe, expect, it } from 'vitest'
import { fitWithin, MAX_IMAGE_EDGE } from './imageResize'

describe('fitWithin', () => {
  it('한도보다 작으면 그대로 둔다', () => {
    expect(fitWithin(800, 600, 2000)).toEqual({ width: 800, height: 600 })
  })

  it('가로가 길면 가로를 한도에 맞춘다', () => {
    expect(fitWithin(4000, 2000, 2000)).toEqual({ width: 2000, height: 1000 })
  })

  it('세로가 길면 세로를 한도에 맞춘다', () => {
    expect(fitWithin(2000, 4000, 2000)).toEqual({ width: 1000, height: 2000 })
  })

  it('비율을 유지한다', () => {
    const out = fitWithin(3000, 1200, 2000)
    expect(out.width / out.height).toBeCloseTo(3000 / 1200, 6)
  })

  it('정수 픽셀을 준다', () => {
    const out = fitWithin(3333, 1111, 2000)
    expect(Number.isInteger(out.width)).toBe(true)
    expect(Number.isInteger(out.height)).toBe(true)
  })

  it('한 변이 0이어도 깨지지 않는다', () => {
    expect(fitWithin(0, 0, 2000)).toEqual({ width: 0, height: 0 })
  })

  it('정확히 한도와 같으면 그대로 둔다', () => {
    expect(fitWithin(2000, 1000, 2000)).toEqual({ width: 2000, height: 1000 })
  })

  it('기본 한도는 2000이다', () => {
    expect(MAX_IMAGE_EDGE).toBe(2000)
  })
})
