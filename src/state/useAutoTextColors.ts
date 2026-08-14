import { useEffect, useMemo, useState } from 'react'
import { measureRegions } from '../model/imageLuminance'
import { blendLuminance, pickTextTone } from '../model/luminance'
import type { AreaTones } from '../model/textColors'
import { TEXT_COLOR_AREAS, type TextColorArea } from '../model/types'
import {
  CELL_AREA_HEIGHT, CELL_AREA_WIDTH, CELL_AREA_X, CELL_AREA_Y,
  OUTER_PADDING, SIDEBAR_WIDTH, TITLE_ROW_HEIGHT, sidebarBoxRects, type BoxRect,
} from '../preview/layout'
import type { Theme } from '../theme/themes'

export type UseAutoTextColorsArgs = {
  backgroundUrl: string | null
  theme: Theme
  boxesEnabled: [boolean, boolean, boolean]
  gridOpacity: number
  sidebarOpacity: number
}

/** 영역마다 배경 이미지의 어느 사각형을 재야 하는지. */
function regionsFor(boxesEnabled: [boolean, boolean, boolean]): Record<string, BoxRect> {
  const [goal, todo, memo] = sidebarBoxRects(boxesEnabled)
  const title: BoxRect = {
    x: OUTER_PADDING, y: OUTER_PADDING, width: SIDEBAR_WIDTH, height: TITLE_ROW_HEIGHT,
  }
  const calendar: BoxRect = {
    x: CELL_AREA_X, y: CELL_AREA_Y, width: CELL_AREA_WIDTH, height: CELL_AREA_HEIGHT,
  }
  // 꺼진 상자는 잴 자리가 없으므로 제목 자리로 대신한다. 그 영역은 어차피
  // 그려지지 않아 어떤 값이 나와도 화면에 영향이 없다.
  return { title, goal: goal ?? title, todo: todo ?? title, memo: memo ?? title, calendar }
}

/**
 * 배경 이미지 밝기로 영역별 글자 톤을 정한다. 배경이 없거나 못 읽으면 null.
 *
 * 이미지 샘플링은 배경이 바뀔 때만 돈다. 불투명도나 테마만 바뀌면 재지 않고
 * 합성만 다시 한다 — 4000×2250을 다시 읽으면 슬라이더를 끌 때마다 멈춘다.
 *
 * 측정 결과에 **어느 배경을 잰 것인지**를 붙여 둔다. 배경이 바뀌면 새 측정이
 * 끝나기 전까지 옛 값을 버려야 하기 때문이다. 그러지 않으면 어두운 사진에서
 * 밝은 사진으로 바꾼 뒤 최대 LOAD_TIMEOUT_MS 동안 밝은 사진 위에 흰 글자가
 * 남고, 그 창에서 내보내면 안 보이는 글자가 그대로 PNG에 박힌다. effect에서
 * setRaw(null)로 지우지 않고 값에 꼬리표를 붙이는 이유는, 그러면 상자 on/off나
 * 테마만 바뀔 때까지 덩달아 테마 기본색으로 한 번 튀기 때문이다 — 그 경우는
 * 배경 그림이 그대로라 옛 값을 잠깐 더 쓰는 편이 맞다.
 */
export function useAutoTextColors({
  backgroundUrl, theme, boxesEnabled, gridOpacity, sidebarOpacity,
}: UseAutoTextColorsArgs): AreaTones {
  const [raw, setRaw] = useState<{ url: string; values: Record<string, number> } | null>(null)

  // 상자 on/off가 바뀌면 재는 자리가 달라지므로 다시 읽어야 한다.
  const enabledKey = boxesEnabled.join(',')

  useEffect(() => {
    if (backgroundUrl === null) {
      setRaw(null)
      return
    }
    let alive = true
    const enabled = enabledKey.split(',').map((v) => v === 'true') as [boolean, boolean, boolean]
    void measureRegions(backgroundUrl, regionsFor(enabled), theme.pageBackground).then((result) => {
      if (alive) setRaw(result === null ? null : { url: backgroundUrl, values: result })
    })
    return () => {
      alive = false
    }
    // theme.pageBackground가 바뀌면 투명 픽셀 뒤에 비치는 색이 달라지므로
    // 다시 재야 한다. theme 객체 전체가 아니라 이 필드만 의존성으로 둔다 —
    // 다른 테마 필드(글자색 등)가 바뀌어도 이미지 자체는 그대로라 재측정할
    // 이유가 없다.
  }, [backgroundUrl, enabledKey, theme.pageBackground])

  return useMemo(() => {
    // 지금 배경을 잰 값이 아니면 없는 것으로 친다.
    if (raw === null || raw.url !== backgroundUrl) return null
    const values = raw.values

    const overlayFor = (area: TextColorArea): { hex: string; opacity: number } => {
      // 제목에는 배경 상자가 없다. 배경 이미지가 그대로 비치므로 덮는 것이 없다.
      if (area === 'title') return { hex: theme.cellBackground, opacity: 0 }
      if (area === 'calendar') return { hex: theme.cellBackground, opacity: gridOpacity }
      return { hex: theme.cellBackground, opacity: sidebarOpacity }
    }

    return Object.fromEntries(
      TEXT_COLOR_AREAS.map((area) => {
        const overlay = overlayFor(area)
        const effective = blendLuminance(values[area] ?? 128, overlay.hex, overlay.opacity)
        return [area, pickTextTone(effective)]
      }),
    ) as NonNullable<AreaTones>
  }, [raw, backgroundUrl, theme, gridOpacity, sidebarOpacity])
}
