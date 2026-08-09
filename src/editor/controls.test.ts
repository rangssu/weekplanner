import { describe, expect, it } from 'vitest'
import { createEmptyDoc } from '../model/defaults'
import { isLikelyOverflowing, updateDay } from './controls'

describe('updateDay', () => {
  it('없던 날짜에 항목을 만든다', () => {
    const out = updateDay(createEmptyDoc(2026, 8), '2026-08-03', { text: '방송' })
    expect(out.days['2026-08-03']).toEqual({
      text: '방송', dateColor: null, cellFill: null, marker: null,
    })
  })

  it('기존 항목의 일부만 바꾼다', () => {
    let doc = updateDay(createEmptyDoc(2026, 8), '2026-08-03', { text: '방송' })
    doc = updateDay(doc, '2026-08-03', { marker: '#ffe680' })
    expect(doc.days['2026-08-03']).toEqual({
      text: '방송', dateColor: null, cellFill: null, marker: '#ffe680',
    })
  })

  it('내용이 전부 비면 항목을 지운다', () => {
    let doc = updateDay(createEmptyDoc(2026, 8), '2026-08-03', { text: '방송' })
    doc = updateDay(doc, '2026-08-03', { text: '' })
    expect(doc.days['2026-08-03']).toBeUndefined()
  })

  it('텍스트가 비어도 강조가 남아 있으면 항목을 유지한다', () => {
    let doc = updateDay(createEmptyDoc(2026, 8), '2026-08-03', { cellFill: '#ffd6e0' })
    doc = updateDay(doc, '2026-08-03', { text: '' })
    expect(doc.days['2026-08-03']?.cellFill).toBe('#ffd6e0')
  })

  it('원본을 변경하지 않는다', () => {
    const doc = createEmptyDoc(2026, 8)
    updateDay(doc, '2026-08-03', { text: '방송' })
    expect(doc.days).toEqual({})
  })

  it('다른 날짜는 건드리지 않는다', () => {
    let doc = updateDay(createEmptyDoc(2026, 8), '2026-08-03', { text: 'A' })
    doc = updateDay(doc, '2026-08-04', { text: 'B' })
    expect(doc.days['2026-08-03'].text).toBe('A')
    expect(doc.days['2026-08-04'].text).toBe('B')
  })
})

describe('isLikelyOverflowing', () => {
  it('짧은 글은 넘치지 않는다', () => {
    expect(isLikelyOverflowing('저챗')).toBe(false)
    expect(isLikelyOverflowing('발로란트 랭크\n21:00')).toBe(false)
  })

  it('빈 글은 넘치지 않는다', () => {
    expect(isLikelyOverflowing('')).toBe(false)
    expect(isLikelyOverflowing('   ')).toBe(false)
  })

  it('아주 긴 글은 넘친다고 본다', () => {
    expect(isLikelyOverflowing('가'.repeat(400))).toBe(true)
  })

  it('줄바꿈이 아주 많으면 넘친다고 본다', () => {
    expect(isLikelyOverflowing('가\n'.repeat(30))).toBe(true)
  })

  it('한도 언저리에서 단조롭게 판정한다', () => {
    expect(isLikelyOverflowing('가'.repeat(10))).toBe(false)
    expect(isLikelyOverflowing('가'.repeat(1000))).toBe(true)
  })
})
