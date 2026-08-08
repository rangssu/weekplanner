import { buildMonthGrid } from './calendar'
import type { ScheduleDoc } from './types'

/**
 * 이전 달 문서를 대상 년·월로 복제한다.
 *
 * 일정은 날짜가 아니라 **격자 위치** 기준으로 옮긴다. 두 격자 모두 42칸이고
 * 같은 요일 열에 정렬되어 있으므로, n번째 칸을 n번째 칸으로 옮기면 요일이
 * 자동으로 보존된다. 방송 일정은 "매주 화요일"처럼 요일에 묶이는 경우가
 * 대부분이라 이쪽이 날짜 기준 복사보다 유용하다.
 *
 * 대상 달 밖(앞뒤 달 영역)으로 떨어지는 내용은 버린다.
 */
export function copyMonthDays(
  source: ScheduleDoc,
  targetYear: number,
  targetMonth: number,
): ScheduleDoc {
  const srcGrid = buildMonthGrid(source.year, source.month)
  const dstGrid = buildMonthGrid(targetYear, targetMonth)

  const days: ScheduleDoc['days'] = {}
  for (let i = 0; i < srcGrid.length; i++) {
    const entry = source.days[srcGrid[i].date]
    if (!entry) continue
    const target = dstGrid[i]
    if (!target.inMonth) continue
    days[target.date] = { ...entry }
  }

  return {
    ...structuredClone(source),
    year: targetYear,
    month: targetMonth,
    days,
  }
}
