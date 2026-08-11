import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { measureRegions } from '../model/imageLuminance'
import { getTheme } from '../theme/themes'
import { useAutoTextColors } from './useAutoTextColors'

// 로컬 ESM 모듈의 네임스페이스 객체에 vi.spyOn을 쓰면 속성 재정의가 막혀
// 불안정하다. vi.mock으로 모듈 전체를 교체하고, 모킹된 함수를 직접 import해
// 테스트마다 반환값을 정한다.
vi.mock('../model/imageLuminance', () => ({
  measureRegions: vi.fn(),
}))

const mockMeasure = vi.mocked(measureRegions)

const base = {
  theme: getTheme('pink'),
  boxesEnabled: [true, true, true] as [boolean, boolean, boolean],
  gridOpacity: 1,
  sidebarOpacity: 1,
}

describe('useAutoTextColors', () => {
  beforeEach(() => {
    mockMeasure.mockReset()
  })

  it('배경이 없으면 null이다', () => {
    const { result } = renderHook(() => useAutoTextColors({ ...base, backgroundUrl: null }))
    expect(result.current).toBeNull()
  })

  it('밝기를 못 재면 null이다', async () => {
    mockMeasure.mockResolvedValue(null)

    const { result } = renderHook(() =>
      useAutoTextColors({ ...base, backgroundUrl: 'data:image/png;base64,AAAA' }),
    )

    await waitFor(() => expect(result.current).toBeNull())
  })

  it('불투명도가 1이면 어두운 사진이라도 테마 배경색 기준으로 판정한다', async () => {
    // 이 테스트가 이 기능의 핵심을 지킨다. 불투명도를 무시하면 배경 이미지가
    // 아예 안 보이는데도 어두운 사진이라는 이유로 밝은 글자를 고른다.
    mockMeasure.mockResolvedValue({
      title: 0, goal: 0, todo: 0, memo: 0, calendar: 0,
    })

    const { result } = renderHook(() =>
      useAutoTextColors({
        ...base,
        backgroundUrl: 'data:image/png;base64,AAAA',
        gridOpacity: 1,
        sidebarOpacity: 1,
      }),
    )

    // 핑크 테마의 cellBackground(#fdf4f6)는 밝다 → 어두운 글자.
    await waitFor(() => expect(result.current?.calendar).toBe('dark'))
    expect(result.current?.goal).toBe('dark')
  })

  it('불투명도가 0이면 이미지 밝기를 그대로 쓴다', async () => {
    mockMeasure.mockResolvedValue({
      title: 0, goal: 0, todo: 0, memo: 0, calendar: 0,
    })

    const { result } = renderHook(() =>
      useAutoTextColors({
        ...base,
        backgroundUrl: 'data:image/png;base64,AAAA',
        gridOpacity: 0,
        sidebarOpacity: 0,
      }),
    )

    await waitFor(() => expect(result.current?.calendar).toBe('light'))
  })

  it('제목은 배경 상자가 없어 불투명도를 안 탄다', async () => {
    mockMeasure.mockResolvedValue({
      title: 0, goal: 0, todo: 0, memo: 0, calendar: 0,
    })

    const { result } = renderHook(() =>
      useAutoTextColors({
        ...base,
        backgroundUrl: 'data:image/png;base64,AAAA',
        gridOpacity: 1,
        sidebarOpacity: 1,
      }),
    )

    // 사이드바·달력은 dark로 뒤집혀도 제목은 이미지 밝기(0) 그대로다.
    await waitFor(() => expect(result.current?.title).toBe('light'))
  })
})
