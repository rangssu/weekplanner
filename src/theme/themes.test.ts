import { describe, expect, it } from 'vitest'
import { DEFAULT_THEME_ID } from '../model/defaults'
import { ACCENT_COUNT, getTheme, THEMES, withAlpha } from './themes'

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

describe('다크 테마 격자선', () => {
  it('칸 배경과 충분히 대비된다', () => {
    // 어두운 배경에서는 선을 더 밝게 해야 뚜렷해진다. 더 어둡게 하면
    // 배경에 묻혀 오히려 안 보인다.
    const dark = getTheme('dark')
    expect(dark.cellBorder).toBe('#8a90b5')
    expect(dark.cellBackground).toBe('#2b2e42')
  })
})

describe('withAlpha', () => {
  it('알파가 1이면 원래 문자열을 그대로 준다', () => {
    // 기본값 상태에서 지금까지 만든 결과물과 문자열 단위로 같아야 회귀가 없다.
    expect(withAlpha('#2b2e42', 1)).toBe('#2b2e42')
  })

  it('알파가 1보다 커도 원래 문자열을 준다', () => {
    expect(withAlpha('#2b2e42', 1.5)).toBe('#2b2e42')
  })

  it('알파를 rgba로 바꾼다', () => {
    expect(withAlpha('#ffffff', 0.5)).toBe('rgba(255, 255, 255, 0.5)')
    expect(withAlpha('#2b2e42', 0)).toBe('rgba(43, 46, 66, 0)')
  })

  it('대문자 표기도 처리한다', () => {
    expect(withAlpha('#FFE680', 0.4)).toBe('rgba(255, 230, 128, 0.4)')
  })

  it('음수 알파는 0으로 자른다', () => {
    expect(withAlpha('#ffffff', -1)).toBe('rgba(255, 255, 255, 0)')
  })

  it('#rrggbb 꼴이 아니면 그대로 돌려준다', () => {
    // 테마 값은 전부 #rrggbb지만, 못 알아보는 값에 rgba(NaN)을 만들면
    // 색이 통째로 사라진다. 원본을 주는 쪽이 안전하다.
    expect(withAlpha('rgba(0,0,0,.5)', 0.5)).toBe('rgba(0,0,0,.5)')
    expect(withAlpha('#fff', 0.5)).toBe('#fff')
    expect(withAlpha('', 0.5)).toBe('')
  })
})
