import type { Theme } from '../theme/themes'
import { createEmptyTextColors } from './defaults'
import { LUMINANCE_THRESHOLD, hexLuminance } from './luminance'
import { TEXT_COLOR_AREAS, type TextColorArea, type TextColorSetting } from './types'

/** 영역마다 어떤 글자를 얹어야 하는지. null이면 배경을 재지 못했다는 뜻. */
export type AreaTones = Record<TextColorArea, 'dark' | 'light'> | null

export type ResolvedTextColors = Record<TextColorArea, string>

/** 그 영역이 원래 쓰던 테마 색. */
export function themeTextColor(area: TextColorArea, theme: Theme): string {
  return area === 'title' ? theme.headerText : theme.bodyText
}

/**
 * 최종 글자색 5개를 정한다.
 *
 * - 직접 고른 색이 있으면 그것이 이긴다
 * - 자동인데 배경 밝기를 모르면(배경 이미지가 없거나 못 읽었으면) 테마 기본색
 * - 자동이고 배경 밝기를 알면: **원래 색이 그 배경에서 읽히면 그대로 쓰고,
 *   안 읽힐 때만 테마의 극값으로 바꾼다**
 *
 * 두 번째 줄이 중요하다. 배경이 없을 때도 계산하면 저장된 모든 문서의 모습이
 * 바뀐다.
 *
 * 세 번째 줄도 마찬가지다. 극값 하나로 밀어붙이면 headerText와 bodyText가
 * 갈라지는 테마(화이트는 #18181b / #27272a)에서 밝은 사진을 깔았을 때
 * 제목 색이 조용히 바뀐다. 원래 색을 먼저 시험하면 읽히는 한 그대로 남는다.
 */
export function resolveTextColors(
  settings: Record<TextColorArea, TextColorSetting> | undefined,
  theme: Theme,
  tones: AreaTones,
): ResolvedTextColors {
  const source = settings ?? createEmptyTextColors()

  return Object.fromEntries(
    TEXT_COLOR_AREAS.map((area) => {
      const setting = source[area]
      if (setting?.mode === 'manual' && setting.color !== null) {
        return [area, setting.color]
      }

      const own = themeTextColor(area, theme)
      if (tones === null) return [area, own]

      const ownLuma = hexLuminance(own)
      if (tones[area] === 'dark') {
        // 밝은 배경 — 어두운 글자가 필요하다.
        return [area, ownLuma < LUMINANCE_THRESHOLD ? own : theme.autoTextOnLight]
      }
      // 어두운 배경 — 밝은 글자가 필요하다.
      return [area, ownLuma >= LUMINANCE_THRESHOLD ? own : theme.autoTextOnDark]
    }),
  ) as ResolvedTextColors
}
