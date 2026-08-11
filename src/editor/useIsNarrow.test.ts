import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NARROW_MAX_WIDTH, useIsNarrow } from './useIsNarrow'

const original = window.matchMedia

afterEach(() => {
  window.matchMedia = original
})

function stubMatchMedia(matches: boolean) {
  const listeners: Array<() => void> = []
  window.matchMedia = vi.fn((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: (_: string, fn: () => void) => listeners.push(fn),
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

describe('useIsNarrow', () => {
  it('기준 폭이 CSS 미디어쿼리와 같은 900px이다', () => {
    expect(NARROW_MAX_WIDTH).toBe(900)
  })

  it('넓은 화면이면 false다', () => {
    stubMatchMedia(false)
    const { result } = renderHook(() => useIsNarrow())
    expect(result.current).toBe(false)
  })

  it('좁은 화면이면 true다', () => {
    stubMatchMedia(true)
    const { result } = renderHook(() => useIsNarrow())
    expect(result.current).toBe(true)
  })

  it('기준 폭을 미디어쿼리 문자열에 넣는다', () => {
    stubMatchMedia(false)
    renderHook(() => useIsNarrow())
    expect(window.matchMedia).toHaveBeenCalledWith(`(max-width: ${NARROW_MAX_WIDTH}px)`)
  })
})
