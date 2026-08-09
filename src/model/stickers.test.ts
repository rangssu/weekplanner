import { describe, expect, it } from 'vitest'
import { createEmptyDoc } from './defaults'
import {
  clampStickerWidth, createSticker, removeSticker, reorderSticker,
  STICKER_DEFAULT_WIDTH, STICKER_MAX_WIDTH, STICKER_MIN_WIDTH, updateSticker,
} from './stickers'
import type { Sticker } from './types'

const sticker = (id: string, z: number): Sticker => ({
  id, assetId: `asset-${id}`, x: 0, y: 0, width: 400, rotation: 0, z,
})

const withStickers = (...stickers: Sticker[]) => ({
  ...createEmptyDoc(2026, 8),
  stickers,
})

describe('createSticker', () => {
  it('기본 크기와 회전 0으로 만든다', () => {
    const created = createSticker('asset-1', [])
    expect(created.width).toBe(STICKER_DEFAULT_WIDTH)
    expect(created.rotation).toBe(0)
    expect(created.assetId).toBe('asset-1')
  })

  it('기존 스티커보다 위에 놓는다', () => {
    expect(createSticker('asset-2', [sticker('a', 3), sticker('b', 7)]).z).toBe(8)
  })

  it('첫 스티커의 z는 0이다', () => {
    expect(createSticker('asset-1', []).z).toBe(0)
  })

  it('id가 겹치지 않는다', () => {
    const a = createSticker('asset-1', [])
    const b = createSticker('asset-1', [a])
    expect(a.id).not.toBe(b.id)
  })
})

describe('clampStickerWidth', () => {
  it('범위 안이면 그대로 둔다', () => {
    expect(clampStickerWidth(400)).toBe(400)
  })

  it('최소·최대를 벗어나면 잘라 맞춘다', () => {
    expect(clampStickerWidth(1)).toBe(STICKER_MIN_WIDTH)
    expect(clampStickerWidth(999_999)).toBe(STICKER_MAX_WIDTH)
  })
})

describe('updateSticker', () => {
  it('해당 스티커만 바꾼다', () => {
    const out = updateSticker(withStickers(sticker('a', 0), sticker('b', 1)), 'a', { x: 500 })
    expect(out.stickers[0].x).toBe(500)
    expect(out.stickers[1].x).toBe(0)
  })

  it('폭은 범위 안으로 잘린다', () => {
    const out = updateSticker(withStickers(sticker('a', 0)), 'a', { width: 1 })
    expect(out.stickers[0].width).toBe(STICKER_MIN_WIDTH)
  })

  it('없는 id는 아무것도 바꾸지 않는다', () => {
    const doc = withStickers(sticker('a', 0))
    expect(updateSticker(doc, '없음', { x: 9 }).stickers).toEqual(doc.stickers)
  })

  it('원본을 변경하지 않는다', () => {
    const doc = withStickers(sticker('a', 0))
    updateSticker(doc, 'a', { x: 500 })
    expect(doc.stickers[0].x).toBe(0)
  })
})

describe('removeSticker', () => {
  it('해당 스티커를 지운다', () => {
    const out = removeSticker(withStickers(sticker('a', 0), sticker('b', 1)), 'a')
    expect(out.stickers.map((s) => s.id)).toEqual(['b'])
  })

  it('없는 id는 아무 일도 없다', () => {
    expect(removeSticker(withStickers(sticker('a', 0)), '없음').stickers).toHaveLength(1)
  })
})

describe('reorderSticker', () => {
  it('위로 보내면 z가 커진다', () => {
    const out = reorderSticker(withStickers(sticker('a', 0), sticker('b', 1)), 'a', 'up')
    const a = out.stickers.find((s) => s.id === 'a')!
    const b = out.stickers.find((s) => s.id === 'b')!
    expect(a.z).toBeGreaterThan(b.z)
  })

  it('아래로 보내면 z가 작아진다', () => {
    const out = reorderSticker(withStickers(sticker('a', 0), sticker('b', 1)), 'b', 'down')
    const a = out.stickers.find((s) => s.id === 'a')!
    const b = out.stickers.find((s) => s.id === 'b')!
    expect(b.z).toBeLessThan(a.z)
  })

  it('맨 위를 더 올려도 순서가 유지된다', () => {
    const out = reorderSticker(withStickers(sticker('a', 0), sticker('b', 1)), 'b', 'up')
    const sorted = [...out.stickers].sort((p, q) => p.z - q.z).map((s) => s.id)
    expect(sorted).toEqual(['a', 'b'])
  })

  it('스티커가 하나면 아무 일도 없다', () => {
    expect(reorderSticker(withStickers(sticker('a', 0)), 'a', 'up').stickers).toHaveLength(1)
  })
})
