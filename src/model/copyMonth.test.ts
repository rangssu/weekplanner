import { describe, expect, it } from 'vitest'
import { buildMonthGrid } from './calendar'
import { copyMonthDays } from './copyMonth'
import { createEmptyDoc } from './defaults'

describe('copyMonthDays', () => {
  it('격자 위치 기준으로 옮기므로 요일이 보존된다', () => {
    // 2026-07-15는 수요일. 7월 격자의 인덱스 17이고, 8월 격자의 인덱스 17은 8/12(수)다.
    const src = createEmptyDoc(2026, 7)
    const srcGrid = buildMonthGrid(2026, 7)
    const idx = srcGrid.findIndex((c) => c.date === '2026-07-15')
    src.days['2026-07-15'] = {
      text: '수요일 방송', dateColor: null, cellFill: null, marker: null,
    }

    const out = copyMonthDays(src, 2026, 8)
    const dstGrid = buildMonthGrid(2026, 8)
    const landed = dstGrid[idx]

    expect(landed.inMonth).toBe(true)
    expect(landed.dow).toBe(srcGrid[idx].dow)
    expect(out.days[landed.date]?.text).toBe('수요일 방송')
  })

  it('day entry의 추가 문구(extra)도 같은 격자 위치로 옮겨진다', () => {
    const src = createEmptyDoc(2026, 7)
    const srcGrid = buildMonthGrid(2026, 7)
    const idx = srcGrid.findIndex((c) => c.date === '2026-07-15')
    src.days['2026-07-15'] = {
      text: '수요일 방송', dateColor: null, cellFill: null, marker: null, extra: '12h',
    }

    const out = copyMonthDays(src, 2026, 8)
    const dstGrid = buildMonthGrid(2026, 8)
    const landed = dstGrid[idx]

    expect(out.days[landed.date]?.extra).toBe('12h')
  })

  it('옮겨간 일정은 모두 원래와 같은 요일에 놓인다', () => {
    const src = createEmptyDoc(2026, 7)
    const srcGrid = buildMonthGrid(2026, 7)
    for (const cell of srcGrid.filter((c) => c.inMonth)) {
      src.days[cell.date] = {
        text: cell.date, dateColor: null, cellFill: null, marker: null,
      }
    }

    const out = copyMonthDays(src, 2026, 8)
    const dowOf = (date: string) => new Date(date + 'T00:00:00Z').getUTCDay()

    for (const [landedDate, entry] of Object.entries(out.days)) {
      // entry.text가 원본 날짜다
      expect(dowOf(landedDate)).toBe(dowOf(entry.text))
    }
  })

  it('원본 달 앞부분은 대상 달 밖으로 밀려나 버려질 수 있다', () => {
    // 주는 7일이고 달은 28~31일이라, 요일을 보존하는 복사는 구조적으로
    // 양 끝에서 며칠을 잃는다. 이것은 결함이 아니라 요일 보존의 대가다.
    const src = createEmptyDoc(2026, 7)
    src.days['2026-07-01'] = { text: '7월 1일', dateColor: null, cellFill: null, marker: null }
    src.days['2026-07-15'] = { text: '7월 15일', dateColor: null, cellFill: null, marker: null }

    const out = copyMonthDays(src, 2026, 8)

    // 7/1은 8월 격자에서 7/29 자리에 떨어지므로 버려진다
    expect(Object.values(out.days).map((e) => e.text)).toEqual(['7월 15일'])
  })

  it('대상 년·월이 바뀐다', () => {
    const out = copyMonthDays(createEmptyDoc(2026, 7), 2026, 8)
    expect(out.year).toBe(2026)
    expect(out.month).toBe(8)
  })

  it('헤더·테마·폰트·배경·스티커를 그대로 가져온다', () => {
    const src = createEmptyDoc(2026, 7)
    src.header.titleMode = 'custom'
    src.header.customTitle = '몬몬 스케줄'
    src.header.goals.enabled = false
    src.header.goals.label = '커스텀 목표'
    src.header.goals.badge = 'GOAL!'
    src.themeId = 'mint'
    src.fontId = 'user-1'
    src.backgroundAssetId = 'bg-1'
    src.gridOpacity = 0.4
    src.sidebarOpacity = 0.7
    src.stickers = [{ id: 's1', assetId: 'a1', x: 10, y: 20, width: 300, rotation: 5, z: 1 }]

    const out = copyMonthDays(src, 2026, 8)

    expect(out.header.customTitle).toBe('몬몬 스케줄')
    expect(out.header.goals.enabled).toBe(false)
    expect(out.header.goals.label).toBe('커스텀 목표')
    expect(out.header.goals.badge).toBe('GOAL!')
    expect(out.themeId).toBe('mint')
    expect(out.fontId).toBe('user-1')
    expect(out.backgroundAssetId).toBe('bg-1')
    expect(out.gridOpacity).toBe(0.4)
    expect(out.sidebarOpacity).toBe(0.7)
    expect(out.stickers).toEqual(src.stickers)
  })

  it('대상 달 밖으로 떨어지는 칸의 내용은 버린다', () => {
    const src = createEmptyDoc(2026, 7)
    const srcGrid = buildMonthGrid(2026, 7)
    for (const cell of srcGrid) {
      src.days[cell.date] = {
        text: `내용-${cell.date}`, dateColor: null, cellFill: null, marker: null,
      }
    }

    const out = copyMonthDays(src, 2026, 8)
    const dstGrid = buildMonthGrid(2026, 8)
    const allowed = new Set(dstGrid.filter((c) => c.inMonth).map((c) => c.date))

    for (const key of Object.keys(out.days)) {
      expect(allowed.has(key)).toBe(true)
    }
  })

  it('원본을 변경하지 않는다', () => {
    const src = createEmptyDoc(2026, 7)
    src.days['2026-07-01'] = { text: '원본', dateColor: null, cellFill: null, marker: null }
    const out = copyMonthDays(src, 2026, 8)
    out.header.customTitle = '변경됨'
    expect(src.year).toBe(2026)
    expect(src.month).toBe(7)
    expect(src.header.customTitle).toBe('')
    expect(src.days['2026-07-01'].text).toBe('원본')
  })

  it('빈 칸은 복사하지 않는다', () => {
    const src = createEmptyDoc(2026, 7)
    const out = copyMonthDays(src, 2026, 8)
    expect(out.days).toEqual({})
  })
})
