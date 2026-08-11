import { describe, expect, it } from 'vitest'
import type { GridCell } from '../model/calendar'
import type { DayEntry } from '../model/types'
import { getTheme } from '../theme/themes'
import { CELL_EXTRA_HEIGHT, CELL_TEXT_HEIGHT, splitCellText } from './layout'
import { dateNumberColor } from './DayCell'

const theme = getTheme('pink')
const cell = (dow: number, inMonth = true): GridCell => ({
  date: '2026-08-03', day: 3, dow, inMonth,
})
const entry = (dateColor: string | null): DayEntry => ({
  text: '', dateColor, cellFill: null, marker: null,
})

describe('dateNumberColor', () => {
  // 네 번째 인자(영역 글자색)는 평일 폴백에만 쓰인다. 여기서는 옛 기본값인
  // theme.bodyText를 그대로 넘겨서 이 테스트들이 기존 동작을 계속 고정한다.
  it('일요일은 기본으로 일요일 색이다', () => {
    expect(dateNumberColor(cell(0), undefined, theme, theme.bodyText)).toBe(theme.sundayText)
  })

  it('토요일은 기본으로 토요일 색이다', () => {
    expect(dateNumberColor(cell(6), undefined, theme, theme.bodyText)).toBe(theme.saturdayText)
  })

  it('평일은 기본 본문 색이다', () => {
    expect(dateNumberColor(cell(3), undefined, theme, theme.bodyText)).toBe(theme.bodyText)
  })

  it('앞뒤 달 날짜는 흐린 색이며 요일 규칙보다 우선한다', () => {
    expect(dateNumberColor(cell(0, false), undefined, theme, theme.bodyText)).toBe(theme.outsideMonthText)
  })

  it('지정한 색이 요일 기본 규칙을 이긴다', () => {
    expect(dateNumberColor(cell(0), entry('#00ff00'), theme, theme.bodyText)).toBe('#00ff00')
  })

  it('색을 지정하지 않은 항목은 요일 규칙을 따른다', () => {
    expect(dateNumberColor(cell(0), entry(null), theme, theme.bodyText)).toBe(theme.sundayText)
  })

  it('앞뒤 달 칸은 지정 색이 있어도 흐린 색이다', () => {
    expect(dateNumberColor(cell(0, false), entry('#00ff00'), theme, theme.bodyText)).toBe(theme.outsideMonthText)
  })
})

describe('dateNumberColor와 영역 글자색', () => {
  const theme = getTheme('pink')
  const weekday = { date: '2026-08-05', day: 5, dow: 3, inMonth: true }
  const sunday = { date: '2026-08-02', day: 2, dow: 0, inMonth: true }
  const saturday = { date: '2026-08-01', day: 1, dow: 6, inMonth: true }
  const outside = { date: '2026-07-31', day: 31, dow: 5, inMonth: false }

  it('평일 숫자는 영역 글자색을 따라간다', () => {
    expect(dateNumberColor(weekday, undefined, theme, '#ffffff')).toBe('#ffffff')
  })

  it('일요일 빨강은 덮지 않는다', () => {
    expect(dateNumberColor(sunday, undefined, theme, '#ffffff')).toBe(theme.sundayText)
  })

  it('토요일 파랑은 덮지 않는다', () => {
    expect(dateNumberColor(saturday, undefined, theme, '#ffffff')).toBe(theme.saturdayText)
  })

  it('날짜별로 고른 색은 덮지 않는다', () => {
    const entry = { text: '', dateColor: '#00ff00', cellFill: null, marker: null }
    expect(dateNumberColor(weekday, entry, theme, '#ffffff')).toBe('#00ff00')
  })

  it('앞뒤 달 흐린 색은 덮지 않는다', () => {
    expect(dateNumberColor(outside, undefined, theme, '#ffffff')).toBe(theme.outsideMonthText)
  })
})

describe('splitCellText', () => {
  it('추가 문구가 없으면 본문이 텍스트 영역을 전부 쓴다', () => {
    // 기존에 만든 일정표가 픽셀 하나도 안 바뀌어야 한다. 이 테스트가 그 보증이다.
    expect(splitCellText(undefined)).toEqual({ bodyHeight: CELL_TEXT_HEIGHT, extraHeight: 0 })
  })

  it('추가 문구가 빈 문자열이어도 본문이 전부 쓴다', () => {
    expect(splitCellText('')).toEqual({ bodyHeight: CELL_TEXT_HEIGHT, extraHeight: 0 })
  })

  it('추가 문구가 공백뿐이어도 본문이 전부 쓴다', () => {
    expect(splitCellText('   ')).toEqual({ bodyHeight: CELL_TEXT_HEIGHT, extraHeight: 0 })
  })

  it('추가 문구가 있으면 아래쪽 띠만큼 본문이 줄어든다', () => {
    expect(splitCellText('12h')).toEqual({
      bodyHeight: CELL_TEXT_HEIGHT - CELL_EXTRA_HEIGHT,
      extraHeight: CELL_EXTRA_HEIGHT,
    })
  })

  it('두 띠를 더하면 항상 텍스트 영역 전체다', () => {
    for (const value of [undefined, '', '12h', '아주 긴 문구를 넣어도 마찬가지']) {
      const { bodyHeight, extraHeight } = splitCellText(value)
      expect(bodyHeight + extraHeight).toBe(CELL_TEXT_HEIGHT)
    }
  })
})
