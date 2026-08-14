import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { measureRegions } from '../model/imageLuminance'
import { getTheme } from '../theme/themes'
import { useAutoTextColors, type UseAutoTextColorsArgs } from './useAutoTextColors'

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

  it('배경이 바뀌면 새 밝기가 나오기 전까지 이전 사진의 톤을 쓰지 않는다', async () => {
    // 어두운 사진 → 밝은 사진으로 바꾸는 사이에 옛 톤이 남으면, 밝은 사진 위에
    // 흰 글자가 걸린다. 그 창에서 내보내면 안 보이는 글자가 PNG에 박힌다.
    // 측정이 끝날 때까지는 null(= 테마 기본색)이라는 안전한 상태여야 한다.
    mockMeasure.mockResolvedValueOnce({
      title: 0, goal: 0, todo: 0, memo: 0, calendar: 0,
    })
    // 두 번째 측정은 영영 끝나지 않는다 — 그 사이의 상태를 본다.
    mockMeasure.mockReturnValueOnce(new Promise(() => {}))

    const { result, rerender } = renderHook(
      (props: UseAutoTextColorsArgs) => useAutoTextColors(props),
      {
        initialProps: {
          ...base,
          backgroundUrl: 'data:image/png;base64,AAAA',
          gridOpacity: 0,
          sidebarOpacity: 0,
        } as UseAutoTextColorsArgs,
      },
    )

    await waitFor(() => expect(result.current?.calendar).toBe('light'))

    rerender({
      ...base,
      backgroundUrl: 'data:image/png;base64,BBBB',
      gridOpacity: 0,
      sidebarOpacity: 0,
    })

    expect(result.current).toBeNull()
  })

  it('불투명도만 바뀌면 다시 재지 않는다 — 이 훅의 핵심 성능 불변식', async () => {
    // measureRegions는 4000×2250 이미지를 읽는 무거운 작업이다. 불투명도
    // 슬라이더를 끄는 동안마다 다시 돌면 눈에 띄게 멈춘다. 이 테스트가
    // 없으면 effect 의존성 배열을 실수로 [backgroundUrl, enabledKey, theme]
    // 전체로 되돌려도(불투명도가 theme 안에 있지 않으니 안 걸리지만, 예를
    // 들어 gridOpacity를 의존성에 넣는 실수는) 다른 테스트가 다 통과한다.
    mockMeasure.mockResolvedValue({
      title: 0, goal: 0, todo: 0, memo: 0, calendar: 0,
    })

    const { result, rerender } = renderHook(
      (props: UseAutoTextColorsArgs) => useAutoTextColors(props),
      {
        initialProps: {
          ...base, backgroundUrl: 'data:image/png;base64,AAAA',
        } as UseAutoTextColorsArgs,
      },
    )

    await waitFor(() => expect(result.current).not.toBeNull())
    expect(mockMeasure).toHaveBeenCalledTimes(1)

    // 불투명도만 바꾼다 — 배경도, 상자 on/off도 그대로다.
    rerender({
      ...base, backgroundUrl: 'data:image/png;base64,AAAA', gridOpacity: 0.4, sidebarOpacity: 0.4,
    })

    expect(mockMeasure).toHaveBeenCalledTimes(1)

    // 배경을 바꾸면 다시 재야 한다 — 이번엔 호출 수가 늘어야 한다.
    rerender({
      ...base, backgroundUrl: 'data:image/png;base64,BBBB', gridOpacity: 0.4, sidebarOpacity: 0.4,
    })

    await waitFor(() => expect(mockMeasure).toHaveBeenCalledTimes(2))
  })
})
