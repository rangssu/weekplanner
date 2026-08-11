import { describe, expect, it } from 'vitest'
import { getTheme } from '../theme/themes'
import { createEmptyTextColors } from './defaults'
import { resolveTextColors, themeTextColor } from './textColors'
import { TEXT_COLOR_AREAS } from './types'

const pink = getTheme('pink')
const dark = getTheme('dark')

describe('themeTextColor', () => {
  it('제목은 headerText, 나머지는 bodyText다', () => {
    expect(themeTextColor('title', pink)).toBe(pink.headerText)
    expect(themeTextColor('goal', pink)).toBe(pink.bodyText)
    expect(themeTextColor('calendar', pink)).toBe(pink.bodyText)
  })
})

describe('resolveTextColors', () => {
  it('배경 밝기를 모르면 전 영역이 테마 기본색이다', () => {
    const resolved = resolveTextColors(createEmptyTextColors(), pink, null)

    expect(resolved.title).toBe(pink.headerText)
    for (const area of TEXT_COLOR_AREAS) {
      expect(resolved[area], area).toBe(themeTextColor(area, pink))
    }
  })

  it('어두운 배경에서는 밝은 글자를 고른다', () => {
    const tones = Object.fromEntries(
      TEXT_COLOR_AREAS.map((area) => [area, 'light' as const]),
    ) as Record<(typeof TEXT_COLOR_AREAS)[number], 'dark' | 'light'>

    const resolved = resolveTextColors(createEmptyTextColors(), pink, tones)

    expect(resolved.calendar).toBe(pink.autoTextOnDark)
  })

  it('다크 테마에 밝은 배경이면 어두운 글자를 고른다', () => {
    const tones = Object.fromEntries(
      TEXT_COLOR_AREAS.map((area) => [area, 'dark' as const]),
    ) as Record<(typeof TEXT_COLOR_AREAS)[number], 'dark' | 'light'>

    const resolved = resolveTextColors(createEmptyTextColors(), dark, tones)

    expect(resolved.calendar).toBe(dark.autoTextOnLight)
    // 다크 테마의 bodyText는 밝으므로 그대로 쓰면 안 된다.
    expect(resolved.calendar).not.toBe(dark.bodyText)
  })

  it('밝은 배경에서 원래 색이 어두우면 그대로 쓴다', () => {
    // 밝은 사진을 깔아도 지금과 같은 모습이 나와야 한다.
    const tones = Object.fromEntries(
      TEXT_COLOR_AREAS.map((area) => [area, 'dark' as const]),
    ) as Record<(typeof TEXT_COLOR_AREAS)[number], 'dark' | 'light'>

    const resolved = resolveTextColors(createEmptyTextColors(), pink, tones)

    expect(resolved.calendar).toBe(pink.bodyText)
    expect(resolved.title).toBe(pink.headerText)
  })

  it('제목과 본문 색이 다른 테마에서 각자 제 색을 지킨다', () => {
    // 화이트 테마는 제목 #18181b, 본문 #27272a로 갈린다. 극값 하나로
    // 밀어붙이면 제목 색이 조용히 바뀐다.
    const white = getTheme('white')
    const tones = Object.fromEntries(
      TEXT_COLOR_AREAS.map((area) => [area, 'dark' as const]),
    ) as Record<(typeof TEXT_COLOR_AREAS)[number], 'dark' | 'light'>

    const resolved = resolveTextColors(createEmptyTextColors(), white, tones)

    expect(resolved.title).toBe(white.headerText)
    expect(resolved.calendar).toBe(white.bodyText)
    expect(resolved.title).not.toBe(resolved.calendar)
  })

  it('어두운 배경에서 다크 테마는 원래 색을 그대로 쓴다', () => {
    const tones = Object.fromEntries(
      TEXT_COLOR_AREAS.map((area) => [area, 'light' as const]),
    ) as Record<(typeof TEXT_COLOR_AREAS)[number], 'dark' | 'light'>

    const resolved = resolveTextColors(createEmptyTextColors(), dark, tones)

    expect(resolved.calendar).toBe(dark.bodyText)
    expect(resolved.title).toBe(dark.headerText)
  })

  it('직접 고른 색이 자동을 이긴다', () => {
    const settings = createEmptyTextColors()
    settings.memo = { mode: 'manual', color: '#123456' }
    const tones = Object.fromEntries(
      TEXT_COLOR_AREAS.map((area) => [area, 'light' as const]),
    ) as Record<(typeof TEXT_COLOR_AREAS)[number], 'dark' | 'light'>

    const resolved = resolveTextColors(settings, pink, tones)

    expect(resolved.memo).toBe('#123456')
    expect(resolved.goal).toBe(pink.autoTextOnDark)
  })

  it('수동인데 색이 비어 있으면 테마 기본색으로 떨어진다', () => {
    const settings = createEmptyTextColors()
    settings.memo = { mode: 'manual', color: null }

    const resolved = resolveTextColors(settings, pink, null)

    expect(resolved.memo).toBe(pink.bodyText)
  })

  it('설정이 아예 없어도 동작한다', () => {
    const resolved = resolveTextColors(undefined, pink, null)
    expect(resolved.calendar).toBe(pink.bodyText)
  })
})
