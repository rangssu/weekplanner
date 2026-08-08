import { describe, expect, it, vi } from 'vitest'
import { chooseFontSize, type MeasureFn } from './fitText'

/** 글자 하나가 fontSize×fontSize 정사각형이고, maxWidth 안에서 줄바꿈된다고 가정한 측정기. */
function fakeMeasure(charCount: number, boxWidth: number): MeasureFn {
  return (fontSize) => {
    const perLine = Math.max(1, Math.floor(boxWidth / fontSize))
    const lines = Math.ceil(charCount / perLine)
    return { width: Math.min(charCount, perLine) * fontSize, height: lines * fontSize }
  }
}

describe('chooseFontSize', () => {
  it('짧은 글은 기본 크기를 그대로 쓴다', () => {
    const result = chooseFontSize({
      measure: fakeMeasure(4, 500), maxWidth: 500, maxHeight: 150, baseSize: 44, minSize: 22,
    })
    expect(result.size).toBe(44)
    expect(result.overflow).toBe(false)
  })

  it('긴 글은 크기를 줄인다', () => {
    const result = chooseFontSize({
      measure: fakeMeasure(60, 500), maxWidth: 500, maxHeight: 150, baseSize: 44, minSize: 22,
    })
    expect(result.size).toBeLessThan(44)
    expect(result.size).toBeGreaterThanOrEqual(22)
  })

  it('고른 크기는 실제로 상자에 들어간다', () => {
    const measure = fakeMeasure(40, 500)
    const { size, overflow } = chooseFontSize({
      measure, maxWidth: 500, maxHeight: 150, baseSize: 44, minSize: 22,
    })
    if (!overflow) {
      const m = measure(size)
      expect(m.width).toBeLessThanOrEqual(500)
      expect(m.height).toBeLessThanOrEqual(150)
    }
  })

  it('한 단계 큰 크기는 넘친다 — 가능한 최대를 고른다', () => {
    const measure = fakeMeasure(40, 500)
    const { size, overflow } = chooseFontSize({
      measure, maxWidth: 500, maxHeight: 150, baseSize: 44, minSize: 22,
    })
    if (!overflow && size < 44) {
      const bigger = measure(size + 1)
      expect(bigger.width > 500 || bigger.height > 150).toBe(true)
    }
  })

  it('최소 크기로도 안 들어가면 overflow를 알리고 최소 크기를 준다', () => {
    const result = chooseFontSize({
      measure: fakeMeasure(2000, 500), maxWidth: 500, maxHeight: 150, baseSize: 44, minSize: 22,
    })
    expect(result.size).toBe(22)
    expect(result.overflow).toBe(true)
  })

  it('빈 글자는 기본 크기를 쓴다', () => {
    const result = chooseFontSize({
      measure: () => ({ width: 0, height: 0 }),
      maxWidth: 500, maxHeight: 150, baseSize: 44, minSize: 22,
    })
    expect(result.size).toBe(44)
    expect(result.overflow).toBe(false)
  })

  it('이진 탐색이므로 측정 횟수가 크기 범위보다 훨씬 적다', () => {
    const measure = vi.fn(fakeMeasure(60, 500))
    chooseFontSize({ measure, maxWidth: 500, maxHeight: 150, baseSize: 200, minSize: 10 })
    expect(measure.mock.calls.length).toBeLessThan(15)
  })

  it('baseSize와 minSize가 같으면 그 크기를 준다', () => {
    const result = chooseFontSize({
      measure: fakeMeasure(500, 500), maxWidth: 500, maxHeight: 150, baseSize: 30, minSize: 30,
    })
    expect(result.size).toBe(30)
    expect(result.overflow).toBe(true)
  })
})
