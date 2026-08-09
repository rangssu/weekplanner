import { buildMonthGrid } from './calendar'
import type { DayEntry, ScheduleDoc } from './types'

/**
 * 요일 반복 규칙.
 *
 * "매주 화·목 21시 방송"처럼 고정 요일 스케줄을 한 번 적어두고 매달 재사용한다.
 * 이 도구가 템플릿 파일을 이기는 지점이 여기다. 매달 30칸을 손으로 채우는 대신
 * 규칙을 적용하고 예외만 고치면 된다.
 *
 * **규칙은 월별 문서가 아니라 전역으로 저장한다.** "이 달의 데이터"가 아니라
 * "이 사람의 방송 패턴"이기 때문이다. 문서 안에 두면 새 달을 열 때마다
 * 규칙이 사라진다(실제로 그렇게 만들었다가 고쳤다).
 */
export type RecurringRule = {
  id: string
  /** 0=일 … 6=토 */
  weekdays: number[]
  /** 칸에 넣을 일정 텍스트 */
  text: string
  /** 함께 적용할 칸 배경색 */
  cellFill: string | null
  /** 함께 적용할 형광펜 색 */
  marker: string | null
}

/** 이미 쓴 칸을 어떻게 다룰지 */
export type ApplyMode = 'fill-empty' | 'overwrite'

export function createRecurringRule(existing: RecurringRule[]): RecurringRule {
  let id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  while (existing.some((r) => r.id === id)) {
    id = `${id}x`
  }
  return { id, weekdays: [], text: '', cellFill: null, marker: null }
}

/** 실제로 칸을 만들어낼 수 있는 규칙만 남긴다. */
function usableRules(rules: RecurringRule[]): RecurringRule[] {
  return rules.filter((r) => r.weekdays.length > 0 && r.text.trim() !== '')
}

const hasContent = (entry: DayEntry | undefined): boolean =>
  entry !== undefined &&
  (entry.text.trim() !== '' || entry.cellFill !== null || entry.marker !== null)

/**
 * 규칙이 적용될 날짜와 그때 들어갈 내용을 계산한다.
 * 여러 규칙이 같은 요일을 다루면 **배열 앞쪽 규칙이 이긴다**. 우선순위 목록처럼
 * 위에 있는 것이 우선이라 예측하기 쉽다.
 */
function plan(doc: ScheduleDoc, allRules: RecurringRule[], mode: ApplyMode): Map<string, DayEntry> {
  const rules = usableRules(allRules)
  const result = new Map<string, DayEntry>()
  if (rules.length === 0) return result

  for (const cell of buildMonthGrid(doc.year, doc.month)) {
    if (!cell.inMonth) continue
    if (mode === 'fill-empty' && hasContent(doc.days[cell.date])) continue

    const rule = rules.find((r) => r.weekdays.includes(cell.dow))
    if (!rule) continue

    result.set(cell.date, {
      // 날짜 숫자 색은 규칙이 건드리지 않는다. 공휴일 표시처럼 날짜 자체의
      // 성격을 나타내는 것이라 반복 일정과 성격이 다르다.
      dateColor: doc.days[cell.date]?.dateColor ?? null,
      // 추가 문구도 마찬가지다. 규칙은 요일에 묶인 것을 다루고, 추가 문구는
      // 날짜마다 다른 값이라 규칙이 덮으면 안 된다.
      extra: doc.days[cell.date]?.extra,
      text: rule.text,
      cellFill: rule.cellFill,
      marker: rule.marker,
    })
  }
  return result
}

/** 규칙을 적용한 새 문서를 만든다. */
export function applyRecurringRules(
  doc: ScheduleDoc,
  rules: RecurringRule[],
  mode: ApplyMode,
): ScheduleDoc {
  const filled = plan(doc, rules, mode)
  if (filled.size === 0) return doc

  const days = { ...doc.days }
  for (const [date, entry] of filled) days[date] = entry
  return { ...doc, days }
}

/** 적용하면 몇 칸이 바뀌는지. 버튼에 미리 보여주기 위한 것. */
export function countRuleTargets(
  doc: ScheduleDoc,
  rules: RecurringRule[],
  mode: ApplyMode,
): number {
  return plan(doc, rules, mode).size
}

const RULES_KEY = 'weekplanner:rules'

/** 전역 규칙을 읽는다. 없거나 깨졌으면 빈 배열. */
export function loadRecurringRules(): RecurringRule[] {
  const raw = localStorage.getItem(RULES_KEY)
  if (raw === null) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (r): r is RecurringRule =>
        typeof r === 'object' && r !== null && Array.isArray((r as RecurringRule).weekdays),
    )
  } catch {
    return []
  }
}

export function saveRecurringRules(rules: RecurringRule[]): void {
  try {
    localStorage.setItem(RULES_KEY, JSON.stringify(rules))
  } catch {
    // 규칙은 작아서 용량 초과가 날 일이 거의 없다. 나더라도 문서 저장을 막지 않는다.
  }
}
