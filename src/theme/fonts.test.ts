import { describe, expect, it } from 'vitest'
import { DEFAULT_FONT_ID } from '../model/defaults'
import { BUILTIN_FONTS, fontFaceRule, fontFamilyFor, fontFormatFor, type FontOption } from './fonts'

const userFont: FontOption = {
  id: 'user-abc', label: '내 폰트', family: 'wp-user-abc', source: 'user', assetId: 'abc',
}

describe('BUILTIN_FONTS', () => {
  it('기본 폰트 id가 실제로 존재한다', () => {
    expect(BUILTIN_FONTS.some((f) => f.id === DEFAULT_FONT_ID)).toBe(true)
  })

  it('모든 내장 폰트는 source가 builtin이고 assetId가 없다', () => {
    for (const font of BUILTIN_FONTS) {
      expect(font.source).toBe('builtin')
      expect(font.assetId).toBeNull()
    }
  })

  it('id가 중복되지 않는다', () => {
    expect(new Set(BUILTIN_FONTS.map((f) => f.id)).size).toBe(BUILTIN_FONTS.length)
  })
})

describe('fontFamilyFor', () => {
  it('내장 폰트 id로 family를 찾는다', () => {
    const builtin = BUILTIN_FONTS[0]
    expect(fontFamilyFor(builtin.id, [])).toBe(builtin.family)
  })

  it('업로드 폰트 id로 family를 찾는다', () => {
    expect(fontFamilyFor('user-abc', [userFont])).toBe('wp-user-abc')
  })

  it('없는 id면 기본 폰트 family로 되돌아간다', () => {
    const fallback = BUILTIN_FONTS.find((f) => f.id === DEFAULT_FONT_ID)!
    expect(fontFamilyFor('사라진폰트', [])).toBe(fallback.family)
  })

  it('삭제된 업로드 폰트를 가리켜도 기본으로 되돌아간다', () => {
    const fallback = BUILTIN_FONTS.find((f) => f.id === DEFAULT_FONT_ID)!
    expect(fontFamilyFor('user-abc', [])).toBe(fallback.family)
  })
})

describe('fontFormatFor', () => {
  it('지원 확장자를 CSS format 문자열로 바꾼다', () => {
    expect(fontFormatFor('내폰트.woff2')).toBe('woff2')
    expect(fontFormatFor('내폰트.woff')).toBe('woff')
    expect(fontFormatFor('내폰트.ttf')).toBe('truetype')
    expect(fontFormatFor('내폰트.otf')).toBe('opentype')
  })

  it('대소문자를 가리지 않는다', () => {
    expect(fontFormatFor('MyFont.TTF')).toBe('truetype')
  })

  it('지원하지 않는 확장자는 null이다', () => {
    expect(fontFormatFor('그림.png')).toBeNull()
    expect(fontFormatFor('확장자없음')).toBeNull()
  })

  it('점이 여러 개여도 마지막 확장자를 본다', () => {
    expect(fontFormatFor('Cafe24Dongdong-v2.0.ttf')).toBe('truetype')
  })
})

describe('fontFaceRule', () => {
  it('data URL을 담은 @font-face 규칙을 만든다', () => {
    const rule = fontFaceRule('wp-user-abc', 'data:font/woff2;base64,AAA', 'woff2')
    expect(rule).toContain("font-family: 'wp-user-abc'")
    expect(rule).toContain("url(data:font/woff2;base64,AAA) format('woff2')")
    expect(rule).toContain('font-display: block')
  })
})
