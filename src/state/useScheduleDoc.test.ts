import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createEmptyDoc } from '../model/defaults'
import { loadDoc, saveDoc } from '../model/storage'
import { AUTOSAVE_DELAY_MS, useScheduleDoc } from './useScheduleDoc'

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const flushAutosave = () => act(() => void vi.advanceTimersByTime(AUTOSAVE_DELAY_MS + 10))

describe('useScheduleDoc', () => {
  it('저장된 게 없으면 빈 문서로 시작한다', () => {
    const { result } = renderHook(() => useScheduleDoc(2026, 8))
    expect(result.current.doc.year).toBe(2026)
    expect(result.current.doc.month).toBe(8)
    expect(result.current.doc.days).toEqual({})
  })

  it('저장된 문서가 있으면 불러온다', () => {
    const saved = createEmptyDoc(2026, 8)
    saved.header.customTitle = '저장됨'
    saveDoc(saved)

    const { result } = renderHook(() => useScheduleDoc(2026, 8))
    expect(result.current.doc.header.customTitle).toBe('저장됨')
  })

  it('변경하면 잠시 뒤 자동 저장된다', () => {
    const { result } = renderHook(() => useScheduleDoc(2026, 8))

    act(() => {
      result.current.setDoc((prev) => ({
        ...prev, header: { ...prev.header, customTitle: '자동저장' },
      }))
    })
    expect(loadDoc(2026, 8)).toBeNull()

    flushAutosave()
    expect(loadDoc(2026, 8)?.header.customTitle).toBe('자동저장')
  })

  it('월을 바꾸면 현재 작업을 즉시 저장하고 대상 월을 불러온다', () => {
    const { result } = renderHook(() => useScheduleDoc(2026, 8))

    act(() => {
      result.current.setDoc((prev) => ({ ...prev, header: { ...prev.header, customTitle: '8월분' } }))
    })
    act(() => result.current.goToMonth(2026, 9))

    expect(loadDoc(2026, 8)?.header.customTitle).toBe('8월분')
    expect(result.current.doc.month).toBe(9)
    expect(result.current.doc.header.customTitle).toBe('')
  })

  it('돌아오면 아까 내용이 남아 있다', () => {
    const { result } = renderHook(() => useScheduleDoc(2026, 8))
    act(() => {
      result.current.setDoc((prev) => ({ ...prev, header: { ...prev.header, customTitle: '8월분' } }))
    })
    act(() => result.current.goToMonth(2026, 9))
    act(() => result.current.goToMonth(2026, 8))
    expect(result.current.doc.header.customTitle).toBe('8월분')
  })

  it('지난달 복사는 이전 달 문서를 현재 달로 가져온다', () => {
    const july = createEmptyDoc(2026, 7)
    july.days['2026-07-15'] = { text: '수요일 방송', dateColor: null, cellFill: null, marker: null }
    saveDoc(july)

    const { result } = renderHook(() => useScheduleDoc(2026, 8))
    let outcome: 'ok' | 'no-source' = 'no-source'
    act(() => {
      outcome = result.current.copyFromPreviousMonth()
    })

    expect(outcome).toBe('ok')
    expect(Object.keys(result.current.doc.days).length).toBe(1)
    expect(result.current.doc.month).toBe(8)
  })

  it('이전 달 문서가 없으면 no-source를 주고 현재 문서를 건드리지 않는다', () => {
    const { result } = renderHook(() => useScheduleDoc(2026, 8))
    let outcome: 'ok' | 'no-source' = 'ok'
    act(() => {
      outcome = result.current.copyFromPreviousMonth()
    })
    expect(outcome).toBe('no-source')
    expect(result.current.doc.days).toEqual({})
  })

  it('저장 실패를 saveError로 알린다', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      const err = new Error('quota') as Error & { name: string }
      err.name = 'QuotaExceededError'
      throw err
    })

    const { result } = renderHook(() => useScheduleDoc(2026, 8))
    act(() => {
      result.current.setDoc((prev) => ({ ...prev, header: { ...prev.header, customTitle: 'x' } }))
    })
    flushAutosave()

    expect(result.current.saveError).toBe('quota')
  })

  it('아무것도 안 고쳤으면 저장하지 않는다', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem')
    renderHook(() => useScheduleDoc(2026, 8))
    flushAutosave()
    expect(spy).not.toHaveBeenCalled()
  })
})
