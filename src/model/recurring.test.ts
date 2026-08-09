import { beforeEach, describe, expect, it } from 'vitest'
import { buildMonthGrid } from './calendar'
import { createEmptyDoc } from './defaults'
import {
  applyRecurringRules, clearRecurringRules, countClearTargets, countRuleTargets,
  createRecurringRule, loadRecurringRules, type RecurringRule, saveRecurringRules,
} from './recurring'

const rule = (patch: Partial<RecurringRule> = {}): RecurringRule => ({
  ...createRecurringRule([]),
  weekdays: [2], // 화요일
  text: '발로란트 랭크\n21:00',
  ...patch,
})

/** 2026-08의 화요일: 4, 11, 18, 25 */
const AUGUST_TUESDAYS = ['2026-08-04', '2026-08-11', '2026-08-18', '2026-08-25']

const doc = () => createEmptyDoc(2026, 8)

describe('createRecurringRule', () => {
  it('id가 겹치지 않는다', () => {
    const a = createRecurringRule([])
    const b = createRecurringRule([a])
    expect(a.id).not.toBe(b.id)
  })

  it('기본값은 요일 없음 + 빈 텍스트다', () => {
    const created = createRecurringRule([])
    expect(created.weekdays).toEqual([])
    expect(created.text).toBe('')
  })
})

describe('applyRecurringRules', () => {
  it('규칙에 맞는 요일 칸을 전부 채운다', () => {
    const out = applyRecurringRules(doc(), [rule()], 'fill-empty')

    expect(Object.keys(out.days).sort()).toEqual(AUGUST_TUESDAYS)
    for (const date of AUGUST_TUESDAYS) {
      expect(out.days[date].text).toBe('발로란트 랭크\n21:00')
    }
  })

  it('여러 요일을 한 규칙에 넣을 수 있다', () => {
    // 8월의 화요일 4개 + 목요일 4개(6,13,20,27)
    const out = applyRecurringRules(doc(), [rule({ weekdays: [2, 4] })], 'fill-empty')
    expect(Object.keys(out.days)).toHaveLength(8)
  })

  it('강조도 함께 적용된다', () => {
    const out = applyRecurringRules(
      doc(),
      [rule({ cellFill: '#ffd6e0', marker: '#ffe680' })],
      'fill-empty',
    )
    expect(out.days['2026-08-04'].cellFill).toBe('#ffd6e0')
    expect(out.days['2026-08-04'].marker).toBe('#ffe680')
  })

  it('fill-empty는 이미 쓴 칸을 건드리지 않는다', () => {
    const d = doc()
    d.days['2026-08-11'] = { text: '손으로 쓴 일정', dateColor: null, cellFill: null, marker: null }

    const out = applyRecurringRules(d, [rule()], 'fill-empty')
    expect(out.days['2026-08-11'].text).toBe('손으로 쓴 일정')
    expect(out.days['2026-08-04'].text).toBe('발로란트 랭크\n21:00')
  })

  it('overwrite는 이미 쓴 칸도 덮어쓴다', () => {
    const d = doc()
    d.days['2026-08-11'] = { text: '손으로 쓴 일정', dateColor: null, cellFill: null, marker: null }

    const out = applyRecurringRules(d, [rule()], 'overwrite')
    expect(out.days['2026-08-11'].text).toBe('발로란트 랭크\n21:00')
  })

  it('규칙이 다루지 않는 요일의 수동 입력은 어느 모드에서도 남는다', () => {
    const d = doc()
    d.days['2026-08-03'] = { text: '월요일 특별', dateColor: null, cellFill: null, marker: null }

    const out = applyRecurringRules(d, [rule()], 'overwrite')
    expect(out.days['2026-08-03'].text).toBe('월요일 특별')
  })

  it('앞뒤 달 칸에는 넣지 않는다', () => {
    const out = applyRecurringRules(
      doc(),
      [rule({ weekdays: [0, 1, 2, 3, 4, 5, 6] })],
      'fill-empty',
    )
    const inMonth = new Set(buildMonthGrid(2026, 8).filter((c) => c.inMonth).map((c) => c.date))
    for (const key of Object.keys(out.days)) expect(inMonth.has(key)).toBe(true)
    expect(Object.keys(out.days)).toHaveLength(31)
  })

  it('요일이 겹치면 앞쪽 규칙이 이긴다', () => {
    const out = applyRecurringRules(
      doc(),
      [rule({ text: '먼저' }), rule({ text: '나중' })],
      'overwrite',
    )
    expect(out.days['2026-08-04'].text).toBe('먼저')
  })

  it('텍스트가 빈 규칙은 무시한다', () => {
    expect(applyRecurringRules(doc(), [rule({ text: '   ' })], 'fill-empty').days).toEqual({})
  })

  it('요일을 하나도 안 고른 규칙은 무시한다', () => {
    expect(applyRecurringRules(doc(), [rule({ weekdays: [] })], 'fill-empty').days).toEqual({})
  })

  it('규칙이 없으면 문서가 그대로다', () => {
    const d = doc()
    expect(applyRecurringRules(d, [], 'fill-empty')).toEqual(d)
  })

  it('원본을 변경하지 않는다', () => {
    const d = doc()
    applyRecurringRules(d, [rule()], 'fill-empty')
    expect(d.days).toEqual({})
  })

  it('추가 문구는 어느 모드에서도 보존된다', () => {
    // 규칙으로 제목을 다시 뿌려도 날짜별로 적어둔 방송 길이는 살아남아야 한다.
    // 이게 안 되면 추가 문구를 적을 이유가 없다.
    for (const mode of ['fill-empty', 'overwrite'] as const) {
      const d = doc()
      d.days['2026-08-04'] = {
        text: '', dateColor: null, cellFill: null, marker: null, extra: '12h',
      }
      const out = applyRecurringRules(d, [rule()], mode)
      expect(out.days['2026-08-04'].extra).toBe('12h')
      expect(out.days['2026-08-04'].text).toBe('발로란트 랭크\n21:00')
    }
  })

  it('달이 바뀌면 그 달의 요일에 맞춰 채운다', () => {
    // 같은 규칙을 9월에 적용하면 9월의 화요일에 들어간다. 이것이 이 기능의 핵심이다.
    const out = applyRecurringRules(createEmptyDoc(2026, 9), [rule()], 'fill-empty')
    expect(Object.keys(out.days).sort()).toEqual([
      '2026-09-01', '2026-09-08', '2026-09-15', '2026-09-22', '2026-09-29',
    ])
  })
})

describe('countRuleTargets', () => {
  it('fill-empty에서 실제로 채워질 칸 수를 센다', () => {
    const d = doc()
    expect(countRuleTargets(d, [rule()], 'fill-empty')).toBe(4)

    d.days['2026-08-11'] = { text: '이미 있음', dateColor: null, cellFill: null, marker: null }
    expect(countRuleTargets(d, [rule()], 'fill-empty')).toBe(3)
    expect(countRuleTargets(d, [rule()], 'overwrite')).toBe(4)
  })

  it('규칙이 없으면 0이다', () => {
    expect(countRuleTargets(doc(), [], 'fill-empty')).toBe(0)
  })
})

describe('clearRecurringRules', () => {
  const applied = () => applyRecurringRules(doc(), [rule()], 'fill-empty')

  it('규칙이 뿌린 칸을 전부 비운다', () => {
    const out = clearRecurringRules(applied(), [rule()])
    expect(out.days).toEqual({})
  })

  it('한 글자라도 다른 칸은 남긴다', () => {
    const d = applied()
    d.days['2026-08-11'] = {
      text: '발로란트 랭크\n22:00', dateColor: null, cellFill: null, marker: null,
    }
    const out = clearRecurringRules(d, [rule()])
    expect(out.days['2026-08-11'].text).toBe('발로란트 랭크\n22:00')
    expect(Object.keys(out.days)).toEqual(['2026-08-11'])
  })

  it('앞뒤 공백만 다른 칸은 지운다', () => {
    const d = doc()
    d.days['2026-08-04'] = {
      text: '  발로란트 랭크\n21:00  ', dateColor: null, cellFill: null, marker: null,
    }
    expect(clearRecurringRules(d, [rule()]).days).toEqual({})
  })

  it('규칙 요일이 아닌 날에 있어도 텍스트가 맞으면 지운다', () => {
    // 규칙 요일을 나중에 바꿔도 예전에 뿌려둔 칸이 남지 않아야 한다.
    const d = doc()
    d.days['2026-08-03'] = { // 월요일. 규칙은 화요일이다.
      text: '발로란트 랭크\n21:00', dateColor: null, cellFill: null, marker: null,
    }
    expect(clearRecurringRules(d, [rule()]).days).toEqual({})
  })

  it('규칙이 넣었던 강조도 함께 지운다', () => {
    const d = applyRecurringRules(
      doc(), [rule({ cellFill: '#ffd6e0', marker: '#ffe680' })], 'fill-empty',
    )
    expect(clearRecurringRules(d, [rule({ cellFill: '#ffd6e0', marker: '#ffe680' })]).days)
      .toEqual({})
  })

  it('날짜 색은 보존한다', () => {
    const d = applied()
    d.days['2026-08-04'] = { ...d.days['2026-08-04'], dateColor: '#ff0000' }
    const out = clearRecurringRules(d, [rule()])
    // 날짜 색이 남았으므로 빈 항목이 아니고, 키도 살아 있다.
    expect(out.days['2026-08-04'].dateColor).toBe('#ff0000')
    expect(out.days['2026-08-04'].text).toBe('')
    expect(out.days['2026-08-04'].cellFill).toBeNull()
    expect(out.days['2026-08-04'].marker).toBeNull()
  })

  it('추가 문구는 보존한다', () => {
    const d = applied()
    d.days['2026-08-04'] = { ...d.days['2026-08-04'], extra: '12h' }
    const out = clearRecurringRules(d, [rule()])
    expect(out.days['2026-08-04'].extra).toBe('12h')
    expect(out.days['2026-08-04'].text).toBe('')
  })

  it('여러 규칙 중 하나라도 맞으면 지운다', () => {
    const d = applyRecurringRules(
      doc(), [rule(), rule({ weekdays: [5], text: '금요일 방송' })], 'fill-empty',
    )
    const out = clearRecurringRules(d, [rule({ weekdays: [5], text: '금요일 방송' })])
    // 금요일 칸만 사라지고 화요일 칸 4개는 남는다.
    expect(Object.keys(out.days).sort()).toEqual(AUGUST_TUESDAYS)
  })

  it('텍스트가 빈 규칙은 무시한다', () => {
    const d = doc()
    d.days['2026-08-04'] = { text: '', dateColor: null, cellFill: '#ffd6e0', marker: null }
    const out = clearRecurringRules(d, [rule({ text: '   ' })])
    expect(out.days['2026-08-04'].cellFill).toBe('#ffd6e0')
  })

  it('요일을 안 고른 규칙도 텍스트가 맞으면 지운다', () => {
    // 삭제는 요일을 보지 않으므로 요일이 비어도 동작한다.
    expect(clearRecurringRules(applied(), [rule({ weekdays: [] })]).days).toEqual({})
  })

  it('규칙이 없으면 문서를 그대로 돌려준다', () => {
    const d = applied()
    expect(clearRecurringRules(d, [])).toBe(d)
  })

  it('지울 칸이 없으면 문서를 그대로 돌려준다', () => {
    const d = doc()
    expect(clearRecurringRules(d, [rule()])).toBe(d)
  })

  it('원본을 변경하지 않는다', () => {
    const d = applied()
    clearRecurringRules(d, [rule()])
    expect(Object.keys(d.days)).toHaveLength(4)
  })

  it('앞뒤 달 칸은 건드리지 않는다', () => {
    const d = doc()
    d.days['2026-07-28'] = { // 7월 화요일. 8월 격자에 보이지만 8월이 아니다.
      text: '발로란트 랭크\n21:00', dateColor: null, cellFill: null, marker: null,
    }
    expect(clearRecurringRules(d, [rule()]).days['2026-07-28'].text)
      .toBe('발로란트 랭크\n21:00')
  })
})

describe('countClearTargets', () => {
  it('실제로 비워질 칸 수를 센다', () => {
    const d = applyRecurringRules(doc(), [rule()], 'fill-empty')
    expect(countClearTargets(d, [rule()])).toBe(4)

    d.days['2026-08-11'] = { text: '손으로 고침', dateColor: null, cellFill: null, marker: null }
    expect(countClearTargets(d, [rule()])).toBe(3)
  })

  it('규칙이 없으면 0이다', () => {
    expect(countClearTargets(doc(), [])).toBe(0)
  })

  it('빈 문서면 0이다', () => {
    expect(countClearTargets(doc(), [rule()])).toBe(0)
  })
})

describe('전역 규칙 저장', () => {
  beforeEach(() => localStorage.clear())

  it('저장한 규칙을 그대로 되돌려준다', () => {
    const rules = [rule({ text: '화요일 방송' }), rule({ weekdays: [5], text: '금요일 방송' })]
    saveRecurringRules(rules)
    expect(loadRecurringRules()).toEqual(rules)
  })

  it('저장된 게 없으면 빈 배열이다', () => {
    expect(loadRecurringRules()).toEqual([])
  })

  it('손상된 데이터는 빈 배열로 처리하고 예외를 던지지 않는다', () => {
    localStorage.setItem('weekplanner:rules', '{망가진')
    expect(loadRecurringRules()).toEqual([])
  })

  it('배열이 아닌 값도 빈 배열로 처리한다', () => {
    localStorage.setItem('weekplanner:rules', '{"a":1}')
    expect(loadRecurringRules()).toEqual([])
  })

  it('규칙 모양이 아닌 항목은 걸러낸다', () => {
    localStorage.setItem('weekplanner:rules', JSON.stringify([{ 이상함: true }, rule()]))
    expect(loadRecurringRules()).toHaveLength(1)
  })

  it('월별 문서와 별개로 저장된다', () => {
    saveRecurringRules([rule()])
    const docKeys = Object.keys(localStorage).filter((k) => k.startsWith('weekplanner:doc:'))
    expect(docKeys).toHaveLength(0)
    expect(loadRecurringRules()).toHaveLength(1)
  })
})
