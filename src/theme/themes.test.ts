import { describe, expect, it } from 'vitest'
import { DEFAULT_THEME_ID } from '../model/defaults'
import { ACCENT_COUNT, getTheme, THEMES } from './themes'

const HEX = /^#[0-9a-f]{6}$/i

describe('THEMES', () => {
  it('5종을 제공한다', () => {
    expect(THEMES).toHaveLength(5)
  })

  it('무채색 기본 테마(화이트)가 있다', () => {
    const white = THEMES.find((t) => t.id === 'white')
    expect(white).toBeDefined()
    expect(white!.pageBackground).toBe('#ffffff')
  })

  it('id가 중복되지 않는다', () => {
    expect(new Set(THEMES.map((t) => t.id)).size).toBe(THEMES.length)
  })

  it('기본 테마 id가 실제로 존재한다', () => {
    expect(THEMES.some((t) => t.id === DEFAULT_THEME_ID)).toBe(true)
  })

  it('모든 테마가 강조 팔레트 6색을 갖는다', () => {
    for (const theme of THEMES) {
      expect(theme.accents).toHaveLength(ACCENT_COUNT)
      for (const color of theme.accents) expect(color).toMatch(HEX)
    }
  })

  it('모든 색상 필드가 유효한 hex다', () => {
    const colorFields = [
      'pageBackground', 'borderColor', 'headerText', 'cellBackground', 'cellBorder',
      'bodyText', 'outsideMonthText', 'sundayText', 'saturdayText',
      'dowHeaderBackground', 'dowHeaderText',
    ] as const
    for (const theme of THEMES) {
      for (const field of colorFields) {
        expect(theme[field], `${theme.id}.${field}`).toMatch(HEX)
      }
    }
  })

  it('모든 테마에 이름이 있다', () => {
    for (const theme of THEMES) expect(theme.name.length).toBeGreaterThan(0)
  })
})

describe('getTheme', () => {
  it('id로 찾는다', () => {
    expect(getTheme('mint').id).toBe('mint')
  })

  it('없는 id면 기본 테마를 준다', () => {
    expect(getTheme('없는테마').id).toBe(DEFAULT_THEME_ID)
  })
})
