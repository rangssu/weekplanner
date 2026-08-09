import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../preview/layout'
import type { ScheduleDoc, Sticker } from './types'

/** 4000×2250 캔버스 기준 폭 */
export const STICKER_MIN_WIDTH = 60
export const STICKER_MAX_WIDTH = 2000
export const STICKER_DEFAULT_WIDTH = 400

export function clampStickerWidth(width: number): number {
  return Math.min(STICKER_MAX_WIDTH, Math.max(STICKER_MIN_WIDTH, Math.round(width)))
}

export function createSticker(assetId: string, existing: Sticker[]): Sticker {
  const topZ = existing.reduce((max, s) => Math.max(max, s.z), -1)
  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    assetId,
    // 캔버스 한가운데에 놓는다. 사용자가 곧바로 끌어 옮긴다.
    x: Math.round((CANVAS_WIDTH - STICKER_DEFAULT_WIDTH) / 2),
    y: Math.round(CANVAS_HEIGHT / 2 - STICKER_DEFAULT_WIDTH / 2),
    width: STICKER_DEFAULT_WIDTH,
    rotation: 0,
    z: topZ + 1,
  }
}

export function updateSticker(
  doc: ScheduleDoc,
  id: string,
  patch: Partial<Sticker>,
): ScheduleDoc {
  return {
    ...doc,
    stickers: doc.stickers.map((s) => {
      if (s.id !== id) return s
      const next = { ...s, ...patch }
      return { ...next, width: clampStickerWidth(next.width) }
    }),
  }
}

export function removeSticker(doc: ScheduleDoc, id: string): ScheduleDoc {
  return { ...doc, stickers: doc.stickers.filter((s) => s.id !== id) }
}

/**
 * 이웃과 z를 맞바꿔 앞뒤 순서를 바꾼다.
 * 맨 끝이면 아무 일도 하지 않는다.
 */
export function reorderSticker(
  doc: ScheduleDoc,
  id: string,
  direction: 'up' | 'down',
): ScheduleDoc {
  const sorted = [...doc.stickers].sort((a, b) => a.z - b.z)
  const index = sorted.findIndex((s) => s.id === id)
  if (index < 0) return doc

  const swapWith = direction === 'up' ? index + 1 : index - 1
  if (swapWith < 0 || swapWith >= sorted.length) return doc

  const a = sorted[index]
  const b = sorted[swapWith]
  return {
    ...doc,
    stickers: doc.stickers.map((s) =>
      s.id === a.id ? { ...s, z: b.z } : s.id === b.id ? { ...s, z: a.z } : s,
    ),
  }
}
