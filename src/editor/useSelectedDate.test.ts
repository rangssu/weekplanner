import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useSelectedDate } from './useSelectedDate'

function renderSelection(year = 2026, month = 8) {
  return renderHook(({ y, m }) => useSelectedDate(y, m), {
    initialProps: { y: year, m: month },
  })
}

describe('useSelectedDate', () => {
  it('처음에는 고른 날짜가 없다', () => {
    const { result } = renderSelection()
    expect(result.current.selectedDate).toBeNull()
  })

  it('같은 칸을 다시 누르면 해제한다', () => {
    const { result } = renderSelection()

    act(() => result.current.toggle('2026-08-08'))
    expect(result.current.selectedDate).toBe('2026-08-08')

    act(() => result.current.toggle('2026-08-08'))
    expect(result.current.selectedDate).toBeNull()
  })

  it('다른 칸을 누르면 그쪽으로 옮긴다', () => {
    const { result } = renderSelection()

    act(() => result.current.toggle('2026-08-08'))
    act(() => result.current.toggle('2026-08-09'))

    expect(result.current.selectedDate).toBe('2026-08-09')
  })

  it('보고 있는 달 밖의 날짜는 곧바로 걸러진다', () => {
    // 파생값(useMemo)으로 거른다는 불변식을 지킨다. effect로만 지우면 커밋
    // 뒤에야 지워져서, 9월 격자 첫 줄에 있는 8/31 채움칸 때문에 빈 편집 상자가
    // 한 프레임 깜빡인다. 여기서는 달이 바뀌지 않으므로 effect는 아예 안 돈다 —
    // 그런데도 null이어야 파생 거르기가 살아 있는 것이다.
    const { result } = renderSelection(2026, 9)

    act(() => result.current.select('2026-08-31'))

    expect(result.current.selectedDate).toBeNull()
  })

  it('달을 옮겼다 돌아와도 예전 선택이 되살아나지 않는다', () => {
    // 8월 8일을 고른 채 9월로 갔다가 8월로 돌아오면, 원본 상태가 남아 있는 한
    // 거르기를 다시 통과해 누르지도 않은 편집 상자가 저절로 열린다.
    const { result, rerender } = renderSelection(2026, 8)

    act(() => result.current.toggle('2026-08-08'))
    expect(result.current.selectedDate).toBe('2026-08-08')

    rerender({ y: 2026, m: 9 })
    expect(result.current.selectedDate).toBeNull()

    rerender({ y: 2026, m: 8 })
    expect(result.current.selectedDate).toBeNull()
  })

  it('해가 바뀌어도 되살아나지 않는다', () => {
    const { result, rerender } = renderSelection(2026, 8)

    act(() => result.current.toggle('2026-08-08'))

    rerender({ y: 2027, m: 8 })
    rerender({ y: 2026, m: 8 })

    expect(result.current.selectedDate).toBeNull()
  })
})
