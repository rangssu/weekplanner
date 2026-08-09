import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createEmptyDoc } from './defaults'
import { DOC_KEY_PREFIX, listSavedMonthKeys, loadDoc, migrateDoc, saveDoc } from './storage'

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
