import { describe, expect, it } from 'vitest'
import { createEmptyDayEntry, createEmptyDoc, DOC_VERSION } from './defaults'
import { GOAL_LINE_COUNT } from './types'

describe('createEmptyDoc', () => {
  it('지정한 년·월을 갖는다', () => {
    const doc = createEmptyDoc(2026, 8)
    expect(doc.year).toBe(2026)
    expect(doc.month).toBe(8)
  })

  it('현재 문서 버전을 갖는다', () => {
    expect(createEmptyDoc(2026, 8).version).toBe(DOC_VERSION)
  })

  it('일정이 비어 있다', () => {
    expect(createEmptyDoc(2026, 8).days).toEqual({})
  })

  it('스티커가 비어 있다', () => {
    expect(createEmptyDoc(2026, 8).stickers).toEqual([])
  })

  it('헤더 기본값은 자동 제목이다', () => {
    expect(createEmptyDoc(2026, 8).header.titleMode).toBe('auto')
  })

  it('사이드바 세 박스는 기본으로 켜져 있다', () => {
    const { header } = createEmptyDoc(2026, 8)
    expect(header.goals.enabled).toBe(true)
    expect(header.todo.enabled).toBe(true)
    expect(header.memo.enabled).toBe(true)
  })

  it('목표는 항상 GOAL_LINE_COUNT줄이다', () => {
    expect(createEmptyDoc(2026, 8).header.goals.lines).toHaveLength(GOAL_LINE_COUNT)
  })

  it('호출할 때마다 독립된 객체를 만든다', () => {
    const a = createEmptyDoc(2026, 8)
    const b = createEmptyDoc(2026, 9)
    a.header.todo.items.push({ text: '오염', checked: false })
    expect(b.header.todo.items).toEqual([])
  })
})

describe('createEmptyDayEntry', () => {
  it('텍스트가 비어 있고 강조가 모두 없다', () => {
    expect(createEmptyDayEntry()).toEqual({
      text: '',
      dateColor: null,
      cellFill: null,
      marker: null,
    })
  })
})
