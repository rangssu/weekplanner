import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createEmptyDoc } from './defaults'
import { DOC_KEY_PREFIX, listSavedMonthKeys, loadDoc, migrateDoc, saveDoc } from './storage'
import { TEXT_COLOR_AREAS } from './types'

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('saveDoc / loadDoc', () => {
  it('저장한 문서를 그대로 되돌려준다', () => {
    const doc = createEmptyDoc(2026, 8)
    doc.header.customTitle = '몬몬 8월 스케줄'
    doc.days['2026-08-03'] = {
      text: '발로란트\n21:00', dateColor: '#ff0000', cellFill: '#ffe2d3', marker: '#ffe680',
    }

    expect(saveDoc(doc)).toEqual({ ok: true })
    expect(loadDoc(2026, 8)).toEqual(doc)
  })

  it('추가 문구(extra)도 그대로 되돌려준다', () => {
    // migrateDoc은 지금 raw.days를 통째로 캐스팅해서 살아남는다. days도
    // mergeHeader처럼 필드별 화이트리스트로 바뀌면 extra가 조용히 빠질 수
    // 있으므로, 그런 변경이 생기면 이 테스트가 바로 실패해야 한다.
    const doc = createEmptyDoc(2026, 8)
    doc.days['2026-08-03'] = {
      text: '발로란트\n21:00', dateColor: null, cellFill: null, marker: null,
      extra: '12h',
    }

    expect(saveDoc(doc)).toEqual({ ok: true })
    expect(loadDoc(2026, 8)?.days['2026-08-03']?.extra).toBe('12h')
  })

  it('아이콘이 저장·복원을 견딘다', () => {
    // days를 통째로 캐스팅하기에 통과한다. 나중에 mergeHeader처럼 필드
    // 화이트리스트로 조이면 이 테스트가 먼저 깨져야 한다.
    const doc = createEmptyDoc(2026, 8)
    doc.days['2026-08-03'] = {
      text: '', dateColor: null, cellFill: null, marker: null, icon: 'movie',
    }
    saveDoc(doc)
    expect(loadDoc(2026, 8)?.days['2026-08-03'].icon).toBe('movie')
  })

  it('저장된 적 없는 달은 null이다', () => {
    expect(loadDoc(2026, 9)).toBeNull()
  })

  it('같은 달을 다시 저장하면 덮어쓴다', () => {
    const a = createEmptyDoc(2026, 8)
    a.header.customTitle = '첫 번째'
    saveDoc(a)
    const b = createEmptyDoc(2026, 8)
    b.header.customTitle = '두 번째'
    saveDoc(b)
    expect(loadDoc(2026, 8)?.header.customTitle).toBe('두 번째')
  })

  it('용량 초과를 quota로 보고한다', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      const err = new Error('quota') as Error & { name: string }
      err.name = 'QuotaExceededError'
      throw err
    })
    expect(saveDoc(createEmptyDoc(2026, 8))).toEqual({ ok: false, reason: 'quota' })
  })

  it('손상된 JSON은 null로 처리하고 예외를 던지지 않는다', () => {
    localStorage.setItem(`${DOC_KEY_PREFIX}2026-08`, '{망가진')
    expect(loadDoc(2026, 8)).toBeNull()
  })
})

describe('listSavedMonthKeys', () => {
  it('저장된 달만 오름차순으로 준다', () => {
    saveDoc(createEmptyDoc(2026, 9))
    saveDoc(createEmptyDoc(2026, 8))
    saveDoc(createEmptyDoc(2025, 12))
    localStorage.setItem('무관한키', 'x')
    expect(listSavedMonthKeys()).toEqual(['2025-12', '2026-08', '2026-09'])
  })

  it('저장된 게 없으면 빈 배열이다', () => {
    expect(listSavedMonthKeys()).toEqual([])
  })
})

describe('migrateDoc', () => {
  it('현재 버전 문서를 그대로 통과시킨다', () => {
    const doc = createEmptyDoc(2026, 8)
    expect(migrateDoc(doc)).toEqual(doc)
  })

  it('필수 필드가 없으면 null이다', () => {
    expect(migrateDoc({ version: 1 })).toBeNull()
    expect(migrateDoc({ year: 2026, month: 8 })).toBeNull()
    expect(migrateDoc(null)).toBeNull()
    expect(migrateDoc('문자열')).toBeNull()
  })

  it('모르는 미래 버전은 null이다', () => {
    expect(migrateDoc({ ...createEmptyDoc(2026, 8), version: 99 })).toBeNull()
  })

  it('예전 이름(priorities)으로 저장된 메모를 물려받는다', () => {
    const old = createEmptyDoc(2026, 8) as unknown as Record<string, unknown>
    const header = old.header as Record<string, unknown>
    delete header.memo
    header.priorities = { enabled: true, text: '예전에 적어둔 내용' }

    const memo = migrateDoc(old)?.header.memo
    expect(memo?.enabled).toBe(true)
    expect(memo?.text).toBe('예전에 적어둔 내용')
  })

  it('박스 제목과 배지가 없으면 기본값으로 채운다', () => {
    const old = createEmptyDoc(2026, 8) as unknown as Record<string, unknown>
    const header = old.header as Record<string, unknown>
    header.goals = { enabled: true, lines: ['', '', ''] }

    const out = migrateDoc(old)
    expect(out?.header.goals.label).toBe('이번 달의 목표')
    expect(out?.header.goals.badge).toBe('GOALS')
  })

  it('저장된 박스 제목과 배지를 그대로 살린다', () => {
    const doc = createEmptyDoc(2026, 8)
    doc.header.memo.label = '공지'
    doc.header.memo.badge = ''

    const out = migrateDoc(doc)
    expect(out?.header.memo.label).toBe('공지')
    expect(out?.header.memo.badge).toBe('')
  })

  it('빠진 선택 필드를 기본값으로 채운다', () => {
    const partial = createEmptyDoc(2026, 8) as unknown as Record<string, unknown>
    delete partial.stickers
    delete partial.backgroundAssetId
    const out = migrateDoc(partial)
    expect(out?.stickers).toEqual([])
    expect(out?.backgroundAssetId).toBeNull()
  })

  it('투명도가 없으면 1로 채운다', () => {
    const partial = createEmptyDoc(2026, 8) as unknown as Record<string, unknown>
    delete partial.gridOpacity
    delete partial.sidebarOpacity
    const out = migrateDoc(partial)
    expect(out?.gridOpacity).toBe(1)
    expect(out?.sidebarOpacity).toBe(1)
  })

  it('저장된 투명도를 살린다', () => {
    const doc = createEmptyDoc(2026, 8)
    doc.gridOpacity = 0.4
    doc.sidebarOpacity = 0.7
    const out = migrateDoc(doc)
    expect(out?.gridOpacity).toBe(0.4)
    expect(out?.sidebarOpacity).toBe(0.7)
  })

  it('범위 밖이거나 숫자가 아닌 투명도는 1로 되돌린다', () => {
    const broken = createEmptyDoc(2026, 8) as unknown as Record<string, unknown>
    broken.gridOpacity = 5
    broken.sidebarOpacity = '반투명'
    const out = migrateDoc(broken)
    expect(out?.gridOpacity).toBe(1)
    expect(out?.sidebarOpacity).toBe(1)
  })
})

describe('글자색 마이그레이션', () => {
  it('textColors가 없는 예전 문서는 전 영역 auto로 채워진다', () => {
    const old = { ...createEmptyDoc(2026, 8) } as Record<string, unknown>
    delete old.textColors

    const migrated = migrateDoc(old)

    expect(migrated).not.toBeNull()
    for (const area of TEXT_COLOR_AREAS) {
      expect(migrated!.textColors![area]).toEqual({ mode: 'auto', color: null })
    }
  })

  it('저장된 수동 색을 그대로 읽는다', () => {
    const doc = createEmptyDoc(2026, 8)
    doc.textColors!.calendar = { mode: 'manual', color: '#ff0000' }

    const migrated = migrateDoc(JSON.parse(JSON.stringify(doc)))

    expect(migrated!.textColors!.calendar).toEqual({ mode: 'manual', color: '#ff0000' })
  })

  it('모르는 모드가 들어 있으면 auto로 떨어진다', () => {
    const doc = createEmptyDoc(2026, 8) as unknown as Record<string, unknown>
    ;(doc.textColors as Record<string, unknown>).memo = { mode: 'nonsense', color: 123 }

    const migrated = migrateDoc(JSON.parse(JSON.stringify(doc)))

    expect(migrated!.textColors!.memo).toEqual({ mode: 'auto', color: null })
  })
})
