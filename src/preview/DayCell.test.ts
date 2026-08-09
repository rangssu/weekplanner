import { describe, expect, it } from 'vitest'
import type { GridCell } from '../model/calendar'
import type { DayEntry } from '../model/types'
import { getTheme } from '../theme/themes'
import { dateNumberColor } from './DayCell'

const theme = getTheme('pink')
const cell = (dow: number, inMonth = true): GridCell => ({
  date: '2026-08-03', day: 3, dow, inMonth,
})
const entry = (dateColor: string | null): DayEntry => ({
  text: '', dateColor, cellFill: null, marker: null,
})

describe('dateNumberColor', () => {
  it('일요일은 기본으로 일요일 색이다', () => {
    expect(dateNumberColor(cell(0), undefined, theme)).toBe(theme.sundayText)
  })

  it('토요일은 기본으로 토요일 색이다', () => {
    expect(dateNumberColor(cell(6), undefined, theme)).toBe(theme.saturdayText)
  })

  it('평일은 기본 본문 색이다', () => {
    expect(dateNumberColor(cell(3), undefined, theme)).toBe(theme.bodyText)
  })

  it('앞뒤 달 날짜는 흐린 색이며 요일 규칙보다 우선한다', () => {
    expect(dateNumberColor(cell(0, false), undefined, theme)).toBe(theme.outsideMonthText)
  })

  it('지정한 색이 요일 기본 규칙을 이긴다', () => {
    expect(dateNumberColor(cell(0), entry('#00ff00'), theme)).toBe('#00ff00')
  })

  it('색을 지정하지 않은 항목은 요일 규칙을 따른다', () => {
    expect(dateNumberColor(cell(0), entry(null), theme)).toBe(theme.sundayText)
  })

  it('앞뒤 달 칸은 지정 색이 있어도 흐린 색이다', () => {
    expect(dateNumberColor(cell(0, false), entry('#00ff00'), theme)).toBe(theme.outsideMonthText)
  })
})
