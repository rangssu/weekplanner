import { describe, expect, it } from 'vitest'
import { createEmptyDoc } from '../model/defaults'
import {
  CELL_EXTRA_HEIGHT, CELL_TEXT_HEIGHT, CELL_TEXT_LINE_HEIGHT, CELL_TEXT_MIN_SIZE, CELL_TEXT_WIDTH,
} from '../preview/layout'
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

  it('추가 문구만 있어도 항목을 유지한다', () => {
    const doc = updateDay(createEmptyDoc(2026, 8), '2026-08-03', { extra: '12h' })
    expect(doc.days['2026-08-03']?.extra).toBe('12h')
  })

  it('추가 문구를 지우면 다른 게 없을 때 항목이 사라진다', () => {
    // extra만으로 항목이 시작하면, 텍스트가 처음부터 없어 isBlankDayEntry에
    // extra 조건이 없어도 우연히 통과해버린다(text가 이미 비어 있으니까).
    // 그래서 text가 있는 항목에서 text를 먼저 비워 extra 하나로만 버티게
    // 만든 다음에 지워야, extra 조건이 실제로 지우는 걸 막고 있었는지 검증된다.
    let doc = updateDay(createEmptyDoc(2026, 8), '2026-08-03', { text: '방송', extra: '12h' })
    doc = updateDay(doc, '2026-08-03', { text: '' })
    expect(doc.days['2026-08-03']?.extra).toBe('12h')
    doc = updateDay(doc, '2026-08-03', { extra: '' })
    expect(doc.days['2026-08-03']).toBeUndefined()
  })

  it('추가 문구가 공백뿐이면 빈 항목으로 본다', () => {
    const doc = updateDay(createEmptyDoc(2026, 8), '2026-08-03', { extra: '   ' })
    expect(doc.days['2026-08-03']).toBeUndefined()
  })

  it('아이콘만 있어도 항목을 유지한다', () => {
    const doc = updateDay(createEmptyDoc(2026, 8), '2026-08-03', { icon: 'star' })
    expect(doc.days['2026-08-03']?.icon).toBe('star')
  })

  it('아이콘을 지우면 다른 게 없을 때 항목이 사라진다', () => {
    // icon만으로 항목이 시작하면, text가 처음부터 비어 있어 isBlankDayEntry에
    // icon 조건이 없어도 우연히 통과해버린다(text가 이미 비어 있으니까).
    // 그래서 text가 있는 항목에서 text를 먼저 비워 icon 하나로만 버티게
    // 만든 다음에 지워야, icon 조건이 실제로 지우는 걸 막고 있었는지 검증된다.
    let doc = updateDay(createEmptyDoc(2026, 8), '2026-08-03', { text: '방송', icon: 'star' })
    doc = updateDay(doc, '2026-08-03', { text: '' })
    expect(doc.days['2026-08-03']?.icon).toBe('star')
    doc = updateDay(doc, '2026-08-03', { icon: undefined })
    expect(doc.days['2026-08-03']).toBeUndefined()
  })

  it('추가 문구 필드가 아예 없는 예전 항목도 판정이 동작한다', () => {
    // migrateDoc이 days를 통째로 캐스팅하므로 이 모양이 런타임에 실제로 들어온다.
    const doc = createEmptyDoc(2026, 8)
    doc.days['2026-08-03'] = { text: '방송', dateColor: null, cellFill: null, marker: null }
    const out = updateDay(doc, '2026-08-03', { text: '' })
    expect(out.days['2026-08-03']).toBeUndefined()
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

  it('추가 문구가 있으면 본문 칸이 좁아져, 혼자서는 안 넘치던 글도 넘친다고 본다', () => {
    // isLikelyOverflowing과 같은 방식으로 한 줄당 글자 수 / 최대 줄 수를 구한다.
    // 매직 넘버를 박지 않아야 CELL_* 상수가 바뀌어도 테스트가 계속 맞는다.
    const charsPerLine = Math.max(1, Math.floor(CELL_TEXT_WIDTH / CELL_TEXT_MIN_SIZE))
    const maxLinesWithoutExtra = Math.max(
      1,
      Math.floor(CELL_TEXT_HEIGHT / (CELL_TEXT_MIN_SIZE * CELL_TEXT_LINE_HEIGHT)),
    )
    const maxLinesWithExtra = Math.max(
      1,
      Math.floor(
        (CELL_TEXT_HEIGHT - CELL_EXTRA_HEIGHT) / (CELL_TEXT_MIN_SIZE * CELL_TEXT_LINE_HEIGHT),
      ),
    )
    // extra가 본문을 줄여야 이 테스트가 성립한다 (지금 상수로는 7줄 vs 5줄).
    expect(maxLinesWithExtra).toBeLessThan(maxLinesWithoutExtra)

    // maxLinesWithExtra는 넘고 maxLinesWithoutExtra는 넘지 않는 줄 수를 쓰는
    // 최소 글자 수. ceil(length / charsPerLine) === lines가 되는 가장 짧은 길이다.
    const lines = maxLinesWithExtra + 1
    const text = '가'.repeat((lines - 1) * charsPerLine + 1)

    expect(isLikelyOverflowing(text)).toBe(false)
    expect(isLikelyOverflowing(text, undefined)).toBe(false)
    expect(isLikelyOverflowing(text, '12h')).toBe(true)
  })
})
