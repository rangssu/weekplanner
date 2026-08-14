import { useCallback, useEffect, useMemo, useState } from 'react'

export type SelectedDateApi = {
  /** 지금 보고 있는 달에 속하는 선택만 나온다. 아니면 null. */
  selectedDate: string | null
  /** 같은 칸을 다시 누르면 해제한다. */
  toggle: (date: string) => void
  /** 이웃 날짜로 옮길 때처럼 곧바로 지정할 때 쓴다. */
  select: (date: string) => void
  close: () => void
}

/**
 * 달력에서 고른 날짜.
 *
 * 달을 옮기면 선택을 읽는 쪽에서 거른다. 8월 8일을 고른 채 9월로 넘어갔을 때
 * 9월 8일이 선택돼 있는 것은 자연스럽지 않다.
 *
 * **거르기와 지우기가 둘 다 필요하다. 어느 한쪽만으로는 부족하다.**
 *
 * 파생값(useMemo)으로 거르는 이유: effect로만 지우면 effect가 커밋 **뒤에**
 * 돌기 때문에, 그 사이 렌더에서 buildMonthGrid(새 달)의 앞뒤 달 채움칸이
 * 우연히 옛 선택과 같은 문자열을 가지면(8/31을 고른 채 9월로 가면 9월 격자 첫
 * 줄에 8/31이 있다) DayPopover는 뜨는데 SelectedDayEditor는 달 불일치로 null을
 * 반환해 테두리만 있는 빈 상자가 한 프레임 깜빡인다.
 *
 * 그런데도 원본을 지우는 이유: 거르기만 두면 원본이 계속 살아 있어, 9월로
 * 갔다가 8월로 **돌아오면** 옛 선택이 거르기를 다시 통과한다. 누르지도 않은
 * 편집 상자가 저절로 열린다. 거르기가 그 프레임을 막고, 지우기가 왕복을 막는다.
 */
export function useSelectedDate(year: number, month: number): SelectedDateApi {
  const [raw, setRaw] = useState<string | null>(null)

  useEffect(() => {
    setRaw(null)
  }, [year, month])

  const selectedDate = useMemo(() => {
    if (raw === null) return null
    const parsed = /^(\d{4})-(\d{2})-/.exec(raw)
    if (!parsed) return null
    return Number(parsed[1]) === year && Number(parsed[2]) === month ? raw : null
  }, [raw, year, month])

  const toggle = useCallback((date: string) => {
    setRaw((prev) => (prev === date ? null : date))
  }, [])

  const select = useCallback((date: string) => setRaw(date), [])
  const close = useCallback(() => setRaw(null), [])

  return { selectedDate, toggle, select, close }
}
