import { describe, expect, it } from 'vitest'
import {
  buildMonthGrid,
  dateKey,
  GRID_CELL_COUNT,
  MONTH_NAMES_EN,
  monthKey,
  parseMonthKey,
  previousMonth,
} from './calendar'

describe('buildMonthGrid', () => {
  it('어떤 달이든 항상 42칸이다', () => {
    for (let m = 1; m <= 12; m++) {
      expect(buildMonthGrid(2026, m)).toHaveLength(GRID_CELL_COUNT)
    }
    // 6주가 필요한 달과 5주로 끝나는 달 모두
    expect(buildMonthGrid(2026, 8)).toHaveLength(42)
    expect(buildMonthGrid(2025, 5)).toHaveLength(42)
  })

  it('첫 칸은 항상 일요일, 마지막 칸은 항상 토요일', () => {
    const grid = buildMonthGrid(2026, 8)
    expect(grid[0].dow).toBe(0)
    expect(grid[41].dow).toBe(6)
  })

  it('요일이 7칸 주기로 순환한다', () => {
    const grid = buildMonthGrid(2026, 3)
    grid.forEach((cell, i) => expect(cell.dow).toBe(i % 7))
  })

  it('2026년 8월 — 1일은 토요일이므로 앞에 6칸이 7월로 채워진다', () => {
    const grid = buildMonthGrid(2026, 8)
    expect(grid.slice(0, 6).every((c) => !c.inMonth)).toBe(true)
    expect(grid[5].date).toBe('2026-07-31')
    expect(grid[6]).toEqual({ date: '2026-08-01', day: 1, dow: 6, inMonth: true })
  })

  it('2025년 5월 — 1일은 목요일이므로 앞에 4칸이 4월로 채워진다', () => {
    const grid = buildMonthGrid(2025, 5)
    expect(grid.slice(0, 4).every((c) => !c.inMonth)).toBe(true)
    expect(grid[0].date).toBe('2025-04-27')
    expect(grid[4]).toEqual({ date: '2025-05-01', day: 1, dow: 4, inMonth: true })
  })

  it('해당 월의 날짜 개수가 실제 일수와 같다', () => {
    expect(buildMonthGrid(2026, 8).filter((c) => c.inMonth)).toHaveLength(31)
    expect(buildMonthGrid(2026, 9).filter((c) => c.inMonth)).toHaveLength(30)
    expect(buildMonthGrid(2026, 2).filter((c) => c.inMonth)).toHaveLength(28)
  })

  it('윤년 2월은 29일이다', () => {
    expect(buildMonthGrid(2024, 2).filter((c) => c.inMonth)).toHaveLength(29)
    expect(buildMonthGrid(2000, 2).filter((c) => c.inMonth)).toHaveLength(29)
    expect(buildMonthGrid(1900, 2).filter((c) => c.inMonth)).toHaveLength(28)
  })

  it('연말 경계 — 12월 격자는 다음 해 1월로 이어진다', () => {
    const grid = buildMonthGrid(2026, 12)
    const after = grid.filter((c) => !c.inMonth && c.date > '2026-12-31')
    expect(after[0].date).toBe('2027-01-01')
  })

  it('연초 경계 — 1월 격자는 이전 해 12월에서 시작한다', () => {
    const grid = buildMonthGrid(2026, 1)
    expect(grid[0].date.startsWith('2025-12')).toBe(true)
  })

  it('날짜가 하루씩 빠짐없이 이어진다', () => {
    const grid = buildMonthGrid(2026, 8)
    for (let i = 1; i < grid.length; i++) {
      const prev = Date.parse(grid[i - 1].date + 'T00:00:00Z')
      const cur = Date.parse(grid[i].date + 'T00:00:00Z')
      expect(cur - prev).toBe(86_400_000)
    }
  })

  it('day 필드는 date의 일(day) 부분과 일치한다', () => {
    for (const cell of buildMonthGrid(2026, 8)) {
      expect(cell.day).toBe(Number(cell.date.slice(8, 10)))
    }
  })
})

describe('키 함수', () => {
  it('monthKey는 월을 두 자리로 채운다', () => {
    expect(monthKey(2026, 8)).toBe('2026-08')
    expect(monthKey(2026, 12)).toBe('2026-12')
  })

  it('dateKey는 월·일을 두 자리로 채운다', () => {
    expect(dateKey(2026, 8, 3)).toBe('2026-08-03')
    expect(dateKey(2026, 11, 25)).toBe('2026-11-25')
  })

  it('parseMonthKey는 monthKey의 역함수다', () => {
    expect(parseMonthKey('2026-08')).toEqual({ year: 2026, month: 8 })
  })

  it('parseMonthKey는 잘못된 입력에 null을 준다', () => {
    expect(parseMonthKey('2026-13')).toBeNull()
    expect(parseMonthKey('2026-00')).toBeNull()
    expect(parseMonthKey('쓰레기')).toBeNull()
    expect(parseMonthKey('2026-8')).toBeNull()
  })
})

describe('previousMonth', () => {
  it('같은 해 안에서 한 달 뺀다', () => {
    expect(previousMonth(2026, 8)).toEqual({ year: 2026, month: 7 })
  })

  it('1월의 이전 달은 전년도 12월이다', () => {
    expect(previousMonth(2026, 1)).toEqual({ year: 2025, month: 12 })
  })
})

describe('MONTH_NAMES_EN', () => {
  it('12개이고 1월은 JANUARY다', () => {
    expect(MONTH_NAMES_EN).toHaveLength(12)
    expect(MONTH_NAMES_EN[0]).toBe('JANUARY')
    expect(MONTH_NAMES_EN[11]).toBe('DECEMBER')
  })
})
