export const GRID_COLUMNS = 7
export const GRID_ROWS = 6
export const GRID_CELL_COUNT = GRID_COLUMNS * GRID_ROWS

export const MONTH_NAMES_EN = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
] as const satisfies readonly string[]

export type GridCell = {
  /** "2026-08-03" */
  date: string
  /** 1-31 */
  day: number
  /** 0=일 … 6=토 */
  dow: number
  /** 표시 중인 달에 속하는 날짜인지 */
  inMonth: boolean
}

const pad2 = (n: number) => String(n).padStart(2, '0')

export function monthKey(year: number, month: number): string {
  return `${year}-${pad2(month)}`
}

export function dateKey(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`
}

export function parseMonthKey(key: string): { year: number; month: number } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(key)
  if (!m) return null
  const year = Number(m[1])
  const month = Number(m[2])
  if (month < 1 || month > 12) return null
  return { year, month }
}

export function previousMonth(year: number, month: number): { year: number; month: number } {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 }
}

/**
 * 년·월을 항상 42칸(7×6)의 격자로 펼친다.
 * 첫 칸은 그 달 1일이 속한 주의 일요일, 이후 42일 연속.
 * 시간대 버그를 피하기 위해 전 구간 UTC로 계산한다.
 */
export function buildMonthGrid(year: number, month: number): GridCell[] {
  const first = new Date(Date.UTC(year, month - 1, 1))
  const start = new Date(first)
  start.setUTCDate(start.getUTCDate() - first.getUTCDay())

  const cells: GridCell[] = []
  for (let i = 0; i < GRID_CELL_COUNT; i++) {
    const d = new Date(start)
    d.setUTCDate(start.getUTCDate() + i)
    cells.push({
      date: `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`,
      day: d.getUTCDate(),
      dow: d.getUTCDay(),
      inMonth: d.getUTCFullYear() === year && d.getUTCMonth() === month - 1,
    })
  }
  return cells
}
